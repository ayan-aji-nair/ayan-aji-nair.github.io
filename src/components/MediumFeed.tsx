import React, { useEffect, useMemo, useState } from 'react'

type MediumItem = {
  title: string
  link: string
  pubDate: string
  image?: string
  excerpt?: string
}

type Props = {
  feedUrl: string // e.g., "https://ayannair2021.medium.com/feed"
  maxItems?: number // default 3
  /** If true, fetch/cache but render nothing (for background preloading) */
  prefetchOnly?: boolean
}

/** -------------------- cache so we only load once per session -------------------- */
type CacheValue = { items: MediumItem[] }
const FEED_CACHE: Record<string, CacheValue> = {}

function readSessionCache(key: string): CacheValue | null {
  try {
    const raw = sessionStorage.getItem(`mediumfeed:${key}`)
    if (!raw) return null
    return JSON.parse(raw) as CacheValue
  } catch {
    return null
  }
}
function writeSessionCache(key: string, value: CacheValue) {
  try {
    sessionStorage.setItem(`mediumfeed:${key}`, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.text()
}
async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
}

/** Try AllOrigins (RSS XML) -> returns raw XML string */
async function tryAllOrigins(feedUrl: string): Promise<MediumItem[]> {
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  const xml = await fetchText(proxied)
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) throw new Error('XML parse error (AllOrigins)')

  const nodes = Array.from(doc.getElementsByTagName('item'))
  return nodes.map((item) => {
    const get = (tag: string) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
    const title = get('title')
    const link = get('link')
    const pubDate = get('pubDate')

    const contentEncoded =
      item.getElementsByTagName('content:encoded')[0]?.textContent ||
      item.getElementsByTagName('content')[0]?.textContent ||
      item.getElementsByTagName('description')[0]?.textContent ||
      ''

    const imgMatch = contentEncoded.match(/<img[^>]+src="([^"]+)"/i)
    const image = imgMatch?.[1]

    const textOnly = contentEncoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const excerpt = textOnly.slice(0, 180) + (textOnly.length > 180 ? '…' : '')

    return { title, link, pubDate, image, excerpt }
  })
}

/** Try rss2json (JSON) -> returns items[] with fields we map */
async function tryRss2Json(feedUrl: string): Promise<MediumItem[]> {
  // Free public endpoint; may rate-limit if hammered.
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
  const data = await fetchJSON<{
    status: string
    items: Array<{
      title: string
      link: string
      pubDate: string
      thumbnail?: string
      description?: string
      content?: string
    }>
  }>(api)

  if (data.status !== 'ok') throw new Error('rss2json error')

  return data.items.map((it) => {
    const html = it.content || it.description || ''
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i)
    const image = it.thumbnail || imgMatch?.[1]

    const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const excerpt = textOnly.slice(0, 180) + (textOnly.length > 180 ? '…' : '')

    return {
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      image,
      excerpt,
    }
  })
}

/** Last-resort: Jina Reader (plain text). We heuristically extract titles/links. */
async function tryJinaReader(feedUrl: string): Promise<MediumItem[]> {
  const url = `https://r.jina.ai/${feedUrl}`
  const text = await fetchText(url)

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items: MediumItem[] = []
  for (let i = 0; i < lines.length - 1; i++) {
    const title = lines[i]
    const linkMatch = lines[i + 1].match(/https?:\/\/[^\s)]+/i)
    if (title && linkMatch) {
      items.push({
        title,
        link: linkMatch[0],
        pubDate: new Date().toISOString(),
        excerpt: '',
      })
      if (items.length >= 6) break
    }
  }
  if (items.length === 0) throw new Error('Jina parse fallback failed')
  return items
}

export const MediumFeed: React.FC<Props> = ({ feedUrl, maxItems = 3, prefetchOnly = false }) => {
  const [items, setItems] = useState<MediumItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const cacheKey = feedUrl

  const loaders = useMemo(
    () => [
      () => tryAllOrigins(feedUrl),
      () => tryRss2Json(feedUrl),
      () => tryJinaReader(feedUrl),
    ],
    [feedUrl]
  )

  useEffect(() => {
    let active = true
    setError(null)

    // 1) In-memory cache first
    if (FEED_CACHE[cacheKey]?.items?.length) {
      setItems(FEED_CACHE[cacheKey].items.slice(0, maxItems))
      setLoading(false)
      return
    }

    // 2) sessionStorage cache next
    const sess = readSessionCache(cacheKey)
    if (sess?.items?.length) {
      FEED_CACHE[cacheKey] = sess
      setItems(sess.items.slice(0, maxItems))
      setLoading(false)
      return
    }

    // 3) Fetch once, then store in both caches
    setLoading(true)
    ;(async () => {
      let lastErr: unknown = null
      for (const load of loaders) {
        try {
          const res = await load()
          if (!active) return
          const deduped = dedupeByLink(res).slice(0, maxItems)
          const cacheVal = { items: deduped }
          FEED_CACHE[cacheKey] = cacheVal
          writeSessionCache(cacheKey, cacheVal)
          setItems(deduped)
          setLoading(false)
          return
        } catch (e) {
          lastErr = e
        }
      }
      if (active) {
        setError(`Failed to load Medium posts (${String(lastErr)})`)
        setLoading(false)
      }
    })()

    return () => { active = false }
  }, [cacheKey, loaders, maxItems])

  /* If we're just prefetching, don't render any UI */
  if (prefetchOnly) return null

  if (loading) {
    return (
      <main className="content medium-feed">
        <div className="medium-skeleton">
          <div className="row"></div>
          <div className="row"></div>
          <div className="row"></div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="content medium-feed">
        <p className="error">{error}</p>
        <p className="muted small">If this keeps happening, the public proxies may be rate-limiting. It should work on refresh.</p>
      </main>
    )
  }

  if (!items || items.length === 0) {
    return (
      <main className="content medium-feed">
        <p className="muted small">No recent posts found.</p>
      </main>
    )
  }

  return (
    <main className="content medium-feed" aria-live="polite">
      <div className="medium-grid">
        {items.map((post) => (
          <a
            key={post.link + post.title}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="medium-card"
          >
            {post.image ? (
              <div className="medium-thumb">
                <img src={post.image} alt="" loading="lazy" />
              </div>
            ) : (
              <div className="medium-thumb placeholder" aria-hidden="true" />
            )}

            <div className="medium-body">
              <h3 className="medium-title">{post.title}</h3>
              <div className="medium-meta">
                <time>{safeDate(post.pubDate)}</time>
                <span className="dot">•</span>
                <span>Medium</span>
              </div>
              {post.excerpt && <p className="medium-excerpt">{post.excerpt}</p>}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}

function safeDate(d: string) {
  const dt = new Date(d)
  return isNaN(+dt) ? '' : dt.toLocaleDateString()
}

function dedupeByLink(arr: MediumItem[]): MediumItem[] {
  const seen = new Set<string>()
  const out: MediumItem[] = []
  for (const it of arr) {
    const key = it.link || `${it.title}-${it.pubDate}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(it)
    }
  }
  return out
}
