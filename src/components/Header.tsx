import React from 'react'

type Props = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const Header: React.FC<Props> = ({ theme, onToggleTheme }) => {
  return (
    <header className="header">
      <div className="brand">Your Name</div>
      <div className="actions">
        <button className="toggle" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  )
}


