# AIGameDevHub

Funky hub for free AI & game-dev tools — Godot resources, animation, assets, and shaders.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Cloudflare Pages (free)

Repo: https://github.com/matthewdimelow/thegodotassethub

### Build settings

- **Build command:** `npm run build`
- **Deploy command:** leave **empty** on Pages, or `npx wrangler deploy` on Workers
- **Output directory:** `dist`
- **Node version:** `22` (env var `NODE_VERSION=22`)

This is a static Astro site. You do **not** need the Cloudflare Workers / Astro adapter.

## Content

Edit JSON in `src/data/`:

- `resources.json` — curated external free resources
- `animations.json` — free animation tools & packs
- `assets.json` — hub assets
- `shaders.json` — shader gallery + snippets

Preview art lives in `public/previews/`. Models in `public/models/`.
