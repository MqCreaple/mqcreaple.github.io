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

The build script compiles every `.typ` file to an HTML fragment in
`src/generated/articles/` and a PDF in `node_modules/.cache/pdfs/`; finalization
copies the PDFs into `output/pdf/`, served at `/pdf/...`. URLs follow
`/<lang>/posts/<date>/<name>/`.

HTML export is enabled with Typst's runtime `--features html` flag; the build script passes it automatically.

## Researching hard problems

Whenever you meet a hard problem that is not obvious to solve, always search for relevant GitHub issues, Stack Overflow posts, or other posts online related to that issue before inventing a solution from scratch.

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

Draw diagrams with the `#diagram` function exported by `blog/template.typ`, importing the fletcher helpers `node`, `edge`, `shapes` from `@preview/fletcher` as usual. In HTML export `#diagram` wraps the fletcher diagram in `#html.frame(...)` automatically, so the diagram is embedded as an inline SVG; in PDF export it renders the fletcher diagram directly. Math equations inside node labels work as-is: the template's `#show math.equation` rules skip equations that are already inside an `#html.frame`, so node math is vectorized by Typst's own layout engine instead of being wrapped in another frame. For cetz diagrams, use the template's `cetz-canvas` function the same way: it wraps `#cetz.canvas` (import `#import "@preview/cetz:0.3.4"` in the article for `cetz.draw` inside the canvas body) and produces the same `typst-diagram` wrapper.

Plain `(x, y)` tuples are elastic row/column coordinates (the grid expands to fit node labels, so the default `3em` spacing plus label sizes drive the width); the y-axis grows downward. To control overall width, scale the coordinates and tune `diagram()`'s `spacing`. To keep a row of nodes equally spaced, use integer x positions (one node per column) and keep labels out of node columns: a label wider than the node widens that column and breaks the spacing, so place such labels at a half-column position (e.g. `4.5`) instead of on the node column.

```typst
#diagram(
  node-stroke: 0.6pt,
  node((0, 0), [A]),
  node((2, 0), [B]),
  edge((0, 0), (2, 0), "->"),
)
```

## Interactive figure helpers

Pure scene-side helpers for interactive figures (geometry loaders,
normalization, pointer/raycast math, sprite/label utilities, and similar
Three.js-only functions) live in `asset/blog/shared/` as static ES modules.
Those files are served without Vite bundling, so they must not import bare npm
packages; pass `THREE` and any loader helpers as arguments instead.

Helpers that need Vite-bundled dependencies or builder-owned state (the render
loop, camera controls, theme colors, control widgets, `THREE`, `OBJLoader`,
`mergeVertices`, `createNoise3D`, `interpolateViridis`, and so on) stay in
`src/components/InteractiveDiagramBuilder.ts` or
`src/components/ThreeJsDiagramBuilder.astro`, and are exposed to scene scripts
through the injected `helpers` object.

Each helper has exactly one canonical home. If a helper is pure enough for
`asset/blog/shared/`, move it there and remove the builder-side copy; do not
duplicate the same logic in both places.

## Verifying interactive figures

Do not check the rendered figure yourself: the agent has no image recognition capability, and algorithmic pixel analysis of screenshots is not always reliable. Only verify the textual side - that the generated HTML fragment contains the expected `three-js-figure` (or `shadertoy-figure`) element with the correct `data-src`, that the caption is present, and that the build compiles. Leave visual verification of the rendered diagram to the user.

## Image captions

When migrating an old Markdown image and its italic caption line, wrap the pair
in a `#figure`; see item 9 of `.agents/typst-syntax-quick-guide.md`.

## Math notation

Use `stretch(-->)^"label"` for arrows with text labels (like LaTeX
`\xrightarrow{pred}`); it renders in both HTML and PDF exports. Avoid the
`xarrow` package, which relies on `place()` and loses its arrow glyphs in HTML
export. For other `stretch(...)` uses, see item 6.7 of
`.agents/typst-syntax-quick-guide.md`.

For template math helpers and notation details not covered here (e.g. `vec(...)`
for column vectors), see item 6 of `.agents/typst-syntax-quick-guide.md`.

The template renders inline equations as `span.typst-math-inline` SVGs with
baseline alignment and block equations as centered `div.typst-math-block`;
styling lives in `src/styles/typst-math.css`. Use `mathbf(x)` for bold vectors
and `arrow(x)` for arrow-accented vectors (e.g. `2022-10-14-relativistic-renderer-0`).

## Labels and references

Define labels with `<label>` and reference them with `@label` (item 5 of
`.agents/typst-syntax-quick-guide.md`). Prefix labels by type in this repo:
`fig:`, `tab:`, `eq:`, `sec:`, etc.

## Typst symbol reference

For symbol lookup, see item 6.4 of `.agents/typst-syntax-quick-guide.md`,
which points to `.agents/typst-char-map.json` and
`.agents/typst-symbol-shorthand.json`.

## Text style and citation rules

1. When writing Chinese, there shall be no space between characters and characters or characters and punctuations. Wrong: `重要信息在段落中需要 *加粗* 或者使用 _斜体_ 。` Correct: `重要信息在段落中需要*加粗*或者使用_斜体_。`
2. There should be spaces between Chinese texts and English texts, but there should be no spaces between Chinese punctuations and English words. Wrong: `在段落中可以插入英文注释（ English annotations ）或者English words。` Correct: `在段落中可以插入英文注释（English annotations）或者 English words。`
Note: For loanwords already common in Chinese, such as `up` (up主), no space is needed - write `B站up`.
3. There should be no space between Chinese words and numbers. Wrong: `中文和数字 012 或者 Latex 数字 $012$ 之间不能有空格。` Correct: `中文和数字012或者 Latex 数字$012$之间不能有空格。`
4. Chinese texts and math equations should always have spaces between them, except when the math equation consists solely of a number, in which case the spaces are optional. Wrong: `勾股定理$a^2 + b^2 = c^2$中的$c$是斜边边长。`; Correct: `勾股定理 $a^2 + b^2 = c^2$ 中的 $c$ 是斜边边长。`. Both `从$1$开始` and `从 $1$ 开始` are acceptable.
5. Always use the punctuations of the language you are writing in. For example, when writing blog in `blog/zh`, use full-width punctuations (`，`, `。`, `；`, `：`, etc.). When writing blogs in `blog/en`, use half-width punctuations (`,`, `.`, `;`, `:`, etc.).
6. When citing from reference documents, use `@` symbol. For example, to cite an article labeled `article1` in `reference.bib`, write `@article1`. For both Chinese and English, there should be a space between citations and the text before or after it, but there should be no space between citations and punctuations.
7. Place bibliography entries in a separate `reference.bib` in the same folder as the Typst file, and load the references with the `#bibliography` function, e.g. `#bibliography("reference.bib", full: true)`.

## Themes, templates, and languages

- Dark/light mode uses `data-theme` and CSS variables in `src/styles/global.css`, with a persisted toggle in the header.
- Site templates are Astro layouts in `src/layouts/`; Typst article templates can be selected per post or per build.
- Languages use the `blog/<lang>/...` convention and Astro's language switcher. Typst text settings can be set per article with `#set text(lang: "zh")`.

## Deployment

The included GitHub Actions workflow builds with Typst and Astro, then deploys to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions** after pushing to `main`.

## Sandbox: spawning Node processes

When the agent works inside the filesystem sandbox, Node.js cannot spawn external binaries via `child_process` (`execFile`, `spawn`, ...). For example, `node scripts/build-articles.mjs` and `npm run articles` / `npm run build` fail with `spawn EPERM` (errno -4048) before Typst or Astro does any work. Direct shell invocations of the same binaries work fine inside the sandbox, so a single-article check like `typst compile blog zh/.../article.typ out.html --format html --features html --input format=html --root .` can be run without
escalation.

To run Node-based build commands, request escalated permissions (`sandbox_permissions: "require_escalated"`) so the Node process is allowed to spawn its child processes.
