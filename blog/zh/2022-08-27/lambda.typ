// title: 用λ演算建立数学体系
// summary: λ演算的语法、求值规则与柯里化，用 Church 编码在λ演算中构造逻辑运算与自然数体系。
// tags: lambda-calculus, computation
// category: tech
// html-heads: app/lambda-playground/lambda-playground.css, app/lambda-playground/lambda-playground.js

#import "../../template.typ": article

#show: article.with(
  title: "用λ演算建立数学体系",
  lang: "zh",
)

#let demo(expr, repl-table: "") = {
  if sys.inputs.at("format", default: "pdf") == "html" {
    html.elem(
      "p",
      attrs: (class: "lambda-r", data-repl-table: repl-table),
    )[#expr]
  } else {
    raw(expr)
  }
}

在古早之前（大约我初一的时候），我写过一篇博客#strike[遗憾的是现在它已经找不到了]，讲述了如何用纯集合论的方法构建自然数公理。学过数学分析的小朋友们相信对这个知识点已经不陌生了：数学分析的一个基本假设就是“一切数学定理本质上都可以通过简单的集合论和数理逻辑一步步搭建起来”。

不过，集合论并不是唯一一种可以用来作为数学大厦的基石、构建自然数公理的方法。今天，我就要介绍另一个可行的方法：*λ演算*。

当然在这之前，我先简单介绍一下λ演算：

= 什么是λ演算？

相信大家对函数已经不陌生了。比如下面这个函数：

$ f(x) = 2 x $

它输入一个变量$x$，输出一个数，并且满足输出的数一定是输入的两倍。

接下来我们介绍一种新的记号，用来表示同一个函数：

$ f = lambda x. thin 2 x $

这个表达式分为两段，第一段以λ开头，表示一个参数，第二段则是函数体。我们称这样的表达式为：*λ表达式*。

同时，我们也简单修改一下调用函数的记号：把括号写在函数前面，而不是后面

$ (f thin 2) & = ((lambda x. thin 2x) thin 2) \
  &= 2 dot 2 \
  &= 4 $

我知道这对初学者来说看起来很别扭，但只要熟悉就好了。

λ表达式的求值很简单。只需要找到和传入的参数相对应的λ项，然后将函数体的所有对应项全都替换成传入的参数即可。

== 多元函数

你可能会问，如果函数接受多个参数，该怎么办？比如下面这个函数：

$ f(x, y) = x + 2y $

答案很简单，只需要这样写：

$ f = lambda x. thin lambda y. thin x + 2y $

表达式前面有两个$lambda$，就表示函数接受两个参数。比如：

$ (f thin 2 thin 3) & = ((lambda x. thin lambda y. thin x + 2y) thin 2 thin 3) \
  &= 2 + 2 dot 3 \
  &= 8 $

同时，这个表达式还有一种解读方法。我们将$f$看作一个关于$x$的单值函数，但函数返回了另一个λ表达式：

$ f = lambda x. thin (lambda y. thin x + 2y) $

$ (f thin 2) & = ((lambda x. thin (lambda y. thin x + 2y)) thin 2) \
  &= lambda y. thin 2 + 2y $

此时它的返回值还需要再接受一个参数，才能得到一个确定的值。

换句话说，我们把一个二元函数，变成了一个“返回一个一元函数”的一元函数。我们称这个步骤为函数的*柯里化（Currying）*。它同样适用于更多元的函数。

$ f: U times V -> W quad tilde.eq quad g: U -> (V -> W) $

#quote(block: true)[
柯里化是λ演算和函数式编程的一大难点，同时也是一大精妙之处
]

进一步推广，我们还可以把常数看作是一个接受0个参数的函数，只不过没什么必要去这样做罢了。

当然了，常见的加减乘除之类的运算都是二元函数，因此其实在标准的λ语法中，四则运算应该这样写：

$ a + b => (+ thin a thin b) $

$ a - b => (- thin a thin b) $

$ a dot b => (* thin a thin b) $

$ a / b => ("/" thin a thin b) $

如果你学过波兰表达式（Polish Notation），你应该对这样的写法不陌生：*这其实就是加上括号的波兰表达式！*

当然，除了四则运算，其他的二元运算都有类似的规则，例如判断运算（$gt, lt, =, !=, >=, <=$），逻辑运算（`AND`, `OR`, `NOT`）等。

#quote(block: true)[
思考题：结合上述知识，你能说说这些表达式是什么含义吗？

$ (* thin 3) $

$ (= thin 2) $
]

= “函数”的函数

我们发现，λ表达式并没有对参数的类型做限定。也就是说，_向λ表达式里传入一个函数也是完全合法的！_

我们看一个例子：

$ R = lambda f. thin lambda x. thin (f thin (f thin x)) $

这个表达式$R$的意义就是：传入一个函数和一个值，把这个函数在值上做两遍。

举个例子：

$ (R thin (lambda x. thin x^2) thin 2) & = ((lambda f. thin lambda x. thin (f thin (f thin x))) thin (lambda x. thin x^2) thin 2) \
  &= ((lambda x. thin x^2) thin ((lambda x. thin x^2) thin 2)) \
  &= ((lambda x. thin x^2) thin 4) \
  &= 16 $

下面是一个简单的演示。点击图中的$R$将其展开，拖动函数参数到对应的λ位置来进行参数替换。

#demo("[ \"R\", [ \"λx\", [ \"^\", \"x\", \"2\" ] ], \"2\" ]", repl-table: "{ \"R\": [ \"λf\", \"λx\", [ \"f\", [ \"f\", \"x\" ] ] ] }")

当然，使用前面*柯里化*的思想，我们也可以这样看：$R$输入一个λ表达式，输出一个λ表达式，其中输出的表达式是输入的表达式重复两遍的结果。

$ (R thin f) = lambda x. thin (f thin (f thin x)) $

同时这也告诉我们一个道理：在λ语言中，很多情况下括号是不能省略的。比如

$ (f thin (g thin x)) $

就是变量$x$先被$g$作用再被$f$作用，而

$ (f thin g thin x) $

则是函数$g$和变量$x$同时传入$f$中。

= 逻辑运算

相信从上面的介绍中，你已经初步掌握了λ演算。接下来我们将要玩一个小游戏：只用λ演算，不用任何额外的工具（包括逻辑运算，数值运算等一切你熟悉到不能再熟悉的东西），看看你能搭建出什么东西。

没有逻辑运算，就意味着我们没有定义“真”、“假”等概念。那么，我们能不能从λ演算中把这些东西定义出来呢？

首先我们想到，“真”和“假”是一组对立的概念，就像是硬币的两面。从这里出发，我们先写出这样的定义：

$ T := lambda x. thin lambda y. thin x $

$ F := lambda x. thin lambda y. thin y $

在这样的定义下，“真”就是给定两个东西取出第一个，而“假”则是给定两个东西取出第二个。注意到这两个定义中我们没有用到任何运算。

== 逻辑非

有了这两个定义，那么逻辑非（Not）就很好定义了。它的定义如下：

$ (not) := lambda a. thin (a thin F thin T) $

不要忘记了$T$和$F$的含义：$T$表示选择第一个东西，而$F$表示选择第二个东西。也就是说，如果$a=T$，它就会选择第一个参数，也就是$F$；反之，如果$a=F$，它就会选第二个参数，就是$T$。

如果你没有理解这个定义，不妨看下面的演示。请你按照以下顺序操作：

1. 点击`NOT`将其展开
2. 将后面的`T`或`F`拖动到对应位置
3. 将首位的`T`或`F`展开
4. 将后面的两个参数拖动到对应位置

#demo("[ \"NOT\", \"T\" ]")

#demo("[ \"NOT\", \"F\" ]")

== 逻辑与和逻辑或

逻辑与的定义则相对复杂，因为它需要接受两个参数。

不难发现，计算$a and b$时，假如$a$为真，则运算结果就等于$b$，反之如果$a$为假，则运算结果一定是假。

因此我们给出了逻辑与的λ定义：

$ (and) := lambda a. thin lambda b. thin (a thin b thin F) $

类似地，如果$a=T$，那么就会选择第一个参数$b$，它的返回值就取决于$b$的值；而如果$a=F$，它就一定会返回$F$。

同样你也可以看这里的演示：

#demo("[ \"AND\", \"T\", \"T\" ]")

#demo("[ \"AND\", \"T\", \"F\" ]")

#demo("[ \"AND\", \"F\", \"T\" ]")

#demo("[ \"AND\", \"F\", \"F\" ]")

类比逻辑与的定义，我们也可以写出逻辑或的定义：

$ (or) := lambda a. thin lambda b. thin (a thin T thin b) $

以及演示：

#demo("[ \"OR\", \"T\", \"T\" ]")

#demo("[ \"OR\", \"T\", \"F\" ]")

#demo("[ \"OR\", \"F\", \"T\" ]")

#demo("[ \"OR\", \"F\", \"F\" ]")

== 组合逻辑

有了逻辑运算的三兄弟：与、或、非，其余的一切逻辑运算都可以被表示出来了。比如：

$ "xor" := lambda a. thin lambda b. thin (or thin (and thin a thin (not thin b)) thin (and thin b thin (not thin a))) $

当然也可利用λ的性质，写出一个更简洁的异或运算：

$ "xor" := lambda a. thin lambda b. thin (a thin (not thin b) thin b) $

== 谓词和逻辑运算

我们定义，如果有一个λ表达式$p$的返回值要么是$T$，要么是$F$，则$p$称为一个*谓词*。

比如，判断两个自然数相等的运算：

$ (= thin a thin b) $

就是一个谓词。

= 自然数

回想一下自然数的五条公理：

1. $0$是自然数
2. 每一个自然数$n$都有一个后继，记为$n^+$
3. 任何两个不同的元素，它们的后继也不同
   - 或者说，$(n^+)$这个函数是$NN -> NN$的单射
4. 除了$0$以外每一个自然数都有一个前驱
5. 假如命题$p$满足：$p(0)$为真，且任何$p(n)$为真可以推出$p(n+1)$为真，则任何$k in NN$都有$p(k)$为真
   - 或者说，数学归纳法在$NN$上成立

一个可行的构造是由λ演算的提出者 Alonzo Church 提出的方案，我们称其为*Church 计数*。其自然数的构造如下：

$ & 0 := lambda f. thin lambda x. thin x \
  & 1 := lambda f. thin lambda x. thin (f thin x) \
  & 2 := lambda f. thin lambda x. thin (f thin (f thin x)) \
  & 3 := lambda f. thin lambda x. thin (f thin (f thin (f thin x))) \
  & dots.v \
  & n := lambda f. thin lambda x. thin (f^(circle n) thin x) \
  & dots.v $

也就是说，第$n$个自然数，就是将一个函数重复$n$遍。

那么自然数的后继就可以这样定义：

$ "succ" := lambda n. thin lambda f. thin lambda x. thin (f thin (n thin f thin x)) $

注意：你可能会以为$"succ"$接受三个参数，但使用它时，只用一个参数$n$，返回一个带有两个参数$f, x$的λ表达式。

举个例子，我们想要计算$1$的后继：

$ ("succ" thin 1) & = ((lambda n. thin lambda f. thin lambda x. thin (f thin (n thin f thin x))) thin 1) \
  &= lambda f. thin lambda x. thin (f thin (1 thin f thin x)) \
  &= lambda f. thin lambda x. thin (f thin (f thin x)) $

查一下表，不难发现这个λ表达式就是自然数$2$。

#demo("[ \"SUCC\", \"1\" ]")

== 加法

将上面后继的定义稍稍更改一下，即可得到加法的定义：

$ (+) := lambda m. thin lambda n. thin lambda f. thin lambda x. thin (m thin f thin (n thin f thin x)) $

根据定义，$(n thin f thin x)$是函数$f$在$x$上重复数字$n$遍，而$(m thin f)$又是函数$f$重复数字$m$遍。两者复合之后就是函数$f$重复了$m+n$遍。

这里就不手打示例公式了，大家可以在下面操作一下。

#demo("[ \"+\", \"1\", \"2\" ]")

一个等价的表达式是这样的：

$ (+) := lambda m. thin lambda n. thin (m thin "succ" thin n) $

相当于在数$n$上使用$m$次$"succ"$函数。

== 乘法

不难想到乘法可以这样定义：

$ (times) := lambda m. thin lambda n. thin (m thin (+ thin n) thin 0) $

不要忘了，$(+ thin n)$是一个λ表达式，输入一个数，输出它加上$n$的结果。这个表达式的含义就是：从$0$开始，重复$m$次操作，每次给数加上$n$。那么最后得到的就是数$m times n$。

但是，它还有一个更简洁的形式：

$ (times) := lambda m. thin lambda n. thin lambda f. thin (m thin (n thin f)) $

其中$(n thin f)$返回一个λ表达式，表示将函数$f$重复$n$遍，而$(m thin (n thin f))$则是进一步把$(n thin f)$重复了$m$遍。那么$f$总共就被重复了$m times n$遍。

可以看一下这个演示：

#demo("[ \"*\", \"2\", \"3\" ]")

#demo("[ \"*\", \"3\", \"2\" ]")

== 前驱

相对于前面的运算，“求前驱”是一个相对更难的操作，因为它需要从一个表达式上面“剥掉”一层函数调用。比如：

$ 3 = lambda f. thin lambda x. thin (f thin (f thin (f thin x))) stretch(-->)^"pred" 2 = lambda f. thin lambda x. thin (f thin (f thin x)) $

我们想到，假如能够构造出一个函数$R$，使得它第一次作用在某个值$x$上得到的是它本身，而第二、三、四、...次之后，每次往$x$上面套一层$f$。那么只需要：

$ (n thin R thin x) $

就可以得到$(f^(∘(n-1)) thin x)$了。

可惜，你想得美。这种函数不可能存在，因为$R$这个函数不是一个纯函数。

如果我们已知：

$ (R thin x) = x $

那么将$R$在$x$上作用两遍的结果一定也是：

$ (R thin (R thin x)) & = (R thin x) \
  &= x $

但是，你也不要小瞧了λ演算的威力。我们虽然没法构造一个这样的函数，但可以构造一个功能类似的函数：

$ T = lambda g. thin lambda h. thin (h thin (g thin f)) $

使用这个函数时，需要向里面传入一个常值λ表达式：$(lambda u. thin x)$

$ (T thin (lambda u. thin x)) & = lambda h. thin (h thin ((lambda u. thin x) thin f)) \
  &= lambda h. thin (h thin x) \
  &= lambda u. thin (u thin x) $

#demo("[\"T\", [\"λu\", \"x\"]]", repl-table: "{ \"T\": [\"λg\", \"λh\", [\"h\", [\"g\", \"f\"]]] }")

如果再把$T$作用到刚刚算得的结果上，就是：

$ (T thin (T thin (lambda u. thin x))) & = (T thin (lambda u. thin (u thin x))) \
  &= lambda h. thin (h thin ((lambda u. thin (u thin x)) thin f)) \
  &= lambda h. thin (h thin (f thin x)) \
  &= lambda u. thin (u thin (f thin x)) $

#demo("[\"T\", [\"λu\", [\"u\", \"x\"]]]", repl-table: "{ \"T\": [\"λg\", \"λh\", [\"h\", [\"g\", \"f\"]]] }")

进一步的，如果作用三次$T$，就会得到：

$ lambda u. thin (u thin (f thin (f thin x))) $

#demo("[\"T\", [\"λu\", [\"u\", [\"f\", \"x\"]]]]", repl-table: "{ \"T\": [\"λg\", \"λh\", [\"h\", [\"g\", \"f\"]]] }")

通过归纳法不难得到，在$(lambda u. thin x)$上作用$n$次$T$，得到的结果就是：

$ lambda u. thin (u thin (f^(∘(n-1)) thin x)) $

注意到我们在这个表达式里发现了一个$(f^(∘(n-1)) thin x)$，这就是要求的值！最后一步就是消去函数$u$，一个简单的方法就是将$u$代入单位函数$"id" = lambda v. thin v$即可。

$ (lambda u. thin (u thin (f^(∘(n-1)) thin x)) thin (lambda v. thin v)) & = ((lambda v. thin v) thin (f^(∘(n-1)) thin x)) \
  &= (f^(∘(n-1)) thin x) $

综合上述结果，我们得到了前驱$"pred"$的λ表达式，若传入的$n gt 0$，那么它返回$n - 1$，否则返回$0$：

$ "pred" := lambda n. thin lambda f. thin lambda x. thin ((n thin T thin (lambda u. thin x)) thin "id") $

#demo("[ \"PRED\", \"0\" ]")

#demo("[ \"PRED\", \"1\" ]")

#demo("[ \"PRED\", \"2\" ]")

== 减法

有了前驱运算，减法就不难定义了：

$ (-) := lambda m. thin lambda n. thin (n thin "pred" thin m) $

当然，由于自然数没有负数，假如被减数$m$小于$n$，减法运算的结果就是$0$。

== 判断

我们可以定义一个函数来判断某个数是不是$0$：

$ "iszero" := lambda n. thin (n thin (lambda u. thin F) thin T) $

函数$(lambda u. thin F)$是一个永远返回$F$的常值函数。所以，只要$n gt 0$，$("iszero" thin n)$就会返回$F$。

再加上之前定义的减法，我们就可以定义“大于等于”函数：

$ (>=) := lambda m. thin lambda n. thin ("iszero" thin (- thin n thin m)) $

再根据大于等于来定义自然数的相等：

$ (=) := lambda m. thin lambda n. thin (and thin (>= thin m thin n) thin (>= thin n thin m)) $

= 思考题

你能使用λ演算来定义一个类似 C++ 中`std::pair`的数据结构吗？

#quote(block: true)[
要求：使用函数

$ ("pair" thin a thin b) $

来构造一个对象，并使用$("first" thin p)$和$("second" thin p)$来获取一个pair的第一和第二个值。
]

你能在这个结构的基础上，用λ演算来定义所有的*整数*及其相应的数值和逻辑运算吗？

#bibliography("reference.bib", title: "参考资料", full: true)