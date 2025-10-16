import React from 'react'
import { clsx } from 'clsx'

type Page = {
  id: string
  title: string
  file?: string
  href?: string  // e.g. '/ayan-nair-resume.pdf'
}

type Props = {
  pages: Page[]
  activePage: string
  onSelect: (id: string) => void
}

export const TopNav: React.FC<Props> = ({ pages, activePage, onSelect }) => {
  const onClick = (p: Page) => {
    if (p.href) {
      // Open resume (or any external link-type item) in a new tab,
      // while keeping the exact same button styling.
      window.open(p.href, '_blank', 'noopener,noreferrer')
    } else {
      onSelect(p.id)
    }
  }

  return (
    <nav className="topnav" aria-label="Main navigation">
      {pages.map((p) => (
        <button
          key={p.id}
          type="button"
          className={clsx('topnav-item', { active: p.id === activePage && !p.href })}
          onClick={() => onClick(p)}
          title={p.title}
        >
          {p.title}
        </button>
      ))}
    </nav>
  )
}
