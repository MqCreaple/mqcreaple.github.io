---
title: 有类型λ演算
layout: blog
tags: ["lambda-calculus", "computation"]
---

> 前注：其实这篇文章在2022年9月就写好了，当时本来打算和前几篇讲Lambda演算的文章一起发，结果在硬盘里一放就是三年，今天才翻出来。正好最近看了些关于直觉逻辑主义的内容，里面也有一些关于类型系统的内容。在阅读完这篇3年前的文章，修改了几处错误并添加了部分内容后，将其重新发布。

**温馨提示：如果你不了解λ演算，请先阅读[这篇文章]({% link blog-zh/_posts/2022-08-27-lambda.md %})和[这篇文章]({% link blog-zh/_posts/2022-09-02-y-combinator.md %})以获得最佳食用体验**

*注：本文所有的小写字母/单词是变量，大写字母/首字母大写的单词是类型。为了不和类型混淆，本文中“真”用`true`而非`T`，“假”用`false`而非`F`*

## 朴素有类型演算 | Simply Typed Lambda Calculus

之前我们建立了无类型的λ演算，但它十分的混乱，因为任何值都可以代入任何λ项里。因此，我们希望给λ演算加上一定的约束：**类型**。

在有类型λ演算中，所有变量和函数都需要有类型约束。比如，一个无类型的λ表达式可能是这样的：

```plaintext
f := λa. λb. a
```

给它加上类型约束就是这样的：

```plaintext
f := λa:Int. λb:Int. a
```

那么这样的λ表达式就只能接受两个类型为`Bool`的参数，也就是说，下面三个函数调用中，1是合法的，而2和3是非法的：

1. (✓) `(f 1 2)`
2. (✕) `(f true false)`
3. (✕) `(f 1 (λu. u))`

有时你也会看到类型注解被写成元素上标：

$$f := \lambda a^{\text{Int}}.\ \lambda b^{\text{Int}}.\ a$$

## 函数类型

既然λ表达式里所有对象都有类型，那么函数也不例外。

我们定义，如果函数$f$仅输入一个参数，并且参数的类型为$U$，返回值的类型为$V$，那么函数$f$的类型为：$U\to V$。

例如，逻辑非(`NOT`, $\lnot$)，表达式如下：

```plaintext
NOT = λb:Bool. (b F T)
```

由于它输入一个布尔值，返回一个布尔值，所以`NOT`的类型就被写为：`Bool→Bool`。

根据上面的定义，我们一定有如下推导：

```plaintext
f: U→V, x:U
 ==> (f x):V
```

### 多元函数

想必你现在已经知道单元函数的类型怎么写了，那么接下来就是多元函数了。

假如我们有如下函数$g$，接受两个类型为$T$和$U$的参数，返回值类型为$V$：

```plaintext
g := λa:T. λb:U. [BODY]:V
```

这时候就可以用到之前提到过的*柯里化*。如果你忘记了函数的柯里化，可以回到[这里]({% link blog-zh/_posts/2022-08-27-lambda.md %}#多元函数)。

我们将$g$看作一个关于$a$的单值函数，它的返回值是另一个类型为$U\to V$的λ表达式。也就是说，$g$的类型是：

```plaintext
T→(U→V)
```

为了方便书写，我们省略后面的括号，将其写为：`T→U→V`。

**注意：`→`不具有结合律，`(T→U)→V`和`T→(U→V)`是不同的类型。前者表示“输入类型为`T→U`的λ表达式，输出类型为`V`的值”，而后者表示“输入两个类型分别为`T`和`U`的值，输出类型为`V`的值”。比如，当`T`、`U`和`V`均为实数$\R$的时候，$(\R\to\R)\to\R$表示的是一元泛函，而$\R\to(\R\to\R)$（通常数学上也写成$\R\times\R\to\R$）表示的是二元函数。**

类似的规则可以拓展到更多元的函数。如果你下次遇到了一个一连串箭头的类型表达式：

$$T_1\to T_2\to T_3\to\cdots\to T_n\to U$$

它的含义就是：这个函数输入$n$个类型从$T_1$到$T_n$的参数，返回类型为$U$的值。

### 小结

有了类型定义，λ演算变得清晰了不少。但是，这样也让很多本来合法的无类型表达式变得不合法了，比如$\Omega$：

```
Ω := ((λx. (x x)) (λx. (x x)))
```

你会发现，这个表达式里的$x$不可能拥有确定的类型。假如$x$的类型是$T$，那么为了让函数调用$(x\ x)$合法，$x$的类型又必须输入值为$T$的函数，而一个类型显然不能包含它自己，矛盾。

因此，在有类型的λ演算中无法表达函数递归了，进而无法实现许多有用的逻辑。这是一个巨大的损失。

但另一方面，我们也可以证明，任何有类型的λ表达式一定可以求值（即：它要么有一个确定的值，要么可以证明它不合法）。有类型λ演算中不再会出现`Ω`这种异类了。

### 思考题

1. 判断以下函数的类型（记布尔类型为`Bool`，整数类型为`Int`）：
    - 整数加法：`+`
    - 整数后继：`succ`
    - 整数判断：`>`
    - 逻辑或：`or`
    - `Repeat := λf:(T→T). λx:T. (f (f x))`
2. 证明：任何有类型的λ表达式一定可以求值

## System-F和扩展类型

现在我们有了基本类型和函数类型`→`了，但这样的类型系统还是稍微单薄了一点，我们还希望继续添加更多的类型操作。

接下来将会定义一系列对有类型λ演算的扩展运算，我们称其为*F系统（System F）*。

### 类型变量

考虑下面的无类型函数：

```plaintext
f := λa. λb. a
```

我们希望不管`a`和`b`是什么类型，`f`都有定义。为了实现这个语法，我们引入$\Lambda$（大写Lambda）记号：

```plaintext
f := ΛT. λa:T. λb:T. a
```

此时`f`可以看作是三个元素的函数：类型`T`、变量`a`和变量`b`。例如：

```plaintext
(f Int 2 3):Int = 2
```

在这里我们认为类型`T`也是参数的一部分。这里的大写Λ记号和许多编程语言中的“模板函数”或者“泛型”的概念很像。

我们记函数`f`的类型为：`∀T. T→T→T`，因为这个函数接收一个类型`T`，两个类型为`T`的参数，并且返回类型是`T`。在向`f`中代入一个类型之后，`∀`会被被替换成具体的类型，比如：

```plaintext
(f Int) = λa:Int. λb:Int. a
```

那么`(f Int)`的类型很显然就是`Int→Int→Int`。

这个概念与许多计算机语言中的函数泛型有点像。比如C++中可以用模板函数实现与上述函数`f`相同的效果：

```cpp
template<typename T>
T first(T a, T b) {
    return a;
}

first<int>(2, 3);    // returns 2
```

类型记号中的`∀T`可以看作是对后面`T→T→T`的修饰，两者共同构成了一个完整的类型。这个类型也可以用来注释其他的变量。比如，我们可以定义这样的一个函数：

```plaintext
repeat := ΛT. λf:(T→T). λx:T. (f (f x))
```

这样`repeat`函数就可以用在任意类型的函数上了。

## 补充1：归纳类型 Inductive Type

我们汇总一下之前用到的数据类型，以及补充一些其他的数据类型：

|类型名称|类型表达式|举例|
|---|---|---|
|布尔类型|`∀T. T→T→T`|`true` = `ΛT. λa:T. λb:T. a`<br>`false` = `ΛT. λa:T. λb:T. b`|
|自然数类型|`∀T. T→(T→T)→T`|`0` = `ΛT. λz:T. λf:(T→T). z`<br>`1` = `ΛT. λz:T. λf:(T→T). (f z)`<br>`2` = `ΛT. λz:T. λf:(T→T). (f (f z))`<br>...|
|元素为`U`的列表类型|`∀T. T→(U→T)→T`|空列表=`ΛT. λnil:T. λcon:(Int→T). nil`<br>[1, 2, 3] = `ΛT. λnil:T. λcon:(Int→T). (con 1 (con 2 (con 3 nil)))`|
|叶节点元素为`U`的二叉树类型|`∀T. (U→T)→(T→T→T)→T`|![](/img/binary-tree-example.png)<br>=`∀T. λl:(Int→T). λn:(T→T→T). (n (n (l 1) (l 2)) (l 3))`|

讲了这么多关于Lambda表达式的内容，可能你还有点疑惑：Lambda表达式的这些数据类型都是怎么做出来的？数学家们都是怎么想到诸如`∀T. T→T→T`可以表示布尔类型，`∀T. T→(T→T)→T`可以表示自然数？

细心的你可能已经从上面这些例子中看出来了，这些类型的创建都是有规律的。我们不妨对比一下这些类型的Haskell实现：

```hs
data Bool = True | False

data Natural = Zero | Succ Natural

data List u = Nil | Con u List

data BinaryTree u = Leaf u | NonLeaf BinaryTree BinaryTree
```

可以看到，这些类型都有一些共性：

1. 每个类型都可以表示成一系列子类型的并（`|`）。比如，布尔类型就是要么为`True`、要么为`False`，整数类型就是要么为`Zero`，要么为某个其他整数的后继。
2. 除了`Bool`外，其他类型的表达式的定义中递归使用了自己。比如整数的`Succ`分支中就传入了自己作为参数。

具有这两种性质的数据类型我们便称为**归纳类型**。

据此，我们便可以总结出一套在有类型λ演算中构造归纳类型的通用方法：

1. 把要构造的类型抽象为`ΛT`。
2. 对于每一种子类型，设子类型包含的参数为`U1`, `U2`, ..., `Un`，那么就在函数里添加一个新参数：`λa:(U1→U2→...→Un→T)`。如果`U1`到`Un`中递归使用了自己作为类型，则将其替换为`T`。
3. 令函数的返回值为`T`。

在定义某个以归纳类型为参数的函数时，可以直接枚举它的所有分支情况，像这样：

```hs
data Natural = Zero | Succ Natural

add :: Natural -> Natural -> Natural
add Zero y = y
add (Succ x) y = Succ (add x y)
```

这段代码可以转化为等价的λ表达式：

```plaintext
Natural := ∀T. T→(T→T)→T
add := λa:Natural. λb:Natural.
    ΛT. λzero:T. λsucc:(T→T).
    (a
        T
        (b T zero succ)
        (λx:T. succ (add x b)))
```

其中`a`被视作一个函数，分别带入为`T`和两种分支下的函数表达式。

练习：你能将以下Haskell类型/函数写成λ演算的类型形式吗：

```haskell
data Natural = Zero | Succ Natural
data List u = Nil | Con u List
data BinaryTree u = Leaf u | NonLeaf BinaryTree BinaryTree

-- 练习1
data Word = Noun | Verb | Adjective
data NounPhrase = Noun | Noun NounPhrase | Adjective NounPhrase
data Sentence = NounPhrase Verb | NounPhrase Verb NounPhrase

-- 练习2
length :: [u] => (List u) -> Int
length Nil = 0
length (Con a) = (a + 1)

-- 练习3
leftmost :: [u] => (BinaryTree u) -> u
leftmost (Leaf u) = u
leftmost (NonLeaf a b) = (leftmost a)
```

## 补充2：语境 Context

假设我们有这样一个没有写完的表达式：

```plaintext
(
    ΛT. λa:Int. λb:T. λc:(T→Bool).
    _______
)
```

在我们写到第三行的时候，变量`T`, `a`, `b`, `c`即便还没有值，但它们的类型已经是确定的了。我们可以假想一个虚拟的集合记录了当前位置所有的变量和其类型。我们将这个集合称为**语境**，通常用$\Gamma$表示。例如这个表达式划线处的语境就是：

```plaintext
Γ = {
    T: *,
    a: Int,
    b: T,
    c: (T→Bool),
}
```

（一般我们用`*`表示“类型的类型”）

有时候你可能会见到用类似这样的记号书写类型系统：

![Gentzen's Notation (Wikipedia)](https://wikimedia.org/api/rest_v1/media/math/render/svg/e217b433eee2aba4f5d7bf24af72cf115ed25b4a)

其中的$\Gamma$就是我们说到的语境，$\vdash$记号表示类型推断，而横线则表示逻辑推断。比如上面这个公式就可以这么翻译：

“如果在语境$\Gamma,x:\sigma$中$t$的类型为$\tau$，那么在语境$\Gamma$中表达式$(\lambda x. t:\sigma)$的类型为$(\sigma\to\tau)$。”

这便是朴素有类型演算中提到的类型推断规则。

## 参考资料

[1] “Lambda Cube.” *Wikipedia*, <https://en.wikipedia.org/wiki/Lambda_cube>. Accessed 3 Sep. 2025.
