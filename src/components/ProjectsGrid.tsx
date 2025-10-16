import React from 'react'
import { projects } from '../data/projects'

export const ProjectsGrid: React.FC = () => {
  // show exactly the first three projects
  const topThree = projects.slice(0, 3)

  return (
    <main className="content projects" aria-live="polite">
      <div className="projects-grid" role="list">
        {topThree.map((p) => (
          <a
            key={p.href + p.title}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="project-card"
            role="listitem"
            aria-label={`${p.title} — ${p.description}`}
          >
            <div className="project-body">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.description}</p>
            </div>
            <span className="project-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </main>
  )
}
