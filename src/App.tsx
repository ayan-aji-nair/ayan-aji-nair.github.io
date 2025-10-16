import React, { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { TopNav } from './components/TopNav'
import { Content } from './components/Content'
import { ProjectsGrid } from './components/ProjectsGrid'
import { FaLinkedinIn, FaMediumM, FaGithub, FaRegEnvelope } from 'react-icons/fa'
import { MediumFeed } from './components/MediumFeed'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())
  const [activePage, setActivePage] = useState<string>('about')

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.classList.add('theme-animating')
    const t = window.setTimeout(() => {
      root.classList.remove('theme-animating')
    }, 300)
    localStorage.setItem('theme', theme)
    return () => window.clearTimeout(t)
  }, [theme])

  // Ensure ALL external links open in a new tab (not your site)
  useEffect(() => {
    const isExternal = (a: HTMLAnchorElement) => {
      try {
        const u = new URL(a.href, window.location.href)
        return (u.protocol === 'http:' || u.protocol === 'https:') && u.origin !== window.location.origin
      } catch {
        return false
      }
    }
    const applyTo = (root: ParentNode | Document = document) => {
      root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
        if (isExternal(a)) {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        }
      })
    }
    applyTo(document)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) applyTo(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  const pages = useMemo(
    () => [
      { id: 'about',    title: 'about',    file: '/content/about.md' },
      { id: 'projects', title: 'projects', file: '/content/projects.md' },
      { id: 'blog',     title: 'blog',     file: '/content/blog.md' }, // file kept for fallback, but we render MediumFeed
      // New: resume opens a PDF in a new tab (link handled directly by TopNav)
      { id: 'resume',   title: 'resume',   href: '/ayan-nair-resume.pdf' }
    ],
    []
  )

  return (
    <div className={clsx('app')}>
      <button className="toggle floating-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>

      <main className="stack">
        <h1 className="site-title">ayan nair.</h1>
        <TopNav pages={pages} activePage={activePage} onSelect={setActivePage} />

        <div className={clsx('content-container', activePage === 'blog' && 'scrollable')}>
          {activePage === 'blog' ? (
            <MediumFeed feedUrl="https://ayannair2021.medium.com/feed" maxItems={3} />
          ) : activePage === 'projects' ? (
            <ProjectsGrid />
          ) : (
            <Content key={activePage} file={pages.find((p) => p.id === activePage)!.file!} />
          )}
        </div>

        {/* Preload Blog feed once on initial load so it's instant when visiting Blog */}
        <MediumFeed feedUrl="https://ayannair2021.medium.com/feed" prefetchOnly />
      </main>

      {/* fixed social pill (kept outside .stack) */}
      <div className="social-hub" role="complementary" aria-label="Social links">
        <div className="social-panel" aria-hidden="false">
          <a
            href="https://medium.com/@ayannair2021"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
            aria-label="Medium"
            title="Medium"
          >
            <FaMediumM aria-hidden="true" />
          </a>

          <a
            href="https://www.linkedin.com/in/ayan-nair-31388a1b7/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <FaLinkedinIn aria-hidden="true" />
          </a>

          <a
            href="https://github.com/ayan-aji-nair"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
            aria-label="GitHub"
            title="GitHub"
          >
            <FaGithub aria-hidden="true" />
          </a>

          <a href="mailto:you@example.com?subject=Hello&body=Hi%20there!" className="social-trigger" aria-label="Send email" title="Email">
            <FaRegEnvelope aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
