# My Personal Blog

A static blog built with **Typst** for article authoring and **Astro** for the
site shell, theming, i18n, and static deployment.

Old blog: [MqCreaple/mqcreaple.github.io-old](https://github.com/MqCreaple/mqcreaple.github.io-old).

## Requirements

- Node.js 20+
- Typst 0.13+ (HTML export support)

Install Typst with:

```powershell
winget install --id Typst.Typst -e
```

If a package manager is unavailable, the build scripts also detect a local
binary at `.tools/typst/typst.exe`.

## Commands

```bash
npm install
npm run dev      # copy apps, compile articles, start Astro dev server
npm run build    # copy apps, compile articles, build static site into output/
npm run preview  # preview the built site
```

`output/` is a pure static site and can be deployed directly to GitHub Pages.
Apps and PDFs are copied into `output/app/` and `output/pdf/` after the Astro
build; during development they are served from `app/` and a local cache.

## Web apps

Two ways to add a web app:

- **Astro-native apps** (recommended for new apps): the page lives at
  `src/pages/app/<name>/index.astro` and uses the shared
  `src/layouts/Base.astro` layout. The default slot holds the main content
  (left column) and the `aside` slot holds the right-hand sidebar, so
  configuring either side is just a matter of passing content to the right slot. App scripts go in
  `src/app/<name>/` (TypeScript) and stylesheet files in
  `src/app/<name>/styles/`; import them in the page so Astro bundles them into the
  build. `npm run typecheck` checks all TypeScript sources.

- **Legacy standalone apps**: the app lives in `app/<name>/` with a
  `metadata.json` (listing scripts/styles and `left.html`/`right.html` markup).
  These pages use `src/layouts/AppLayoutClassical.astro` and their static
  files are served verbatim from `app/`.

## Search

Full-text search is powered by [Pagefind](https://pagefind.app). `npm run build`
indexes the generated site into `output/pagefind/`; a search box in the site
header shows article results in a dropdown, with each article's section titles
collapsed behind a toggle. In `npm run dev`, search works after a production
build (the dev server serves `/pagefind/*` from `output/`).

## Content layout

`asset/` is Astro's public directory, so everything under it is served verbatim
at the site root. Interactive figure scene scripts live beside their posts under
`asset/blog/<lang>/...`; shared scene-side helpers are in
`asset/blog/shared/`, and shared 3D meshes are in `asset/3d/`.

```text
blog/<lang>/<date>/<name>.typ   # Typst article sources
blog/<lang>/<date>/             # article-local assets and images
asset/                          # Astro publicDir, served at the site root
asset/blog/<lang>/<date>/       # per-article interactive figure scene scripts
asset/blog/shared/              # shared scene-side JS helpers (no npm imports)
asset/3d/                       # shared OBJ meshes
asset/img/                      # shared site images, such as avatar.png
src/layouts/                    # Astro page layouts
src/components/                 # Astro components, custom elements, figure builders
src/generated/articles/         # build-generated Typst HTML fragments
src/styles/                     # global and figure CSS
src/app/<name>/                 # scripts/modules of Astro-native web apps
src/app/<name>/styles/          # stylesheet files of Astro-native web apps
scripts/                        # build scripts (Typst -> HTML/PDF, output finalization)
app/<name>/                     # standalone web apps (HTML/CSS/JS/WASM)
output/                         # static build output, deployable to GitHub Pages
```
