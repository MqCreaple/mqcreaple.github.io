#import "@preview/ctheorems:1.1.3": *

// The language of the current article, stored as global state so that
// appendix() and the theorem environments can localize themselves without
// taking an extra `lang` parameter.
#let article-lang = state("article-lang", "en")

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
  show: thmrules

  // Content
  outline()
  doc
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
