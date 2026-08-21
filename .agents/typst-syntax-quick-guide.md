# Typst Syntax Quick Guide

1. Bold texts are enclosed by asterisks. Italic texts are enclosed by underlines. Example: `*bold*, _italic_`.
2. Headings are denoted by equal signs. Example: `= Heading 1`, `== Heading 2`. Always use heading 1 for the highest level headings. Titles does not count as headings.
3. Code blocks have the same syntax as markdown. I.e. ```lang  code  ```  denotes block codes and `code` denotes inline code.
4. `#function(parameter1: value1, parameter2: value2)[body]` is the standard notation of functions. `parameter`s are identifiers, `value`s can be literals (int, float, string, bool, etc.) or other variables, and `body` is a block of content that is written with the same syntax as the main document. Some functions might have parameter names omitted. Some functions might have no body.
5. `#link("https://example.com/")[example content]` is the notation for links. For in-document references (e.g. references to figures, tables, equations, and bibliography), use `<label>` to define a label and use `@label` to reference to that label. The label name should reflect the type of content being labeled. For example, figures should be labeled as @fig:label and equations should be labeled as @eq:label.
6. Both inline and block math equations are enclosed by single dollar sign `$`. Unlike that in LaTeX, math equations in Typst are based on variables. For example, `xyz` will be identified as a single variable called `xyz` instead of three separate letters.
   1. Every single letter (upper- or lower-case) is a predefined variable. Example: `x y z` denotes three letters (equivalent to LaTeX `xyz`).
   2. Common math functions are predefined variables, e.g. `sin`, `cos`, `log`, `sqrt`, ... Therefore, you don't need to have backslashes like LaTeX to represent these math functions.
   3. Texts are quoted by `"`. Example: `"This is a text literal"`.
   4. Common symbols have corresponding variable names. You may reference `.agents/typst-char-map.json`. Some symbols have ASCII shorthands, which you may reference `.agents/typst-symbol-shorthand.json`.
   5. Most operators are displayed as their literal texts beside the division sign `/`. `a / b` will be displayed as a fraction (equivalent to LaTeX `\frac{a}{b}`). `\/` displays the literal `/` symbol. To have multiple characters in fractions, use brackets. Example: `(a b) / (c d)` = LaTeX `\frac{ab}{cd}`.
   6. `vec(a, b, c)` denotes column vectors. `mat(a, b, c; d, e, f)` denotes matrices.
   7. `stretch(=)^"above"_"below"`, `stretch(->)^"above"_"below"`, etc. can be used to represent texts above or below equal signs, arrows, etc.
   8. For accents on variables, reference <https://typst.app/docs/reference/math/accent/>.
7. Tables are represented by function `#table(columns: <n>, [*heading 1*], [*heading 2*], ..., [*heading n*], [cell 1, 1], [cell 1, 2], ..., [cell 1, n], [cell 2, 1], [cell 2, 2], ..., [cell 2, n], ...)`, where `<n>` denotes the number of columns and `...` are omitted cells.
8. Images are represented by `#image(url)`.
9. Both tables and images can be made into figures. Example: `#figure(image(url), caption: [some caption])` and `#figure(table(columns: 2, [a], [b], [c], [d]), caption: [some caption])`. Captions will be displayed below the image/table.
