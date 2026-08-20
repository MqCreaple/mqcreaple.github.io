#import "@preview/ctheorems:1.1.3": *
#import "@preview/fletcher:0.5.8": diagram as _diagram
#import "@preview/cetz:0.3.4": canvas as _cetz-canvas

// The language of the current article, stored as global state so that
// appendix() and the theorem environments can localize themselves without
// taking an extra `lang` parameter.
#let article-lang = state("article-lang", "en")

// State used to measure and apply per-equation baseline shifts for inline math
// in HTML export (see shift-inline-math and finalize-inline-math below).
#let inline-math-pending = state("inline-math-pending", ())
#let inline-math-count = counter("inline-math-count")
#let inline-math-depths = state("inline-math-depths", ())

// Render inline math as SVG via html.frame() and shift it so that the
// equation's baseline aligns with the surrounding text baseline (method
// ported from https://1024th.top/posts/typst/typst-html-export). The bounds
// text edges make the SVG viewBox match the equation's true bounding box. The
// depth below the baseline cannot be measured directly here: Typst's inline
// equation layout subtracts `0.7 * leading` from the equation's descent when
// the text bottom edge is the baseline, and querying label positions inside an
// html.frame reports zeroes in current Typst versions. So each equation is
// queued in inline-math-pending together with its true bounding height, and
// its depth is computed once in finalize-inline-math() (after the document)
// with a huge leading, then fed back through inline-math-depths as a
// per-equation `vertical-align` offset.
#let shift-inline-math(body) = context {
  let formula-cnt = inline-math-count.get().first()
  inline-math-count.step()
  let wrapper = text.with(top-edge: "bounds", bottom-edge: "bounds")
  // The equation's true bounding height at its own location, where the
  // article's show rules (e.g. #show math.equation: math.display) apply. Used
  // in finalize-inline-math() to detect and reproduce the effective layout.
  let ref-total = measure(wrapper(body.body)).height
  inline-math-pending.update(arr => arr + ((body.body, ref-total),))
  html.elem(
    "span",
    html.frame(wrapper(body)),
    attrs: (
      style: "vertical-align: -"
        + str(calc.round(inline-math-depths.final().at(formula-cnt, default: 0), digits: 2))
        + "em;",
      class: "typst-math-inline",
    ),
  )
}

// The depth below the baseline of `eq`, in em units, measured with the huge
// leading set by finalize-inline-math(). With bottom-edge "bounds" measure()
// yields the full bounding height (top-to-bottom), and with the default
// bottom-edge "baseline" plus a huge leading the descent term of the
// equation's frame vanishes, so the difference is the true depth. The em
// value is invariant under the font size, so measuring at the article's base
// size is correct even for equations inside larger text (e.g. headings).
#let inline-math-depth(eq) = {
  let full = measure(text.with(top-edge: "bounds", bottom-edge: "bounds")(eq)).height
  let top-to-base = measure(text.with(top-edge: "bounds")(eq)).height
  (full - top-to-base) / text.size
}

// Measure the depth below the baseline of every queued inline equation. Called
// after `doc` in article(), where the huge leading cannot affect any visible
// content. Since show rules declared inside `doc` (such as the article's
// `#show math.equation: math.display`) are not in scope here, the raw equation
// body may no longer reproduce its effective layout; compare its bounding
// height against the reference captured in shift-inline-math() and, if it
// differs, retry with display style forced via math.equation + math.display.
#let finalize-inline-math() = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    set par(leading: 100em)
    context {
      let pending = inline-math-pending.get()
      let new-depths = ()
      for (eq, ref-total) in pending {
        let plain-total = measure(text.with(top-edge: "bounds", bottom-edge: "bounds")(eq)).height
        let depth = if plain-total == ref-total {
          inline-math-depth(eq)
        } else {
          let disp-eq = math.equation(block: false, math.display(eq))
          let disp-total = measure(text.with(top-edge: "bounds", bottom-edge: "bounds")(disp-eq)).height
          if disp-total == ref-total {
            inline-math-depth(disp-eq)
          } else {
            // Fall back to the plain measurement (best effort).
            inline-math-depth(eq)
          }
        }
        new-depths += (depth,)
      }
      inline-math-depths.update(new-depths)
      []
    }
  }
}

// Articles and Sections

#let article(
  title: none,
  lang: "en",
  size: 12pt,
  font: ("Verdana", "Microsoft YaHei", "Noto Sans CJK SC"),
  doc,
) = {
  article-lang.update(lang)
  set page(paper: "a4", margin: 2.5cm)
  set par(justify: true)
  set heading(numbering: "1.")
  set text(size: size, font: font, lang: lang)
  show raw: set text(font: ("Consolas", "Courier New"))
  set document(title: title)
  set bibliography(style: "ieee")
  if sys.inputs.at("format", default: "pdf") != "html" {
    show image: it => align(center, it)

    if title != none {
      align(center, text(size: 1.6em, weight: "bold", title))
      v(0.5em)
    }
  }
  // Render math equations as SVG via html.frame() in HTML export, so accents
  // and layout are pixel-perfect (browser MathML relies on system math fonts
  // and misplaces combining accents). The show rules must live at function-body
  // level: a show rule declared inside an `if` block does not affect `doc`.
  // We branch on target() instead of sys.inputs: inside an html.frame (e.g. a
  // diagram rendered as SVG) target() is "paged", so equations embedded in
  // diagrams are vectorized by Typst's own SVG layout engine instead of being
  // wrapped in a nested frame. In PDF export target() is "paged" as well and
  // the else branch returns the equation unchanged.
  show math.equation.where(block: true): it => {
    if target() == "html" {
      html.elem("div", html.frame(it), attrs: (class: "typst-math-block"))
    } else {
      it
    }
  }
  show math.equation.where(block: false): it => {
    if target() == "html" {
      shift-inline-math(it)
    } else {
      it
    }
  }
  show: thmrules

  // Content
  outline()
  doc
  // Compute and apply the per-equation baseline shifts for inline math. This
  // runs after all content so the huge leading used for measurement cannot
  // affect any visible layout; it is a no-op in PDF export (no equations are
  // queued there).
  finalize-inline-math()
}

#let appendix(body) = {
  context {
    let lang = article-lang.get()
    set heading(
      numbering: "A",
      supplement: if lang == "zh" { [附录] } else { [Appendix] },
    )
    counter(heading).update(0)
    body
  }
}

// Figure templates

#let shadertoy-figure(body, classes: ()) = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.elem("div", attrs: (class: ("shadertoy-figure", ..classes).join(" ")))[#body]
  } else {
    body
  }
}
#let three-js-figure(src, body: none) = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.elem("div", attrs: (class: "three-js-figure", "data-src": src))[]
  } else if body != none {
    body
  }
}

// Fletcher diagrams
#let diagram(..args) = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.elem("div", html.frame(_diagram(..args)), attrs: (class: "typst-diagram"))
  } else {
    _diagram(..args)
  }
}

// Cetz diagrams
#let cetz-canvas(..args) = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.elem("div", html.frame(_cetz-canvas(..args)), attrs: (class: "typst-diagram"))
  } else {
    _cetz-canvas(..args)
  }
}

// Mathematical theorems, definitions, etc.
//
// ctheorems' thmbox/thmplain rely on pad() and block(), which Typst's HTML
// export does not support yet (https://github.com/typst/typst/issues/5512).
// These environments are built on thmenv with a quote(block: true) body, so
// they render in both PDF and HTML (headers such as "Theorem 1" in bold).
// Localized names for the theorem-like environments, keyed by language so
// that more languages can be added later. The current article language is
// read from the `article-lang` state set by article().
#let theorem-heads = (
  en: (
    theorem: "Theorem",
    corollary: "Corollary",
    lemma: "Lemma",
    proposition: "Proposition",
    axiom: "Axiom",
    definition: "Definition",
    example: "Example",
    proof: "Proof",
  ),
  zh: (
    theorem: "定理",
    corollary: "推论",
    lemma: "引理",
    proposition: "命题",
    axiom: "公理",
    definition: "定义",
    example: "例",
    proof: "证明",
  ),
)

#let thmenv-quote(
  identifier,
  head,
  titlefmt: strong,
  namefmt: x => [(#x)],
  bodyfmt: x => x,
  separator: [ ],
  base: "heading",
  base_level: none,
) = {
  let fmt(name, number, body, title: auto) = {
    context {
      let lang = article-lang.get()
      let names = theorem-heads.at(lang, default: theorem-heads.en)
      let head = names.at(identifier, default: head)
      let title = if title == auto { head } else { title }
      if number != none {
        title = [#title #number]
      }
      let label = if name == none { [] } else { namefmt(name) }
      quote(block: true)[
        #titlefmt(title)#label#separator#bodyfmt(body)
      ]
    }
  }
  thmenv(identifier, base, base_level, fmt).with(
    supplement: context {
      let lang = article-lang.get()
      let names = theorem-heads.at(lang, default: theorem-heads.en)
      names.at(identifier, default: head)
    },
  )
}

#let theorem = thmenv-quote("theorem", "Theorem")
#let corollary = thmenv-quote("corollary", "Corollary")
#let lemma = thmenv-quote("lemma", "Lemma")
#let proposition = thmenv-quote("proposition", "Proposition")
#let axiom = thmenv-quote("axiom", "Axiom")
#let definition = thmenv-quote("definition", "Definition")
#let example = thmenv-quote("example", "Example").with(numbering: none)
#let proof = thmenv-quote("proof", "Proof", bodyfmt: proof-bodyfmt).with(numbering: none)

// Utility functions

#let mathbf(x) = math.bold(math.upright(x))
#let hr() = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.hr()
  } else {
    line(length: 100%)
  }
}
