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

Mermaid diagrams render in the HTML branch via the site layout's mermaid script; give each one a PDF fallback drawn with the fletcher package in the `else` branch (pattern: `blog/zh/2021-09-11/derivative-m.typ`). Import `#import "@preview/fletcher:0.5.8": diagram, edge, node, shapes`.

Pass the mermaid source as a `data-source` attribute (a raw string whose lines are joined with `\n`) instead of as element content. The site's mermaid script reads `data-source`, so Typst never parses mermaid syntax as Typst markup and no `<pre><code>` unwrapping is needed downstream.

Plain `(x, y)` tuples are elastic row/column coordinates (the grid expands to fit node labels, so the default `3em` spacing plus label sizes drive the width); the y-axis grows downward. To control overall width, scale the coordinates and tune `diagram()`'s `spacing`. To keep a row of nodes equally spaced, use integer x positions (one node per column) and keep labels out of node columns: a label wider than the node widens that column and breaks the spacing, so place such labels at a half-column position (e.g. `4.5`) instead of on the node column.

```typst
#if sys.inputs.at("format", default: "pdf") == "html" [
  #html.elem("div", attrs: (class: "mermaid", "data-source": "graph TD\nA --> B"))[]
] else [
  #diagram(
    node-stroke: 0.6pt,
    node((0, 0), [A]),
    node((2, 0), [B]),
    edge((0, 0), (2, 0), "->"),
  )
]
```
## Image captions

In the old Markdown blog, an italic line right after an image is the image's caption. When migrating such a pair, wrap the image and the caption in a `#figure`:

```typst
#figure(
  image("ray-spacetime-diagram-wikipedia.svg", width: 70%),
  caption: [图源：#link("https://en.wikipedia.org/wiki/Spacetime_diagram")[Wikipedia]],
)
```

## Math notation

To draw an arrow with text on top (like LaTeX `\xrightarrow{pred}`), use Typst's built-in `stretch` - no external package needed:

```typst
$ a stretch(-->)^"pred" b $
```

`stretch(-->)^"label"` renders a stretched arrow with the label above it in both HTML and PDF exports. Avoid the `xarrow` package for this: it relies on `place()`, which Typst's HTML export ignores, so the arrow glyphs are dropped and only the label remains.

- Vector notation: use the template helper `mathbf(x)` (bold upright) for bold vector variables, and `arrow(x)` for arrow-accented vectors. Note that `vec(x)` creates a column vector, not an arrow accent. E.g. 4-vectors use `mathbf(r)` and 3-vectors use `arrow(r)` in `2022-10-14-relativistic-renderer-0`.

## Labels and references

Labels should have appropriate prefixes: `fig:` for figures, `tab:` for tables, `eq:` for equations, `sec:` for sections, etc. Reference a label with `@label`, e.g. `@sec:context`.

## Typst symbol reference

The file `.agents/typst-char-map.json` in the repo maps Typst `sym.*` symbol names to their Unicode characters, extracted from <https://typst.app/docs/reference/symbols/sym/>. Load this map whenever you need to use a Typst symbol character (for `#sym.<name>` or math symbols) instead of guessing the Unicode codepoint. The companion file `.agents/typst-symbol-shorthand.json` maps ASCII shorthands to their Unicode characters for both markup and math modes, extracted from <https://typst.app/docs/reference/symbols/>; load it whenever you need a shorthand glyph.

## Text style and citation rules

1. When writing Chinese, there shall be no space between characters and characters or characters and punctuations. Wrong: `重要信息在段落中需要 *加粗* 或者使用 _斜体_ 。` Correct: `重要信息在段落中需要*加粗*或者使用_斜体_。`
2. There should be spaces between Chinese texts and English texts, but there should be no spaces between Chinese punctuations and English words. Wrong: `在段落中可以插入英文注释（ English annotations ）或者English words。` Correct: `在段落中可以插入英文注释（English annotations）或者 English words。`
Note: For loanwords already common in Chinese, such as `up` (up主), no space is needed - write `B站up`.
3. There should be no space between Chinese words and numbers. Wrong: `中文和数字 012 或者 Latex 数字 $012$ 之间不能有空格。` Correct: `中文和数字012或者 Latex 数字$012$之间不能有空格。`
4. Chinese texts and math equations with multiple letters should have spaces between them, while Chinese texts and single-letter variables can either have a space or have no space. Wrong: `勾股定理$a^2 + b^2 = c^2$中的$c$是斜边边长。`; Correct: `勾股定理 $a^2 + b^2 = c^2$ 中的$c$是斜边边长。` or `勾股定理 $a^2 + b^2 = c^2$ 中的 $c$ 是斜边边长。`.
5. Always use the punctuations of the language you are writing in. For example, when writing blog in `blog/zh`, use full-width punctuations (`，`, `。`, `；`, `：`, etc.). When writing blogs in `blog/en`, use half-width punctuations (`,`, `.`, `;`, `:`, etc.).
6. When citing from reference documents, use `@` symbol. For example, to cite an article labeled `article1` in `reference.bib`, write `@article1`. For both Chinese and English, there should be a space between citations and the text before or after it, but there should be no space between citations and punctuations.
7. Place bibliography entries in a separate `reference.bib` in the same folder as the Typst file, and load the references with the `#bibliography` function, e.g. `#bibliography("reference.bib", full: true)`.

## Themes, templates, and languages

- Dark/light mode uses `data-theme` and CSS variables in `src/styles/global.css`, with a persisted toggle in the header.
- Site templates are Astro layouts in `src/layouts/`; Typst article templates can be selected per post or per build.
- Languages use the `blog/<lang>/...` convention and Astro's language switcher. Typst text settings can be set per article with `#set text(lang: "zh")`.

## Deployment

The included GitHub Actions workflow builds with Typst and Astro, then deploys to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions** after pushing to `main`.
