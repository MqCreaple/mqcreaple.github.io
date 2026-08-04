# mqc.blog

A static blog built with **Typst** for article authoring and **Astro** for the
site shell, theming, i18n, and static deployment.

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

## Content layout

```text
blog/<lang>/<date>/<name>.typ   # Typst articles
blog/<lang>/<date>/             # article-local assets and images
src/layouts/                    # Astro page layouts
src/components/                 # Astro components and custom elements
app/<name>/                     # standalone web apps (HTML/CSS/JS/WASM)
asset/img/                      # shared site assets, such as avatar.png
```
