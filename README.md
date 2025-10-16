# Personal Portfolio (Notion-style)

A sleek, minimalist personal site built with React + TypeScript + Vite. Uses markdown files for page content, with dark/light theme toggle.

## Quick start

```bash
# from /Users/ayan/Projects/PersonalSite
npm install
npm run dev
```

Then open the printed local URL. Toggle theme from the top-right.

## Edit content

Markdown files live under `public/content/`:
- `about.md`
- `projects.md`
- `contact.md`

Edit these or add new ones and wire them in `src/App.tsx` under the `pages` array.

## Structure

- `src/components/Header.tsx` — header with theme toggle
- `src/components/Sidebar.tsx` — small nav
- `src/components/Content.tsx` — markdown renderer (react-markdown + remark-gfm)
- `src/styles.css` — theme tokens and layout styles

## Build

```bash
npm run build
npm run preview
```

## Customization

- Update the brand text in `Header.tsx`
- Add pages by updating the `pages` array in `App.tsx`
- Tweak colors in CSS `:root` variables
