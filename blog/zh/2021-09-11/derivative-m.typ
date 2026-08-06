// title: 算法化求导
// summary: 从表达式树出发，把求导法则变成可在树上递归执行的算法。
// tags: mathematics, calculus, algorithm
// category: tech

#import "../../template.typ": article
#import "@preview/fletcher:0.5.8": diagram, edge, node

#show: article.with(
  title: "算法化求导",
  lang: "zh",
)

求导是一种算符，输入一个表达式，输出另一个表达式。

我们学过求导的运算法则，例如 $(u+v)' = u' + v'$ 等等，将这些法则运用于某个表达式，即可实现算法化求导。

首先，我们要从表达式树说起。

= 表达式树

任何一个表达式，都可以被拆解成一棵二叉树，其中叶结点为数字或字母，非叶结点则为运算符和函数。

例如如下的表达式：

$ f(x) = 3 x^2 + 2 sin(x) $

可以被拆解成如下的表达式树：

#html.frame[
  #diagram(
    node-stroke: 0.6pt,
    node((0, 0), [$+$], shape: circle),
    node((-1.5, 1), [$ast$], shape: circle),
    node((1.5, 1), [$ast$], shape: circle),
    node((-2.2, 2), [$3$]),
    node((-0.8, 2), [$"^"$], shape: circle),
    node((0.8, 2), [$2$]),
    node((2.2, 2), [$sin$], shape: circle),
    node((-1.2, 3), [$x$]),
    node((-0.4, 3), [$2$]),
    node((2.2, 3), [$x$]),
    edge((0, 0), (-1.5, 1)),
    edge((0, 0), (1.5, 1)),
    edge((-1.5, 1), (-2.2, 2)),
    edge((-1.5, 1), (-0.8, 2)),
    edge((1.5, 1), (0.8, 2)),
    edge((1.5, 1), (2.2, 2)),
    edge((-0.8, 2), (-1.2, 3)),
    edge((-0.8, 2), (-0.4, 3)),
    edge((2.2, 2), (2.2, 3)),
  )
]

计算 $f(x)$ 的过程也很简单，只需要将所有未知数都替换成某个特定的值 $x_0$，接着从下往上递归，将所有非叶结点替换为计算结果，最后根结点的数值就是答案了。

以上面的表达式树为例，如果我们想要计算 $f((pi)/(2))$ 的数值，首先把所有 $x$ 结点换成 $(pi)/(2)$：

#html.frame[
  #diagram(
    node-stroke: 0.6pt,
    node((0, 0), [$+$], shape: circle),
    node((-1.5, 1), [$ast$], shape: circle),
    node((1.5, 1), [$ast$], shape: circle),
    node((-2.2, 2), [$3$]),
    node((-0.8, 2), [$"^"$], shape: circle),
    node((0.8, 2), [$2$]),
    node((2.2, 2), [$sin$], shape: circle),
    node((-1.2, 3), [$(pi)/(2)$]),
    node((-0.4, 3), [$2$]),
    node((2.2, 3), [$(pi)/(2)$]),
    edge((0, 0), (-1.5, 1)),
    edge((0, 0), (1.5, 1)),
    edge((-1.5, 1), (-2.2, 2)),
    edge((-1.5, 1), (-0.8, 2)),
    edge((1.5, 1), (0.8, 2)),
    edge((1.5, 1), (2.2, 2)),
    edge((-0.8, 2), (-1.2, 3)),
    edge((-0.8, 2), (-0.4, 3)),
    edge((2.2, 2), (2.2, 3)),
  )
]

接下来从下向上递归计算。先将 $((pi)/(2))^2$ 替换为 $(pi^2)/(4)$，将 $sin((pi)/(2))$ 替换为$1$：

#html.frame[
  #diagram(
    node-stroke: 0.6pt,
    node((0, 0), [$+$], shape: circle),
    node((-1.5, 1), [$ast$], shape: circle),
    node((1.5, 1), [$ast$], shape: circle),
    node((-2.2, 2), [$3$]),
    node((-0.8, 2), [$(pi^2)/(4)$]),
    node((0.8, 2), [$2$]),
    node((2.2, 2), [$1$]),
    edge((0, 0), (-1.5, 1)),
    edge((0, 0), (1.5, 1)),
    edge((-1.5, 1), (-2.2, 2)),
    edge((-1.5, 1), (-0.8, 2)),
    edge((1.5, 1), (0.8, 2)),
    edge((1.5, 1), (2.2, 2)),
  )
]

继续重复上述操作：

#html.frame[
  #diagram(
    node-stroke: 0.6pt,
    node((0, 0), [$+$], shape: circle),
    node((-1.2, 1), [$(3 pi^2)/(4)$]),
    node((1.2, 1), [$2$]),
    edge((0, 0), (-1.2, 1)),
    edge((0, 0), (1.2, 1)),
  )
]

最终得到答案：$(3 pi^2)/(4) + 2$。

= 树上操作 & 求导

我们暂且使用：

```java
class Node {
    private String operator;
    private Node left;
    private Node right;
    Node(char operator, Node left, Node right) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}
```

来表示一个表达式树的非叶结点。

== 加减法

我们不妨从最简单的加法运算开始考虑。

当某个结点是 `+` 运算时，我们不妨设左右两端的表达式分别为 $f(x)$ 和 $g(x)$，那么这个结点就表示了函数 $h(x) = f(x) + g(x)$。

```text
    +
   / \
f(x) g(x)
```

*（省流大师）*

那么，根据导数的运算律，我们可以得到：

$ h'(x) = (f + g)'(x) = f'(x) + g'(x) $

也就是说，先分别计算这棵表达式树的左右子树的导数，接着将它们套在一个 `+` 结点上，就是这个表达式树的导数。

```text
                 +               +
derivative {    / \    } =     /   \
             f(x) g(x)     f'(x)  g'(x)
```

写成代码的形式，就是：

```java
if(root.operator == "+") {
    return new Node(
        "+",
        derivative(root.left),
        derivative(root.right)
    );
}
```

对于减法，也是同理：

```text
                 -               -
derivative {    / \    } =     /   \
             f(x) g(x)     f'(x)  g'(x)
```

```java
if(root.operator == "-") {
    return new Node(
        "-",
        derivative(root.left),
        derivative(root.right)
    );
}
```

== 乘法 & 除法

乘法运算则略微复杂一些。如果 $h(x) = f(x) g(x)$，根据导数运算律，有：

$ h'(x) = f(x) g'(x) + g(x) f'(x) $

也就是：

```text
                                   +
                 *              /     \
derivative {    / \    } =    *         *
             f(x) g(x)      /   \     /   \
                         f(x) g'(x) g(x) f'(x)
```

写成代码：

```java
if(root.operator == "*") {
    return new Node(
        "-",
        new Node(
            "*",
            root.left,
            derivative(root.right)
        ),
        new Node(
            "*",
            root.right,
            derivative(root.left)
        )
    );
}
```

除法则更复杂一些：

$ ((f(x))/(g(x)))' = (f'(x) g(x) - f(x) g'(x))/(g(x)^2) $

~~表达式树实在懒得画了~~

也就是：

```java
if(root.operator == "/") {
    return new Node(
        "/",
        new Node(
            "-",
            new Node(
                "*"
                root.right,
                derivative(root.left)
            ),
            new Node(
                "*",
                root.left,
                derivative(root.right)
            )
        ),
        new Node(
            "^",
            root.right,
            new NumberNode(2)
        )
    );
}
```

== 乘方

到了乘方这里，事情就有点难办了。

我们知道指数函数的导数公式 $(a^x)' = a^x ln a$，也知道幂函数的导数公式 $(x^a)' = a x^(a-1)$，但是现在问题是：未知数可能同时出现在底数和指数上。

换句话说，我们想要求的是：

$ (f(x)^(g(x)))' $

```text
                 ^
derivative {    / \    } = ?
             f(x) g(x)
```

这里我们要用到一点小技巧。

首先令

$ y = f(x)^(g(x)) $

接着，两边同时求对数：

$ ln y = ln f(x)^(g(x)) = g(x) ln f(x) $

接下来，两边对 $x$ 求导，得到：

$ (dif ln y)/(dif x) = (dif (g(x) ln f(x)))/(dif x) $

对等式左侧使用链式求导法则：

$ (dif ln y)/(dif x) = (dif ln y)/(dif y) dot (dif y)/(dif x) = (1)/(y) dot (dif y)/(dif x) $

同时对等式右侧使用导数的乘法法则：

$ (dif (g(x) ln f(x)))/(dif x) = g(x) (dif ln f(x))/(dif f(x)) (dif f(x))/(dif x) + ln f(x) dot (dif g(x))/(dif x) $

$ = (g(x))/(f(x)) f'(x) + g'(x) ln f(x) $

最终我们得到：

$ (1)/(y) dot y' = (g(x))/(f(x)) f'(x) + g'(x) ln f(x) $

$y'$ 即为所求，因此将等式左侧的 $(1)/(y)$ 乘到右侧，并将 $y$ 替换为 $f(x)^(g(x))$，我们得到：

$ y' = (f(x)^(g(x)))' = f(x)^(g(x)) ((g(x))/(f(x)) f'(x) + g'(x) ln f(x)) $

这就是两个表达式乘方的导数。

由于这玩意实在太长，它的代码形式和表达式树形式我就不列出来了。大家只需要知道这玩意能算出来就行了。

== 叶结点的处理

当我们运算到叶结点（即常数和变量）时，就可以直接按照如下方法处理：

$ "返回值" = cases(1 & "结点值" = "求导变量", 0 & "结点值" != "求导变量") $

对 $x$ 求导时，只有$x'$会返回$1$。其余情况，包括常数的导数，和多元函数中其他变量（比如 $y, z$）对 $x$ 的导数，都会返回$0$。

= 优化

我们不妨随便找一个函数进行一下运算，比如：

$ f(x) = x^2 $

```text
  ^
 / \
x   2
```

代入之前得到的指数求导表达式：

$ (x^2)' = x^2 (2' dot ln x + (2)/(x) dot x') $

建立的表达式树如下：

```text
        ×
    /       \
  ^           +
 / \       /     \
x   2    ×         *
       /   \      / \
    (2)'   ln    ÷   x'
           |    / \
           x   2   x
```

接着根据叶结点的处理规则，将$2'$替换成$0$，将$x'$替换成$1$，得到了表达式树：

```text
        ×
    /       \
  ^           +
 / \       /     \
x   2    ×         *
       /   \      / \
      0    ln    ÷   1
           |    / \
           x   2   x
```

可以看到，表达式树中有许多诸如 `×0`，`×1`，`÷1` 之类的冗余表达。为了去除这些冗余，我们需要对表达式树进行优化。

== 初级优化

结点的所有子结点均为常数时，直接合并成单个常数结点，例如$2 + 3$直接合并为$5$。

- 加法：$a + 0 = 0 + a = a$
- 减法：$a - 0 = a$，$0 - a = -a$，$a - a = 0$
- 乘法：$a times 0 = 0$，$a times 1 = a$
- 除法：$a/0 = "NaN"$，$a/1 = a$，$0/a = 0$，$a/a = 1$
- 乘方：$a^0 = 1$，$a^1 = a$，$0^a = 0$，$1^a = 1$
- 其它：$ln 1 = 0$，$sin pi = 0$ 等

== 中级优化

涉及到某个结点和它的一级子结点。

- 加减法：$a + (-b) = a - b$
- 乘除法：$a times (1/b) = a/b$
- 乘方：$(a^n) dot a = a^(n+1)$，$(a^n)/a = a^(n-1)$
- 对数：$a^(log_b a) = b$……

== 高级优化

这些优化本身不一定能够让式子变得更加简洁，它要求机器能够判断展开后表达式是否能够进一步化简。

- 乘法分配律：$(a + b) c = a c + b c$
- 乘方运算律：$a^(b+c) = a^b dot a^c$
- 对数运算律：$log(a b) = log a + log b$
