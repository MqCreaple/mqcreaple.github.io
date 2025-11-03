---
title: 直觉主义逻辑和程序定理验证
layout: blog
tags: ["lambda-calculus", "computation", "mathematics"]
---

本期我想继续上次关于[有类型λ演算]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %})的讨论，详细说一说直觉主义逻辑以及它在自动化数学定理证明方面的应用。在开始这个问题之前，我们先来谈谈，直觉主义是什么？

## 逻辑：经典主义和直觉主义

大家在高中数学课上可能学过一些基础的逻辑学了。**逻辑学**研究的是命题和命题间的关系，而一个逻辑系统定义了什么样的推理方式是合理的。比如大家都熟悉的亚里士多德三段论：

> 1. A成立
> 2. 若A成立，则B成立
>
> 因此，B成立

也可以用数学语言写成这样：

> $$A\land (A\to B)\to B$$

或者这样

> $$A, (A\to B)\vdash B$$

在教科书上，你可能也看过这样的写法：

> $\because A$
>
> $\because A\to B$
>
> $\therefore B$

或者如果你翻开更高等的逻辑学教科书，还有这样的写法：

> $$\begin{array}{c} \Gamma\vdash A \qquad \Gamma\vdash (A\to B) \\ \hline \Gamma\vdash B \end{array}$$

这些写法都表达的同一个含义，只是用不同的符号系统来书写。可以理解成，这就是用中文、英语、法语、日语来说“今天天气真好”这个句子——这些表述之间只有符号和形式上的区别。

和任何其他的数学分支一样，逻辑学也需要有几条不证自明的公理。在**经典逻辑学（Classical Logic）**，也就是我们高中课本上学过的逻辑学中，最重要的一条公理莫过于**排中律（Law of Excluded Middle）**。这条公理的表述如下：

> 对于命题$P$，$P$要么为真，要么为假。

可能在你看来这句话是一句废话，但正因为有这条公理，我们可以假定一切命题都只有“真”、“假”两种可能，从而才能给每个逻辑运算符写出真值表，从而用命题的真值来写证明：

|$\land$|**0**|**1**|
|---|---|---|
|**0**|0|0|
|**1**|0|1|

|$\lor$|**0**|**1**|
|---|---|---|
|**0**|0|1|
|**1**|1|1|

|$\lnot$|**0**|**1**|
|---|---|---|
||1|0|

|$\to$|**0**|**1**|
|---|---|---|
|**0**|1|1|
|**1**|0|1|

举个例子，如果你想用经典逻辑学证明这个命题：

$$A\land (A\to B)\to B$$

你可以直接枚举$A$和$B$两个命题的真值，列出真值表：

|$A$|$B$|$A\to B$|$A\land (A\to B)$|$A\land (A\to B)\to B$|
|:-:|:-:|:------:|:---------------:|:--------------------:|
| 0 | 0 |   1    |       0         |           1          |
| 0 | 1 |   1    |       0         |           1          |
| 1 | 0 |   0    |       0         |           1          |
| 1 | 1 |   1    |       1         |           1          |

真值表最后一列的所有项都是1，意味着$A\land (A\to B)\to B$是一个恒真命题。证毕。

而在直觉主义逻辑中，“逻辑真”和“逻辑假”的定义与经典逻辑中的定义略有不同：某个命题“逻辑真”被定义为“该命题可以构造出证明”，而“逻辑假”则被定义为“该命题可以构造出证伪”。**构造性证明（Constructive Proof）**是直觉主义的一个核心概念。

可能你想问：构造性证明是什么？我们不妨来看看哪些证明不是构造性证明。比如下面这个就是一个非常典型的非构造性证明：

> 定理：存在无理数$p, q$，使得$p^q$为有理数。
>
> 证明：考虑$\sqrt{2}^{\sqrt{2}}$。
>
> 1. 若$\sqrt{2}^{\sqrt{2}}\in\mathbb{Q}$。又由于$\sqrt{2}$为无理数，取$p=q=\sqrt{2}$，原命题得证。
> 2. 若$\sqrt{2}^{\sqrt{2}}\notin\mathbb{Q}$，又有$$\left(\sqrt{2}^{\sqrt{2}}\right)^{\sqrt{2}}=\sqrt{2}^{\sqrt{2}\times\sqrt{2}}=\sqrt{2}^2=2\in\mathbb{Q}$$
>    则取$p=\sqrt{2}^{\sqrt{2}}, q=\sqrt{2}$，原命题得证。

在这段证明中，我们并没有给出两个确切的数使得$p^q\in\mathbb{Q}$，而是说要么$\sqrt{2}^{\sqrt{2}}$是有理数、要么$(\sqrt{2}^{\sqrt{2}})^{\sqrt{2}}$是有理数。而同一个命题的构造性证明是这样的：

> 证明：取$p=\sqrt{2}, q=\log_2(9)$。
>
> 由于$\sqrt{2}$为无理数，且$\log_2(9)$也为无理数（否则存在整数$n, m$使得$2^m=9^n$），而$$\sqrt{2}^{\log_2(9)}=\sqrt{2}^{2\log_2(3)}=2^{\log_2(3)}=3\in\mathbb{Q}$$
>
> 因此原命题得证。

用一个更方便理解但不太严谨的说法来说，直觉主义要求每个证明必须给出一组具体的数、数学对象、或者一个可以写成计算机程序的表达式。如果一个证明不满足这些条件，那它就不符合直觉主义逻辑。

## 直觉主义放弃了什么？

在直觉主义中，排中律不再是公理，因为有些命题是不能证明或证伪的，因此在直觉主义中就不属于“逻辑真”或者“逻辑假”。也就是说，直觉主义逻辑的基本命题不止“真”和“假”这两种——实际上可能有无限多种。自然，我们也没法给逻辑运算写出仅包含0和1的真值表。

排中律的一个推论则是**反证法（Proof by Contradiction）**。其表述如下：

> 对于命题$P$，若$\lnot P$能推出逻辑假，则$P$为真。

或者写成逻辑表达式：

> $$(\lnot P\to \bot)\to P$$

从初中开始，我们就见过各式各样的证明了，其中很多都用到了反证法。但在直觉主义中，反证法就不见得成立了。只有非常特殊的命题满足$\lnot p\to\bot$能推出$p$。因此，反证法不能用作一种证明方法。

除此之外，经典逻辑的许多推论在直觉主义中都不一定成立，比如

- 双重否定：$\lnot\lnot p=p$
- 德摩根律：$\lnot(p\land q)=\lnot p\lor\lnot q$, $\lnot(p\lor q)=\lnot p\land\lnot q$

甚至于，直觉主义逻辑中“逻辑非”（$\lnot$）就不是一个基本运算。直觉主义里，用于表述命题和命题之间关系的三个基本运算是“与”（$\land$）、“或”（$\lor$）、和“蕴含”（$\to$）。

说了这么多直觉主义里没有的公理，那么直觉主义到底还有什么？答案是，直觉主义中最重要、最基本的推理规则就是刚刚提到的三段论，或者叫**肯定前件（Modus Ponens）**。更准确地说，这不是一条公理，而是两条更强的公理：

1. $p\to(q\to p)$
2. $(p\to q\to r)\to(p\to q)\to (p\to r)$

（这里统一假设“$\to$”运算是从右往左结合，即$a\to b\to c=a\to(b\to c)$）。

翻译成人话就是：

1. 若$a$成立，则任意前提$b$都能推出$a$成立。
2. 若$a$和$b$能推出$c$，且$a$能推出$b$，那么$a$能推出$c$。

思考题：你能根据这两条公理证明亚里士多德三段论吗？（回忆一下：三段论的逻辑表达式是$p\land (p\to q)\to q$。它有别的等价形式吗？）

## 直觉主义和λ演算

刚刚一下介绍了很多概念，但有一个大问题还没有解决：直觉主义逻辑和构造性证明有什么关系？凭什么为了做构造性证明，我就要放弃排中律，而为什么像是三段论这样的公理就仍然能够使用？

由于这个问题要想完全独立思考出来实在太难，对抽象思维的要求太高，在这里我不妨先说结论：**直觉主义的逻辑运算和λ演算的类型运算之间是一一对应的**。

我们可以将每个命题当作一个集合，其中包含了所有对该命题的构造性证明，而这个命题对应的集合就可以用一个类型来标注。逻辑假（$\bot$）就是不包含任何元素的类型，而逻辑真（$\top$）就是包含一个元素的类型。寻找一个构造性证明就等价于确定某个类型表达式是否包含元素。

可能这段文字还是过于抽象了。我们不妨重新思考一下，怎么通过已有命题证明的组合来去证明新的命题。

### 逻辑与和逻辑或

先从两个最简单的操作入手：逻辑与（$\land$）和逻辑或（$\lor$）。

如果我们有两个命题$p$和$q$，想要证明$p\land q$，需要怎么做？答案很简单，只要分别给出$p$和$q$的证明即可。换言之，如果我们能找到$p$和$q$各自的构造性证明，那么将两者放到一起，就是$p\land q$的构造性证明。

对应到类型推演上其实就是两个类型的笛卡尔积，或者也可以叫**交叉类型**：

> $$\begin{array}{c}\Gamma\vdash a: p \qquad \Gamma\vdash b: q \\ \hline \Gamma\vdash (a, b): p\land q\end{array}$$

上述类型推断规则可以这样理解：有两个变量$a$和$b$，其中$a:p$，$b:q$，那么根据我们对命题类型的定义，$a$就是一个$p$命题的证明，而$b$就是一个对$q$命题的证明。而元组$(a, b)$的类型是$p$和$q$的笛卡尔积，同时元组$(a, b)$也可以作为命题$p\land q$的证明（因为这个元组同时包含了$p$和$q$的证明）。既然如此，我们不妨就将$p\land q$命题的类型定义为$p$和$q$的笛卡尔积。这样也就有了上面这条规则。

说完了逻辑与，我们不妨再来看看逻辑或。对于命题$p$和$q$，如何证明$p\lor q$呢？只要证明$p$、$q$二者之一即可。也就是说，$p$的构造性证明和$q$的构造性证明都属于$p\lor q$的构造性证明。这个操作在类型表达式中就对应着**联合类型**。

如果你熟悉Typescript或者Python中的`|`操作的话可以这样类比：`string | int`类型的变量可以是字符串也可以是整数，但必须是二者之一；正如$p\lor q$的构造性证明可能属于$p$也可能属于$q$，但也必须是二者之一。

用类型推演的语言来说就是两个规则：

> $$\begin{array}{c}\Gamma\vdash a: p \\ \hline \Gamma\vdash a:(p\lor q)\end{array}$$
>
> $$\begin{array}{c}\Gamma\vdash b: q \\ \hline \Gamma\vdash b:(p\lor q)\end{array}$$

### 逻辑蕴含

说完了逻辑与和逻辑或，接下来就到第三个基本运算：蕴含（$\to$）。不妨思考一下，证明$p\to q$需要我们做什么？如果我们有命题$p\to q$的证明，那么只要再给一个$p$的构造性证明，我们便可以证明$q$。换句话说，$p\to q$的证明其实就是$p$到$q$的一个**函数**。命题间的“蕴含”关系和类型间的函数映射是等价的。

这个表述可能仍然比较抽象。不妨举一个具体的例子：令命题$p$为“正整数$a$和$b$互质”，命题$q$为“存在$x, y\in \Z$使得$ax+by=1$”，那么一个$p\to q$的构造性证明可能是这样的：

> 命题：若$a, b\in\N-\{0\}$且互质，则存在$x, y\in\Z$使得$ax+by=1$。
>
> 证明：定义函数$\text{extgcd}: \N\times\N\to \N\times \N$：
>
> 1. 若$\text{extgcd}(a, b)=(x, y)$，则$=\text{extgcd}(b, a)=(y, x)$
> 2. $\text{extgcd}(a, 0)=(1, 0)$
> 3. 若$\text{extgcd}(a, b)=(x, y)$，则$\text{extgcd}(a, b-a)=(x+y, y)$
>
> 可以使用归纳法证明若$\text{extgcd}(a, b)=(x, y)$，则$ax+by=\gcd(a, b)$
>
> （出于篇幅原因省略证明，详见[贝祖定理](https://en.wikipedia.org/wiki/B%C3%A9zout%27s_identity)）
>
> 由于$a, b$互质，$\gcd(a, b)=1$，即：存在$x, y\in \N$使得$ax+by=1$

这个证明依赖了$a, b$互质这一结论，也就是说如果我们给出两数$a, b$，并给出$a, b$互质的证明，那么我们就可以将其代入上述论述，得到$\exist x, y\in \N, ax+by=1$的完整证明。上述证明从某种意义上来说就是某个从命题“$a, b$互质”的证明到命题“$\exist x, y\in \N, ax+by=1$”的证明的函数。

更一般地说，我们有如下推导规则：

> $$\begin{array}{c}\Gamma\vdash a:(p\to q)\qquad \Gamma\vdash b:p \\ \hline \Gamma\vdash (a\ b):q\end{array}$$
>
> $$\begin{array}{c}\Gamma, a:p\vdash b:q \\ \hline \Gamma\vdash (\lambda a:p.\ b): (p\to q)\end{array}$$

### 一个方便理解但不太准确的比喻

可以这样理解命题、证明、公理、逻辑运算、类型这些概念之间的关系。

- 假设你是一名侦探，想要找出某个命案的杀人凶手是谁。你收集了许多证据，并根据这些证据写了许多推论，比如“凶手在午夜2点作案”，“凶手使用一把短柄刀作案”，“作案地点在XX餐厅附近”，“凶手是张三和李四之一”，等等。每一条这样的句子就是一个**命题**。对于每个命题，你都在一张纸上写了你的推导过程，比如“午夜2点有XX餐厅附近的目击证人，且附近监控摄像头拍到可疑人物...”等等，这就是对命题的**证明**。
- 法院对你的证据和推理过程都有严格的要求。你不能在推理中做完全架空的假设。每一步推理都必须基于已有的事实证据和已经得出的结论。比如，你不能在论述中说“假设X是凶手，那么...”这样的推断。这就是**直觉主义逻辑**相较于**经典逻辑**的区别。
- 为了方便整理资料，你把所有对相同命题的证明放在了同一个文件袋里，并在文件袋上贴了标签。比如，你把所有论证“张三是凶手”的文件放在了同一个蓝色袋子里，“凶手作案时间在午夜2点”的文件放在了一个红色袋子里。每一个袋子就是一个**类型**，而每一张文件就是这个类型里的**元素**。有些文件袋里面没有文件，比如“凶手是一个2个月大的婴儿”，那么这个命题就是**假命题**，反之则是**真命题**。
- 你现在想要证明“作案时间在午夜2点且作案地点在XX餐厅”（$p\land q$），而你现在已经有了两个命题各自的证明。于是，你从“作案时间在午夜2点”（$p$）的袋子里拿出一张文件，从“作案地点在XX餐厅”（$q$）的袋子里也拿出一张文件，把它们订在一起，放进了一个新的袋子。将两个文件订起来操作便是**笛卡尔积**，得到的命题就是$p\land q$。
- 你现在想要证明“凶手的作案工具要么是菜刀，要么是剪刀”（$p\lor q$）。你拿出一个新的文件袋，直接把“作案工具是菜刀”（$p$）和“作案工具是剪刀”（$q$）这两个袋子放进了新袋子里。只要原来的两个袋子里有一个不是空的，那么新的袋子里就有符合要求的证明。将两个袋子一起放到新袋子里的操作便是**联合类型**，得到的命题就是$p\lor q$。
- 你现在想要证明“如果凶手使用了菜刀作为工具，那么凶手一定是张三”（$p\to q$）。你搜集了很多证据，比如“只有张三有菜刀，别的嫌疑人没有菜刀”，“当天晚上在张三的屋里搜到一把带血的菜刀”等等，但是唯独缺少法医的尸检报告来确认菜刀就是凶器（$p$）。你在你的论述里空出了一块区域，只要拿到法医的报告，就可以合并起来成为“张三是凶手”（$q$）的完整证据。那么现在你手上的这份论述就是一个**函数类型**，得到的命题就是$p\to q$。

### 更多符号

在直觉主义逻辑中，逻辑非（$\lnot$）不是一个基本运算，而是如下定义的一个复合运算：

$$(\lnot p) := (p\to\bot)$$

即：以$p$为前提时可以构造出逻辑假$\bot$。

由于以下定理一定成立（你能用从类型推断的角度解释原因吗）：

$$(p\to q)\to(q\to r)\to p\to r$$

将其中的$r$替换成$\bot$，并添加一些无关紧要的括号，我们得到：

$$(p\to q)\to((q\to\bot)\to(p\to\bot))$$

也可以写成：

$$(p\to q)\to(\lnot q\to\lnot p)$$

也就是说，在直觉主义逻辑中，逆否命题仍然等价于原命题。但是直觉主义逻辑对逆否命题的解释和经典逻辑不一样。在直觉主义中，$p\to q$的逆否命题（即$\lnot q\to\lnot p=(q\to\bot)\to(p\to\bot)$）的含义是：“可以构造一种方法使得若从$q$能推出矛盾，则也能从$p$也能推出矛盾”。

除了复合符号$\lnot$，还有一个常用的复合符号：$\leftrightarrow$。其定义与经典逻辑一致：

$$(p\leftrightarrow q) := (p\to q)\land (q\to p)$$

### 用Haskell/Typescript做命题逻辑检验

上面的三种基本逻辑运算都对应着某种类型运算，而恰巧诸如Typescript等现代语言的编译器就支持这些类型检查。因此，我们不妨尝试用Haskell和Typescript来书写一些常见的命题逻辑。

关于类型定义，我们可以这么写：

```hs
data F = F F
type T = ()
```

我们将`F`来定义一个不包含任何元素的类型，将`T`定义为空元组类型，因此其只包含空元组本身这一个元素。

这里是等价的Typescript代码：

```ts
type F = never;
class T {}
```

然后我们可以尝试证明一下这些定理：

1. $p\to (q\to p)$：若$p$成立，则在任何前提$q$下$p$都成立。

   ```hs
   example1 :: p -> (q -> p)
   example1 a = \b -> a
   ```

   这个函数其实就是返回了另一个函数，而内部函数不管输入什么都返回外侧传入的参数$a$。这样整个表达式的类型就是`p->(q->p)`。证毕。

   等价的Typescript代码如下：

   ```ts
   const example1: <P, Q>(a: P) => ((b: Q) => P)
       = <P, Q>(a: P) => {
           return (_: Q) => a;
       };
   ```

   记：其实类型$p\to (q\to p)$后面的这个括号可以不加。如果不加括号，类型为$p\to q\to p$，这个表达式还能怎么解读？

2. $(p\to r)\to (q\to r)\to(p\lor q\to r)$：若$p$推出$r$且$q$推出$r$，则$p\lor q$推出$r$。

   别忘了$p\lor q$的定义是$p$和$q$的联合类型。在Haskell中，联合类型用`Either p q`表示。如果`x`是`Either p q`类型的，那么`x`的取值可以是`Left a`（`a : p`）或者是`Right b`（`b : q`）。于是我们可以用模式匹配来分类讨论`Either p q`类型的取值。

   ```hs
   example2 :: (p -> r) -> (q -> r) -> (Either p q -> r)
   example2 f g (Left a) = f a
   example2 f g (Right b) = g b
   ```

   即：如果$p\lor q$的值取了$p$，那么就代入第一个命题函数$f$，否则就代入第二个命题函数$g$。

   很遗憾的是，Typescript并不支持在编译时对联合类型做分支检查，因此上述代码是没法转写成Typescript的。我们只能把这个函数的类型签名写出来：

   ```ts
   const example2: <P, Q, R>(f: (_: P) => R) => (g: (_: Q) => R) => (c: P | Q) => R
       = ...;  // Unable to write in TypeScript
   ```

   ~~Typescript在类型表达式里也要给函数参数命名，导致写出来基本没有可读性~~

3. $(p\to q\to r)\to (p\land q\to r)$：“在$p$条件下$q$能推出$r$”蕴含“$p\land q$能推出$r$”

   $p\land q$表示$p$和$q$的交叉类型。在Haskell中，我们可以用二元元组`(P, Q)`表示。该定理的证明如下：

   ```hs
   example3 :: (p -> q -> r) -> ((p, q) -> r)
   example3 f (a, b) = f a b
   ```

   利用Haskell的模式匹配，我们可以直接将类型为`(p, q)`的元组展开为其中的两个元素。

   等价的Typescript代码如下：

   ```ts
   const example3: <P, Q, R>(f: (_: P) => (_: Q) => R) => ((a: [P, Q]) => R)
       = <P, Q, R>(f: (_: P) => (_: Q) => R) => {
           return (a: [P, Q]) => {
               return f(a[0])(a[1]);
           };
       };
   ```

### 总结

以上为直觉主义逻辑中的三个基本操作（$\land$、$\lor$、$\to$）在类型推断中的对应关系。总结一下：

|命题|类型|
|:---:|:---:|
|命题为真|类型包含元素|
|命题为假|类型不包含元素|
|$\top$|单元类型|
|$\bot$|空类型|
|$\land$|交叉类型/类型的笛卡尔积|
|$\lor$|联合类型|
|$\to$|函数类型|

这个对应关系就是**柯里-霍华德同构（Curry Howard Isomorphism）** [[2]](#cite-2)，最早由逻辑学家哈斯凯尔·柯里（就是提出函数柯里化的那位）和威廉·霍华德独立发现。

## 谓词逻辑和依赖类型

上述的逻辑运算只包含了命题逻辑，没有包含谓词逻辑（即：使用$\exist$和$\forall$修饰变量的命题）。如果我们想要给命题加谓词，那么就需要引入新的类型。

先从存在谓词（$\exist$）开始说起。如果想要证明命题“$\exist x:T. p(x)$”，我们需要给出一个具体的$x$值，以及其对应命题$p(x)$的证明。注意，这里的命题$p(x)$依赖于一个具有类型$T$的数值$x$，也就是说$p$是一个从数值到命题的函数。

举个例子，比如这个命题

$$\exist x:\N.\ x+1=5$$

那么此时$p(x)$就是命题函数“$x+1=5$”，是一个从自然数$\N$到命题的映射。而我们知道，“命题”对应着“类型”，而此时命题$p(x)$的类型依赖于自然数$x$，因此我们又称这样的类型为**依赖类型（Dependent Type）**。

$$p: \N\to *$$

$$p(x):(x+1=5),\ x:\N$$

> 补充：依赖类型
>
> 如果这个例子你没看明白的话，可以类比到通用型编程语言里。依赖类型的概念就好比，某个函数在输入1的时候会返回一个整数类型，而输入2的时候会返回一个字符串类型，而编译器能够在编译时就根据输入的数字来判断输出的类型会是什么。这就是依赖类型。
>
> ```typescript
> // 一段“伪typescript”用来展示依赖类型
> //
> // 注意：本代码仅用于展示依赖类型的概念，并非可执行的javascript代码。直接运行该代码会在编译器中报错。
> 
> // `dependentType`函数返回了一个类型，而该类型会取决于输入的数
> function dependentType(a: number): Type {
>   if(a == 1) {
>     return number;
>   } else {
>     return string;
>   }
> }
> 
> // `example`函数的返回类型是`dependentType`函数在a上的取值，而这个类型又可以有取值
> function dependentFunc(a: number): dependentType(a) {
>   if(a == 1) {
>     return 123;
>   } else {
>     return "hello, world";
>   }
> }
>
> let a = dependentFunc(1);   // 编译器能检查出此时a的类型是number
> let b = dependentFunc(2);   // 编译器能检查出此时b的类型是string
> ```
>
> 而同样的代码则能在Lean中写出表达式：
>
> ```lean
> def dependentType (a : Nat) : Type :=
>   if  a = 1 then
>     Nat
>   else
>     String
> 
> def dependentFunc (a : Nat) : dependentType a
>   :=
>     if h : a = 1 then
>       cast (by rw [h]; dsimp [dependentType]) 1
>     else
>       cast (by dsimp [dependentType]; rw [if_neg h]) "Hello"
> ```
>
> （由于编译器无法直接判断`dependentType 1 = Nat`，我们需要在每个分支中使用`cast`函数做类型转换，并提供`dependentType x`在`x = 1`和`x ≠ 1`时的证明）
>
> 某些编程语言中会有依赖类型，比如使用类型$\text{Vec}(n)$表示大小为$n$的数组。这里的$\text{Vec}$就是一个依赖类型，因为每给它一个不同的自然数$n$，它就会产生一个新的类型。

说回这里的命题类型。那么整个命题“$\exist x:N.\ x+1=5$”对应着什么类型呢？首先它应该是一个像$p\land q$那样的交叉类型，第一部分放构造出的自然数$x$，而第二部分放$p(x):=(x+1=5)$的证明。也就是说，它的类型是：

$$\N\times(x+1=5)$$

但是我们会发现，在第二部分里我们还没有定义$x$：我们放在第二部分的命题证明取决于第一部分我们取的$x$值。因此这个类型并不是简单的交叉类型。我们称这样的依赖类型为**Σ类型**。

$$\sum_{x:\N}(x+1=5)$$

更一般地，对于任意存在性命题$(\exist a:t.\ p(a))$，其在类型演算中对应的类型为：

$$\sum_{a:t}p(a)$$

或者写成类型推导规则：

> $$\begin{array}{c}\Gamma\vdash t:\ast \qquad \Gamma, a:t\vdash b:p \\ \hline \Gamma\vdash (a, b):\sum_{a:t}p \end{array}$$

其中“$\ast$”标记了“类型的类型”，$t:\ast$就表示“$t$是一个类型”。若没有特殊标记，则默认允许$p$是$a$的函数，即$p$的表达式中可以包含符号$a$。

类似地，对于全称谓词（$\forall$），例如如下命题：

$$\forall x:\Z.\ x^2\ge 0$$

其构造性证明需要满足带入整数$x$时返回一个$x^2\ge 0$的证明。也就是说，我们需要构造一个从整数$x$到命题$x^2\ge 0$的证明的函数。换言之，其类型为：

$$\Z\to(x^2\ge 0)$$

同样的问题，这里函数返回值的类型取决于输入的参数，因此也不是一个简单的函数类型。我们记这样的类型为**Π类型**。

$$\prod_{x:\Z}(x^2\ge 0)$$

Π类型有如下类型推导规则：

> $$\begin{array}{c}\Gamma\vdash t:*\qquad \Gamma, a:t\vdash b:p \\ \hline \Gamma\vdash (\lambda a.\ b):\prod_{a:t}p \end{array}$$
>
> $$\begin{array}{c}\Gamma, t:*\vdash m:\prod_{a:t}p\qquad \Gamma, t:*\vdash n:t \\ \hline \Gamma, t:*\vdash (m\ n):p[n/a]\end{array}$$

其中$p[n/a]$表示将$p$中的所有$a$符号用$n$替代。

### 依赖类型总结

||Σ类型|Π类型|
|---|---|---|
|概念|第二项取决于第一项的数对|返回值取决于参数的函数|
|对应谓词|存在谓词 $\exist$|全称谓词 $\forall$|
|对应关系|$\exist x:t.\ p(x)$ = $\sum_{x:t}p(x)$|$\forall x:t.\ p(x)$ = $\prod_{x:t}p(x)$|
|特殊情况|交叉类型 $p\land q$|函数类型 $p\to q$|
|说明|当$q$不依赖$p$时：<br/>$p\land q=\sum_{a:p}q$|当$q$不依赖$p$时：<br/>$p\to q=\prod_{a:p}q$|

这张表补全了上一章[总结](#总结)中提到的柯里-霍华德同构。完整的柯里-霍华德同构定义了所有谓词命题和所有$\lambda^C$系统（即：定义了依赖类型的λ演算系统）之间的对应关系 [[3]](#cite-3)。

### Lean和程序定理验证

遗憾的是，目前绝大多数的编程语言都无法做依赖类型推断（毕竟这个需求也太小众了吧！）。但是，有一些为辅助定理证明而生的编程语可以检查像Σ类型和Π类型这样的依赖类型，比如[**Lean**](https://lean-lang.org/)。

Lean是一个函数式编程语言，因此如果你熟悉了刚刚我们用Haskell做的推导的话，只需要稍加学习Lean的基本语法便可以使用Lean来重写上面的几个证明：

```lean
theorem example1(p q : Prop) : p → q → p :=
  fun a : p => fun _ : q => a

theorem example2(p q r : Prop) : (p → r) → (q → r) → (p ∨ q → r) :=
  fun f : (p → r) => fun g : (q → r) => fun a : (p ∨ q) =>
    match a with
      | Or.inl (b : p) => (f b)
      | Or.inr (b : q) => (g b)

theorem example3(p q r : Prop) : (p → q → r) → (p ∧ q → r) :=
  fun f : (p → q → r) => fun a : (p ∧ q) => (f a.left a.right)
```

其中`Or`就是我们之前说的联合类型，有`Or.inl`和`Or.inr`两种情况。`And`则是交叉类型，其内部包含两个元素，第一个用`.left`访问，第二个用`.right`访问，也可以用`And.intro a b`或者元组`⟨a, b⟩`创建一个`And`对象。

而Lean不仅可以检验命题逻辑，还可以做谓词逻辑。比如之前例子中的这个命题：

$$\forall x:\Z.\ x^2+1\ge 0$$

用Lean来写就是这样的：

```lean
theorem example4 : (∀ x : Int, x^2 >= 0) :=
  sorry
```

在此我们使用Lean的`sorry`关键字把证明留空~~用sorry表示未完成部分真的很独特好吧~~。

既然全称量词对应着Π类型，而Π类型又是一种函数，我们便可以先把函数定义写出来：

```lean
theorem example4 : (∀ x : Int, x^2 >= 0) :=
  fun x : Int => sorry
```

如果你使用VSCode的Lean插件，你可以将鼠标放在这个`sorry`前面，就可以看到此处的已知变量和待证明的目标：

```lean
x : Int
⊢ x ^ 2 ≥ 0
```

也就是说，我们需要在这个`sorry`里放上`x ^ 2 ≥ 0`的证明即可。一个完整的证明如下所示：

```lean
theorem int_square_equals_mul_itself (x : Int) : (x ^ 2 = x * x) := by
  rw [Int.pow_succ, Int.pow_succ, Int.pow_zero, Int.one_mul]

theorem example4 : (∀ x : Int, x ^ 2 >= 0) :=
  fun x : Int => by
    by_cases h : x ≥ 0
    · -- Case 1: x ≥ 0
      have hx : 0 ≤ x := h
      calc
        x ^ 2 = x * x := by rw [int_square_equals_mul_itself]
        _ ≥ 0 := Int.mul_nonneg hx hx
    · -- Case 2: x < 0
      have hlt : x < 0 := Int.lt_of_not_ge h
      have hpos : 0 < -x := Int.neg_pos.mpr hlt
      calc
      x ^ 2 = x * x := by rw [int_square_equals_mul_itself]
      _ = (-x) * (-x) := by rw [Int.neg_mul_neg]
      _ ≥ 0 := Int.mul_nonneg (Int.le_of_lt hpos) (Int.le_of_lt hpos)

```

后面的这个`by`关键字是一个类似Haskell中的Monad的东西，可以在`by`后面用顺序的方式书写指令。目前暂时不用掌握`by`的用法。之后我可以单独写一篇文章介绍Lean的各种证明策略。~~不要继续挖坑了啊！~~

为了证明这个定理，我们引入了一个引理`int_square_equals_mul_itself`。这个引理的类型签名是这样的：

```lean
theorem int_square_equals_mul_itself (x : Int) : (x ^ 2 = x * x)
```

它也是输入一个整数，输出类型取决于输入的整数。用依赖类型来写的话是这样的：

$$\prod_{x:\Z}(x^2=x\times x)$$

也就是说，上面这个`int_square_equals_mul_itself`的类型签名和下面这个是等价的：

```lean
theorem int_square_equals_mul_itself : (∀ x : Int, x ^ 2 = x * x)
```

类似地，我们也可以用Lean验证存在性命题，比如：

$$\exist x:\Z.\ x^2+2x-3 \lt 0$$

写成Lean就是这样的：

```lean
theorem example5 : (∃ x : Int, x ^ 2 + 2 * x - 3 < 0) :=
  sorry
```

既然存在性命题对应Σ类型，而Σ类型就是一个元组，我们可以直接在证明里放上一个元组：

```lean
theorem example5 : (∃ x : Int, x ^ 2 + 2 * x - 3 < 0) :=
  ⟨0, by simp⟩
```

这里的尖括号`⟨0, by simp⟩`就表示一个元组，第一项是我们构造出来的$x$，第二项就是$x^2+2x+3\lt0$的证明。这里的证明很简单，不用做任何符号操作，直接使用`simp`策略做代数化简即可。

如果我们第一项放的不是0，而是2，那么在后一项化简的时候就会出错：

```lean
theorem example5 : (∃ x : Int, x ^ 2 + 2 * x - 3 < 0) :=
  ⟨2, by simp⟩
```

由于此时化简右侧会得到逻辑假，你会看到这样的错误信息：

```lean
unsolved goals
⊢ False
```

这个例子说明我们返回的元组第二项的类型取决于第一项的数值。

### Lean验证程序正确性

Lean不仅可以用在纯数学上，也可以用来验证一个算法的正确性。比如，下面这段代码定义了一个简单的列表结构（如果你忘记了归纳类型也可以看[上期文章]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %})回忆一下）：

```lean
inductive MyList (α : Type) : Type where
  | nil  : MyList α
  | cons : α -> MyList α -> MyList α

def MyList.length {α : Type} (l : MyList α) : Nat := match l with
  | MyList.nil => 0
  | MyList.cons (_ : α) (ll : MyList α) => (MyList.length ll) + 1

def MyList.concat {α : Type} (l m : MyList α) : MyList α :=
  match l with
    | MyList.nil => m
    | MyList.cons (a : α) (ll : MyList α) => MyList.cons a (MyList.concat ll m)
```

接下来我们就可以用Lean来证明，两个列表相连之后的长度等于其各自长度之和：

```lean
theorem concat_list_len_equals_sum_of_len (l m : MyList α) : (MyList.length (MyList.concat l m)) = (MyList.length l) + (MyList.length m) :=
  match l with
    | MyList.nil => by
      rw [MyList.concat, MyList.length, Nat.zero_add]
    | MyList.cons (a : α) (ll : MyList α) => by
      rw [MyList.concat, MyList.length, MyList.length, concat_list_len_equals_sum_of_len]
      simp [Nat.add_comm, Nat.add_assoc]
```

也可以用来证明列表的第`i`个下标在`i`小于列表长度时一定非空：

```lean
def MyList.is_empty {α : Type} (l : MyList α) : Prop := (l = MyList.nil)

def MyList.at {α : Type} (l : MyList α) (n : Nat) : Option α :=
  match l with
    | MyList.nil => none
    | MyList.cons (a : α) (ll : MyList α) => if n = 0 then a else (ll.at (n-1))

theorem index_less_than_length_has_value {α : Type} (l : MyList α) (n : Nat)
  : (n < l.length) → (l.at n).isSome = true
  := match l with
    | MyList.nil => by
      rw [MyList.length, MyList.at]
      simp
    | MyList.cons (a : α) (ll : MyList α) => by
      rw [MyList.length, MyList.at]
      by_cases h : n = 0
      · simp [h]
      · have h' : (n > 0) := Nat.pos_iff_ne_zero.mpr h
        simp [h]
        let m := n - 1
        have hs : (m + 1 = n) := by
          have hnm : (n - 1 = m) := rfl
          rw [← hnm]
          exact Nat.succ_pred_eq_of_pos h'
        rw [← hs]
        simp
        apply index_less_than_length_has_value
```

本文所有代码都放在[GitHub](https://github.com/MqCreaple/mqcreaple.github.io/tree/master/resources/code/2025-10-21-logic-and-proof/)仓库中。更多关于Lean的内容可以期待一下之后的文章。

## 参考资料

<a id="cite-1"></a> [1] “Lambda Cube.” *Wikipedia*, <https://en.wikipedia.org/wiki/Lambda_cube>. Accessed 22 Oct. 2025.

<a id="cite-2"></a> [2] “Curry-Howard Correspondence.” *Wikipedia*, <https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence>. Accessed 22 Oct. 2025.

<a id="cite-3"></a> [3] J Roger Hindley, and Jonathan P Seldin. *Lambda-Calculus and Combinators : An Introduction.* Cambridge, Cambridge University Press, 2010.
