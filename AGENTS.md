# Agent Notes

## Writing a post

Create `blog/en/2026-08-04/my-post.typ` and put metadata in the first comment lines:

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

The build script compiles every `.typ` file to an HTML fragment for Astro and a PDF in `asset/pdf/`. URLs follow `/<lang>/posts/<date>/<name>/`.

HTML export is enabled with Typst's runtime `--features html` flag; the build script passes it automatically.

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

The build script passes `--input format=html` for HTML export and `--input format=pdf` for PDF export, so HTML-only blocks can be guarded.

Custom element definitions live in `src/components/` and are loaded by the site-wide layout, so the article can emit plain HTML tags that the shell enhances. Raw HTML blocks are ignored in PDF output, so add a static image or figure caption as a print fallback when needed.

## Text style and citation rules

1. When writing Chinese, there shall be no space between characters and characters or characters and punctuations. Wrong: `重要信息在段落中需要 *加粗* 或者使用 _斜体_ 。` Correct: `重要信息在段落中需要*加粗*或者使用_斜体_。`
2. There should be spaces between Chinese texts and English texts, but there should be no spaces between Chinese punctuations and English words. Wrong: `在段落中可以插入英文注释（ English annotations ）或者English words。` Correct: `在段落中可以插入英文注释（English annotations）或者 English words。`
3. There should be no space between Chinese words and numbers. Wrong: `中文和数字 012 或者 Latex 数字 $012$ 之间不能有空格。` Correct: `中文和数字012或者 Latex 数字$012$之间不能有空格。`
4. Always use the punctuations of the language you are writing in. For example, when writing blog in `blog/zh`, use full-width punctuations (`，`, `。`, `；`, `：`, etc.). When writing blogs in `blog/en`, use half-width punctuations (`,`, `.`, `;`, `:`, etc.).
5. When citing from reference documents, use `@` symbol. For example, to cite an article labeled `article1` in `reference.bib`, write `@article1`. For both Chinese and English, there should be a space between citations and the text before or after it, but there should be no space between citations and punctuations.

## Themes, templates, and languages

- Dark/light mode uses `data-theme` and CSS variables in `src/styles/global.css`, with a persisted toggle in the header.
- Site templates are Astro layouts in `src/layouts/`; Typst article templates can be selected per post or per build.
- Languages use the `blog/<lang>/...` convention and Astro's language switcher. Typst text settings can be set per article with `#set text(lang: "zh")`.

## Deployment

The included GitHub Actions workflow builds with Typst and Astro, then deploys to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions** after pushing to `main`.
