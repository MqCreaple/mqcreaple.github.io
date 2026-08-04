#let article(
  title: none,
  lang: "en",
  size: 12pt,
  font: ("Verdana", "Microsoft YaHei"),
  doc,
) = {
  set page(paper: "a4", margin: 2.5cm)
  set par(justify: true)
  set text(size: size, font: font, lang: lang)
  show raw: set text(font: ("Consolas", "Courier New"))
  set document(title: title)
  if sys.inputs.at("format", default: "pdf") != "html" {
    show image: it => align(center, it)

    if title != none {
      align(center, text(size: 1.6em, weight: "bold", title))
      v(0.5em)
    }
  }
  doc
}

#let mathbf(x) = math.bold(math.upright(x))
