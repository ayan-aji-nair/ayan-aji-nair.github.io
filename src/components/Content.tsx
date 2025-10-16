import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = { file: string }

export const Content: React.FC<Props> = ({ file }) => {
  const [markdown, setMarkdown] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setError(null)
    fetch(file)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))))
      .then((text) => {
        if (active) setMarkdown(text)
      })
      .catch((e) => {
        if (active) setError(`Failed to load content (${String(e)})`)
      })
    return () => {
      active = false
    }
  }, [file])

  if (error) {
    return <main className="content"><p className="error">{error}</p></main>
  }

  return (
    <main className="content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown">
        {markdown}
      </ReactMarkdown>
    </main>
  )
}


