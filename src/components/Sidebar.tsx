import React from 'react'
import { clsx } from 'clsx'

type Page = { id: string; title: string; file: string }

type Props = {
  pages: Page[]
  activePage: string
  onSelect: (id: string) => void
}

export const Sidebar: React.FC<Props> = ({ pages, activePage, onSelect }) => {
  return (
    <nav className="sidebar" aria-label="Section navigation">
      <ul>
        {pages.map((p) => (
          <li key={p.id}>
            <button
              className={clsx('nav-item', { active: p.id === activePage })}
              onClick={() => onSelect(p.id)}
            >
              {p.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}


