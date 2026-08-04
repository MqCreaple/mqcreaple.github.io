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
src/layouts/                    # Astro page layouts
src/components/                 # Astro components and custom elements
app/<name>/                     # standalone web apps (HTML/CSS/JS/WASM)
asset/img/                      # project images
asset/img/<date>/               # images referenced by blog posts
```

## Writing a post

Create `blog/en/2026-08-04/my-post.typ` and put metadata in the first comment
lines:

```typst
// title: My Post
// summary: A short description.
// tags: typst, astro
// category: tech|humanity|casual

#import "../../template.typ": article

#show: article.with(
  title: "My Post",
  lang: "en",
)
```

The build script compiles every `.typ` file to an HTML fragment for Astro and a
PDF in `asset/pdf/`. URLs follow `/<lang>/posts/<date>/<name>/`.

HTML export is enabled with Typst's runtime `--features html` flag; the build
script passes it automatically.

## Embedding HTML in articles

Typst 0.13+ HTML export supports raw HTML:

```typst
#if sys.inputs.at("format", default: "pdf") == "html" [
  #html.elem(
    "interactive-figure",
    attrs: (data-figure: "spin", data-width: "640", data-height: "360"),
  )[]
]
```

The build script passes `--input format=html` for HTML export and
`--input format=pdf` for PDF export, so HTML-only blocks can be guarded.

Custom element definitions live in `src/components/` and are loaded by the
site-wide layout, so the article can emit plain HTML tags that the shell
enhances. Raw HTML blocks are ignored in PDF output, so add a static image or
figure caption as a print fallback when needed.

## Web apps

Each folder under `app/` is a standalone app with its own `index.html`, CSS, and
JS. The build copies them into `output/app/` so they are served at
`/app/<name>/`. WASM files can be placed beside the app code and loaded with
`fetch` + `WebAssembly.instantiateStreaming`.

## Themes, templates, and languages

- Dark/light mode uses `data-theme` and CSS variables in
  `src/styles/global.css`, with a persisted toggle in the header.
- Site templates are Astro layouts in `src/layouts/`; Typst article templates
  can be selected per post or per build.
- Languages use the `blog/<lang>/...` convention and Astro's language switcher.
  Typst text settings can be set per article with `#set text(lang: "zh")`.

## Deployment

The included GitHub Actions workflow builds with Typst and Astro, then deploys
to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions** after
pushing to `main`.
