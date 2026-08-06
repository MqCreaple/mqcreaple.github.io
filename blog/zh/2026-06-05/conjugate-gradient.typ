// title: 数值模拟之：共轭梯度法
// summary: 共轭梯度法，为什么 n 步之内一定能找到精确解？
// tags: computation, mathematics, simulation
// category: tech

#import "../../template.typ": article, mathbf

#show: article.with(
  title: "数值模拟之：共轭梯度法",
  lang: "zh",
)

前几个月写了一篇有关#link("/zh/posts/2026-01-08/truss/")[桁架结构受力计算的文章]，最后提到了共轭梯度算法，但是没有详细展开。在这里把之前的坑填上。

前情提要：对于大规模稀疏线性系统 $A mathbf(x) = mathbf(b)$，之前提到了基于不动点的高斯-赛德尔迭代和逐次超松弛迭代法，但是这两个算法都无法保证一定能在有限步内取得精确解。相比之下，*共轭梯度法（Conjugate Gradient Method，CG）*既保证了随着迭代次数增加、解会逐渐变得精确，同时也保证了对于 $n times n$ 的矩阵$A$，至多需要$n$步迭代就可以保证获得精确解。由于这两条性质足够好，现在大部分物理引擎在解稀疏线性系统时都使用的是基于共轭梯度法的改良算法。

共轭梯度法只能求解对称正定的矩阵$A$。如果你想要求解的问题中$A$不是对称正定的，可以参考#link("/zh/posts/2026-01-08/truss/")[之前这篇桁架结构的文章]中提到的方法，将问题变成求解对称正定矩阵的问题。

= 基本概念

首先明确一下记号：待解方程为 $A mathbf(x) = mathbf(b)$，其中$A$为对称正定矩阵，有 $A^T = A$。设 $mathbf(x)_*$ 为该方程的精确解，$mathbf(x)_k$ 为第$k$步迭代给出的结果。我们需要设计一个算法让 $mathbf(x)_k$ 在$k$增大时不断逼近 $mathbf(x)_*$。

与不动点法不同，共轭梯度法的基础思想是：从一个零维空间开始，逐步增大搜索空间的维度，在第$k$步迭代时会计算一个$k$维子空间里最接近我想要的解的那个向量。每一步迭代都会往当前的$k$维空间上加一个维度，并在这个新的维度上寻找能够最小化误差的向量。这也是为什么共轭梯度法能够保证在$n$步内一定能找到精确解，因为$n$步过后搜索空间就变成了$n$维，覆盖了整个向量空间。

具体来说，我们要构建一系列向量空间 $V_1 subset V_2 subset dots.c subset V_n = RR^n$，使得：$mathbf(x)_k in V_k$ 且 $mathbf(x)_k$ 是 $V_k$ 中使得某个损失函数 $l(mathbf(x))$ 最小化的那个向量（即 $mathbf(x)_k = op("argmin")_(mathbf(x)) l(mathbf(x))$）。同时，$l(mathbf(x))$ 需要满足：当$k$等于总维数$n$时，其最小值等于我们要求的方程的解（即 $mathbf(x)_* = A^(-1) mathbf(b)$）。

你可能还记得上一篇文章中用到的损失函数

$ l(mathbf(x)) = 1/2 mathbf(x)^T A mathbf(x) - mathbf(x)^T mathbf(b) $

这个函数就符合我们说的条件：在 $RR^n$ 上仅有一个极值点，且极值点 $mathbf(x)_*$ 满足 $A mathbf(x)_* = mathbf(b)$。这个函数也可以等价地写成：

$ l_1(mathbf(x)) = 1/2 (mathbf(x)_* - mathbf(x))^T A (mathbf(x)_* - mathbf(x)) $

这个函数与$l$只相差了一个常数，对其取一阶、二阶微分的结果与$l$完全一致。读者自证不难。

当然，我们不仅想让算法在$n$步内找到最优解，同时我们也希望算法能够在远小于$n$的步数内找到一个足够精确的解。为了实现这个目标，我们不妨吸取一些梯度下降的经验，在第$k$步扩展搜索空间时去向 $mathbf(x)_k$ 的梯度方向扩展。这样在逐步扩大搜索范围的时候会优先查找梯度下降更快的方向，在前面几步找到的近似解也就会更精确。

= 朴素共轭梯度法（Conjugate Gradient）

不妨令第$k$步向搜索空间中添加的向量为 $mathbf(p)_k$，且 $brace.l mathbf(p)_k brace.r_(k=0)^(n-1)$ 在以$A$为权重的内积下正交（之后的推导中会看到为什么要这样做）。即：

$ V_k = "span" brace.l mathbf(p)_0, mathbf(p)_1, dots.c, mathbf(p)_(k-1) brace.r $

$ chevron.l mathbf(p)_i, mathbf(p)_j chevron.r_A = mathbf(p)_i^T A mathbf(p)_j = 0 quad ("for" i != j) $

$ mathbf(x)_k = sum_(i=0)^(k-1) alpha_i mathbf(p)_i = mathbf(x)_(k-1) + alpha_(k-1) mathbf(p)_(k-1) $

其中 $alpha_k$ 的权重暂时未知。我们接下来的目的就是找到一个合理的顺序来逐个添加 $mathbf(p)_k$，并且对于每个添加进来的 $mathbf(p)_k$ 计算它对应的系数 $alpha_k$。

（以上记号全部与文章撰写日期#link("https://en.wikipedia.org/wiki/Conjugate_gradient_method")[维基百科词条]中的记号保持统一）

#quote(block: true)[
补充：对于向量空间 $RR^n$ 和 $n times n$ 的对称正定矩阵$A$，函数 $chevron.l mathbf(u), mathbf(v) chevron.r_A = mathbf(u)^T A mathbf(v)$ 是一个内积。

证明：

+ 对称性

  $ chevron.l mathbf(u), mathbf(v) chevron.r_A = mathbf(u)^T A mathbf(v) = (mathbf(u)^T A mathbf(v))^T = mathbf(v)^T A^T mathbf(u) = mathbf(v)^T A mathbf(u) = chevron.l mathbf(v), mathbf(u) chevron.r_A $

+ 双线性

  $ chevron.l c_1 mathbf(u)_1 + c_2 mathbf(u)_2, mathbf(v) chevron.r_A = (c_1 mathbf(u)_1 + c_2 mathbf(u)_2)^T A mathbf(v) = c_1 mathbf(u)_1^T A mathbf(v) + c_2 mathbf(u)_2^T A mathbf(v) = c_1 chevron.l mathbf(u)_1, mathbf(v) chevron.r_A + c_2 chevron.l mathbf(u)_2, mathbf(v) chevron.r_A $

+ 正定性：由于矩阵$A$正定，

  $ chevron.l mathbf(u), mathbf(u) chevron.r_A = mathbf(u)^T A mathbf(u) >= 0 $

  且该函数当且仅当 $mathbf(u) = mathbf(0)$ 时为$0$。

此外，我们定义：若向量$mathbf(u)$和 $mathbf(v)$ 满足 $mathbf(u)^T A mathbf(v) = 0$，则称两个向量关于矩阵$A$*共轭*\/*正交*。
]

根据刚刚的分析，我们希望每次添加的向量 $mathbf(p)_k$ 朝向 $l(mathbf(x))$ 的梯度方向的反方向，又知 $l(mathbf(x))$ 梯度为：

$ nabla l(mathbf(x)_k) = A mathbf(x)_k - mathbf(b) $

我们不妨定义负的这个量为第$k$步的*残差（residual）* $mathbf(r)_k$。$mathbf(r)_k$ 也可以理解成 $A mathbf(x)$ 到 $mathbf(b)$ 的差距有多大。

$ mathbf(r)_k = mathbf(b) - A mathbf(x)_k $

那么能不能直接把 $mathbf(r)_k$ 添加到搜索空间里，令 $mathbf(p)_k = mathbf(r)_k$ 呢？显然不行，因为这样违反了上面给出的约束条件，$mathbf(p)_i$ 和 $mathbf(p)_j$ 不一定关于$A$正交了。为了保持正交性，需要在 $mathbf(r)_k$ 中减去前面已经添加过的 $mathbf(p)_k$ 的分量。

$ mathbf(p)_k = mathbf(r)_k - sum_(i < k) (chevron.l mathbf(r)_k, mathbf(p)_i chevron.r_A)/(chevron.l mathbf(p)_i, mathbf(p)_i chevron.r_A) mathbf(p)_i = mathbf(r)_k - sum_(i < k) (mathbf(r)_k^T A mathbf(p)_i)/(mathbf(p)_i^T A mathbf(p)_i) mathbf(p)_i $

换句话说，每次向搜索空间中添加的向量 $mathbf(p)_k$ 是 $l(mathbf(x))$ 梯度与之前所有向量关于$A$的共轭向量，这也是共轭梯度法名称的来源。

接下来就可以计算系数 $alpha_k$ 了。由于我们希望 $mathbf(x)_k$ 在 $k=n$ 时收敛到解 $mathbf(x)_*$，有：

$ mathbf(x)_* = mathbf(x)_n = sum_(i=0)^(n-1) alpha_k mathbf(p)_i $

计算 $A mathbf(x)_*$，并令其等于 $mathbf(b)$：

$ A mathbf(x)_* = sum_(i=0)^(n-1) alpha_k A mathbf(p)_i = mathbf(b) $

两侧同时对 $mathbf(p)_k$ 做内积，得到：

$ mathbf(p)_k^T mathbf(b) = mathbf(p)_k^T A mathbf(x)_* = sum_(i=0)^(n-1) alpha_k mathbf(p)_k^T A mathbf(p)_i = alpha_k mathbf(p)_k^T A mathbf(p)_k $

最后一个等式利用了 $brace.l mathbf(p)_k brace.r$ 关于$A$的正交性。这也是为什么一开始会需要规定 $brace.l mathbf(p)_k brace.r$ 关于$A$正交。由上式不难得到：

$ alpha_k = (mathbf(p)_k^T mathbf(b))/(mathbf(p)_k^T A mathbf(p)_k) $

根据以上公式，我们可以写出一个简单的算法：

#quote(block: true)[
+ $ mathbf(x)_0 := mathbf(0) $
+ 循环遍历 $k=0$ 到$n$：
  + $ mathbf(r)_k := mathbf(b) - A mathbf(x)_k $
  + $ mathbf(p)_k := mathbf(r)_k - sum_(i < k) (mathbf(r)_k^T A mathbf(p)_i)/(mathbf(p)_i^T A mathbf(p)_i) mathbf(p)_i $
  + $ alpha_k := (mathbf(p)_k^T mathbf(b))/(mathbf(p)_k^T A mathbf(p)_k) $
  + $ mathbf(x)_(k+1) := mathbf(x)_k + alpha_k mathbf(p)_k $
+ 当 $k=n$，或 $mathbf(r)_k$ 足够小时，返回 $mathbf(x)_k$。
]

这个算法看起来能运行了，但是还有一个重大的问题：循环中的第2步使用了一个求和符号，遍历了所有 $i < k$。这是一个 $O(N)$ 的操作。再加上循环里面的矩阵乘法等运算，即使假设$A$是一个元素个数为 $O(N)$ 级别的稀疏矩阵，整个算法的时间复杂度仍然是 $O(N^3)$ 级别的。这个效率甚至不如直接做高斯消元。肯定是哪里还藏着一些可以优化的细节。

== 一些数学优化

接下来就是数学的魔法时刻了。

首先，不难证明 $mathbf(r)_(k+1) = mathbf(r)_k - alpha_k A mathbf(p)_k$：

$ mathbf(r)_(k+1) = mathbf(b) - A mathbf(x)_(k+1) = mathbf(b) - A (mathbf(x)_k - alpha_k mathbf(p)_k) = mathbf(r)_k - alpha_k A mathbf(p)_k $

同时也不难证明 $mathbf(p)_k^T mathbf(b) = mathbf(p)_k^T mathbf(r)_k$：

$ mathbf(p)_k^T mathbf(r)_k = mathbf(p)_k^T (mathbf(b) - A sum_(i=0)^(k-1) alpha_i mathbf(p)_i) = mathbf(p)_k^T mathbf(b) - sum_(i=0)^(k-1) alpha_i mathbf(p)_k^T A mathbf(p)_i = mathbf(p)_k^T mathbf(b) $

因此，也可以将 $alpha_k$ 写成：

$ alpha_k = (mathbf(p)_k^T mathbf(b))/(mathbf(p)_k^T A mathbf(p)_k) = (mathbf(p)_k^T mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k) $

接下来，注意到对于任意的 $i > j$，都有 $chevron.l mathbf(r)_i, mathbf(p)_j chevron.r = mathbf(r)_i^T mathbf(p)_j = 0$。证明如下：

#quote(block: true)[
定理1：$forall 0 <= j < i < n, thin chevron.l mathbf(r)_i, mathbf(p)_j chevron.r = mathbf(r)_i^T mathbf(p)_j = 0$

证明：

+ 该定理对于 $k+1$ 和$k$成立

  $ mathbf(r)_(k+1)^T mathbf(p)_k &= (mathbf(r)_k - alpha_k A mathbf(p)_k)^T mathbf(p)_k \
    &= mathbf(r)_k^T mathbf(p)_k - (mathbf(p)_k^T mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k) dot mathbf(p)_k^T A mathbf(p)_k \
    &= mathbf(r)_k^T mathbf(p)_k - mathbf(p)_k^T mathbf(r)_k \
    &= 0 $

+ 假设该定理对于 $k+l$ 和$k$成立（$l >= 1$），则该定理对 $k+l+1$ 和$k$成立

  $ mathbf(r)_(k+l+1)^T mathbf(p)_k &= (mathbf(r)_(k+l) - alpha_(k+l) A mathbf(p)_(k+l))^T mathbf(p)_k \
    &= mathbf(r)_(k+l)^T mathbf(p)_k - alpha_(k+l) mathbf(p)_(k+l)^T A mathbf(p)_k \
    &= 0 - 0 \
    &= 0 $

由数学归纳法，该定理对于任意整数 $i > j$ 成立。
] <thm:1>

更进一步地，也可以证明对于任意 $i > j$，$mathbf(r)_i^T mathbf(r)_j = 0$。

#quote(block: true)[
引理：

$ mathbf(p)_k^T A mathbf(p)_k = mathbf(p)_k^T A mathbf(r)_k $

证明：令 $gamma_(k i) = (mathbf(r)_k^T A mathbf(p)_i)/(mathbf(p)_i^T A mathbf(p)_i)$，则有

$ mathbf(p)_k^T A mathbf(p)_k &= mathbf(p)_k^T A (mathbf(r)_k - sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i) \
  &= mathbf(p)_k^T A mathbf(r)_k - sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_k^T A mathbf(p)_i \
  &= mathbf(p)_k^T A mathbf(r)_k $
]

#quote(block: true)[
定理2：$forall 0 <= j < i < n, thin chevron.l mathbf(r)_i, mathbf(p)_j chevron.r = mathbf(r)_i^T mathbf(r)_j = 0$

证明：

+ 该定理对于 $k+1$ 和$k$成立

  $ mathbf(r)_(k+1)^T mathbf(r)_k &= (mathbf(r)_k - alpha_k A mathbf(p)_k)^T mathbf(r)_k \
    &= mathbf(r)_k^T mathbf(r)_k - alpha_k mathbf(p)_k^T A mathbf(r)_k \
    &= mathbf(r)_k^T mathbf(r)_k - (mathbf(p)_k^T mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k) dot mathbf(p)_k^T A mathbf(r)_k \
    &= mathbf(r)_k^T mathbf(r)_k - mathbf(p)_k^T mathbf(r)_k \
    &= mathbf(r)_k^T mathbf(r)_k - (mathbf(r)_k - sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i)^T mathbf(r)_k \
    &= (mathbf(r)_k^T mathbf(r)_k - mathbf(r)_k^T mathbf(r)_k) + sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i^T mathbf(r)_k $

  由#link(<thm:1>)[定理1]进一步化简得：

  $ mathbf(r)_(k+1)^T mathbf(r)_k = 0 $

+ 假设该定理对于 $k+l$ 和$k$成立（$l >= 1$），则该定理对 $k+l+1$ 和$k$成立

  $ mathbf(r)_(k+l+1)^T mathbf(r)_k &= (mathbf(r)_(k+1) - alpha_(k+l) A mathbf(p)_(k+l))^T mathbf(r)_k \
    &= mathbf(r)_(k+l)^T mathbf(r)_k - alpha_(k+l) mathbf(p)_(k+l)^T A mathbf(r)_k $

  由 $mathbf(r)_k$ 定义可知：

  $ mathbf(r)_k = mathbf(p)_k + sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i $

  即：$mathbf(r)_k$ 一定可以写成 $brace.l mathbf(p)_0, mathbf(p)_1, dots.c, mathbf(p)_k brace.r$ 的线性组合。因此有：

  $ mathbf(r)_(k+l+1)^T mathbf(r)_k &= mathbf(r)_(k+l)^T mathbf(r)_k - alpha_(k+l) mathbf(p)_(k+l)^T A mathbf(r)_k \
    &= 0 - alpha_(k+l) mathbf(p)_(k+l)^T A (mathbf(p)_k + sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i) \
    &= 0 + alpha_(k+l) dot 0 \
    &= 0 $

由数学归纳法，证毕。
]

这个性质非常奇特。我们看似随机地取了一系列向量 $mathbf(p)_k$，由此计算出的残差向量 $mathbf(r)_k$ 居然是互相正交的。也就是说，这堆向量里，$brace.l mathbf(p)_k brace.r$ 关于内积 $chevron.l dot, dot chevron.r_A$ 正交，而 $brace.l mathbf(r)_k brace.r$ 关于一般意义上的向量内积 $chevron.l dot, dot chevron.r$ 正交。那么我们是否可以进一步利用 $mathbf(r)_k$ 的正交性来化简表达式呢？

不难证明以下几条结论：

#quote(block: true)[
定理3：

$ mathbf(r)_k^T mathbf(p)_k = mathbf(r)_k^T mathbf(r)_k $

证明：代入 $mathbf(p)_k = mathbf(r)_k - sum_(i=0)^(k-1) gamma_(k i) mathbf(p)_i$，化简即可
] <thm:3>

#quote(block: true)[
定理4：

$ mathbf(r)_k^T A mathbf(p)_i = cases((1)/(alpha_k) mathbf(r)_k^T mathbf(r)_k = mathbf(p)_k^T A mathbf(p)_k & i = k, -(1)/(alpha_(k-1)) mathbf(r)_k^T mathbf(r)_k & i = k - 1, 0 & "otherwise") $

证明：由于

$ mathbf(r)_(k+1) = mathbf(r)_k - alpha_k A mathbf(p)_k $

移项得

$ A mathbf(p)_k = (mathbf(r)_k - mathbf(r)_(k+1))/(alpha_k) $

代入原式：

$ mathbf(r)_k^T A mathbf(p)_i = (1)/(alpha_i) mathbf(r)_k^T (mathbf(r)_i - mathbf(r)_(i+1)) $

当 $i=k$ 时，$mathbf(r)_k^T mathbf(r)_(i+1)$ 项为0。又根据#link(<thm:3>)[定理3]，有 $alpha_k = (mathbf(r)_k^T mathbf(p)_k)/(mathbf(p)_k^T A mathbf(p)_k) = (mathbf(r)_k^T mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k)$。右侧表达式变为：

$ mathbf(r)_k^T A mathbf(p)_k = (1)/(alpha_k) mathbf(r)_k^T mathbf(r)_k = mathbf(p)_k^T A mathbf(p)_k $

当 $i = k - 1$ 时，右侧 $mathbf(r)_k^T mathbf(r)_i$ 项为0，因此有：

$ mathbf(r)_k^T A mathbf(p)_(k-1) = -(1)/(alpha_(k-1)) mathbf(r)_k^T mathbf(r)_k = -(mathbf(r)_k^T mathbf(r)_k)/(mathbf(r)_(k-1)^T mathbf(r)_(k-1)) mathbf(p)_(k-1)^T A mathbf(p)_(k-1) $

其余情况下，右侧的两个内积均为0，因此表达式为0。
] <thm:4>

回忆一下，之前表达式中耗时最多的式子是这个：

$ mathbf(p)_k := mathbf(r)_k - sum_(i=0)^(k-1) (mathbf(r)_k^T A mathbf(p)_i)/(mathbf(p)_i^T A mathbf(p)_i) mathbf(p)_i $

根据#link(<thm:4>)[定理4]，$i$从$0$到$k-1$中，$mathbf(r)_k A mathbf(p)_i$ 仅有一项非零，其余项全都是0。也就是说，我们根本不需要算这个求和符号，而是可以直接展开这个式子：

$ mathbf(p)_k := mathbf(r)_k + (mathbf(r)_k^T mathbf(r)_k)/(mathbf(r)_(k-1)^T mathbf(r)_(k-1)) mathbf(p)_(k-1) $

定义系数 $beta_k$ 为：

$ beta_k = (mathbf(r)_(k+1)^T mathbf(r)_(k+1))/(mathbf(r)_k^T mathbf(r)_k) $

则有：

$ mathbf(p)_k := mathbf(r)_k + beta_(k-1) mathbf(p)_(k-1) $

完整算法流程如下：

#quote(block: true)[
+ $ mathbf(x)_0 := mathbf(0) $
+ $ mathbf(r)_0 := mathbf(b) $
+ $ mathbf(p)_0 := mathbf(r)_0 $
+ 循环遍历 $k=0$ 到$n$：
  + $ alpha_k := (mathbf(r)_k^T mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k) $
  + $ mathbf(x)_(k+1) := mathbf(x)_k + alpha_k mathbf(p)_k $
  + $ mathbf(r)_(k+1) := mathbf(r)_k - alpha_k A mathbf(p)_k $
  + $ beta_k := (mathbf(r)_(k+1)^T mathbf(r)_(k+1))/(mathbf(r)_k^T mathbf(r)_k) $
  + $ mathbf(p)_(k+1) := mathbf(r)_(k+1) + beta_k mathbf(p)_k $
+ 当 $k=n$ 或 $mathbf(r)_k$ 足够小时，返回 $mathbf(x)_k$。
]

这就是朴素共轭梯度法的算法实现了。

== 非零起始点

同时注意到，这个算法完全允许将 $mathbf(x)_0$ 设置成任意向量，而不一定需要是 $mathbf(0)$。只要构造一个新的线性系统：

$ tilde(mathbf(x)) := mathbf(x) - mathbf(x)_0 $

$ tilde(mathbf(b)) := mathbf(b) - A mathbf(x)_0 $

$ A tilde(mathbf(x)) = A mathbf(x) - A mathbf(x)_0 = mathbf(b) - A mathbf(x)_0 = tilde(mathbf(b)) $

就可以将其变成一个以 $tilde(mathbf(x)) = mathbf(0)$ 为起点的问题了。除了第二步的 $mathbf(r)_0 := mathbf(b)$ 需要改为 $mathbf(r)_0 := mathbf(b) - A mathbf(x)_0$ 以外，其他位置都不需要做任何改动。

== 代码实现

直接照着上面的伪代码抄就完了。

```rust
/// Solve the linear system $Ax = b$ with conjugate gradient method.
/// 
/// The matrix `a` is required to be a symmetric, positive definite matrix.
pub fn solve(a: &CsrMatrix<f64>, b: &na::DVector<f64>, epsilon: f64) -> na::DVector<f64> {
    debug_assert_eq!(a.nrows(), a.ncols());
    debug_assert_eq!(a.nrows(), b.len());
    let n = b.len();
    let mut x = na::DVector::zeros(n);
    let mut r = b.clone() - a * &x;
    let mut p = r.clone();
    let mut new_r;
    for k in 0..n {
        let ap = a * &p;
        let alpha = (&r).dot(&r) / (&p).dot(&ap);
        x += alpha * (&p);
        new_r = &r - alpha * ap;
        if new_r.norm() < epsilon {
            break;
        }
        let beta = (&new_r).dot(&new_r) / (&r).dot(&r);
        p = (&new_r) + beta * (&p);
        r = new_r;
    }
    x
}
```

不过直接抄还是会有些问题。每个循环里都会给 `new_r` 和 `ap` 这两个向量重新分配内存。如果想要避免频繁分配内存的话可以使用 nalgebra 的 BLAS 操作：

```rust
pub fn solve(a: &CsrMatrix<f64>, b: &na::DVector<f64>, epsilon: f64) -> na::DVector<f64> {
    debug_assert_eq!(a.nrows(), a.ncols());
    debug_assert_eq!(a.nrows(), b.len());
    let n = b.len();
    let mut x = na::DVector::zeros(n);
    let mut r = b.clone() - a * &x;
    let mut p = r.clone();
    let mut new_r = na::DVector::zeros(n);
    let mut ap = na::DVector::zeros(n);
    for k in 0..n {
        spmm_csr_dense(0.0, &mut ap, 1.0, Op::NoOp(&a), Op::NoOp(&p));
        let alpha = (&r).dot(&r) / (&p).dot(&ap);
        x += alpha * (&p);
        new_r.copy_from(&r);
        new_r.axpy(-alpha, &ap, 1.0);
        if new_r.norm() < epsilon {
            break;
        }
        let beta = (&new_r).dot(&new_r) / (&r).dot(&r);
        p.axpy(1.0, &new_r, beta);
        r.copy_from(&new_r);
    }
    x
}
```

在之前写的那个桁架受力分析的系统上实测，朴素共轭梯度法能够在不卡的情况下计算大约6000-7000维度的线性系统。与之前使用的逐次超松弛迭代法相比大约是3倍的性能提升。

进一步探究表明，虽然对于7000维的线性问题，至少需要7000步才能获得精确解，但实际上算法每一步几乎都是沿着梯度方向下降的，只需要大约600步就可以让误差收敛到 $10^(-5)$ 以内，对于这个问题来说精度就足够高了。

= 预条件共轭梯度法（Preconditioned Conjugate Gradient，PCG）

如果$A$的性质不够好，收敛速度不够快，我们完全可以将$x$换到另一个坐标系上。比如，定义：

$ hat(mathbf(x)) = E^T mathbf(x) $

将原方程用 $hat(mathbf(x))$ 表示，得到：

$ A E^(-T) hat(mathbf(x)) = mathbf(b) $

为了保持矩阵的对称正定性，在左右两边同时乘上 $E^(-1)$：

$ E^(-1) A E^(-T) hat(mathbf(x)) = E^(-1) mathbf(b) $

定义

$ hat(A) = E^(-1) A E^(-T) $

$ hat(mathbf(b)) = E^(-1) mathbf(b) $

则方程

$ hat(A) hat(mathbf(x)) = hat(mathbf(b)) $

可以用朴素共轭梯度法求解。各个变量之间的关系如下：

$ hat(mathbf(x))_(k+1) = hat(mathbf(x))_k + alpha_k hat(mathbf(p))_k $

$ hat(mathbf(r))_(k+1) = hat(mathbf(r))_k - alpha_k hat(A) hat(mathbf(p))_k $

$ hat(mathbf(p))_(k+1) = hat(mathbf(r))_k + beta_k hat(mathbf(p))_k $

$ alpha_k = (hat(mathbf(r))_k^T hat(mathbf(r))_k)/(hat(mathbf(p))_k^T hat(A) hat(mathbf(p))_k) $

$ beta_k = (hat(mathbf(r))_(k+1)^T hat(mathbf(r))_(k+1))/(hat(mathbf(r))_k^T hat(mathbf(r))_k) $

如果将 $hat(mathbf(x))_k$、$hat(mathbf(r))_k$ 和 $hat(mathbf(p))_k$ 全部换回变换前的坐标系，则有：

$ mathbf(x)_(k+1) = E^(-T) hat(mathbf(x))_(k+1) = E^(-T) (hat(mathbf(x))_k + alpha_k hat(mathbf(p))_k) = mathbf(x)_k + alpha_k mathbf(p)_k $

$ mathbf(r)_(k+1) = E hat(mathbf(r))_(k+1) = E (hat(mathbf(r))_k - alpha_k E^(-1) A E^(-T) hat(mathbf(p))_k) = mathbf(r)_k - alpha_k A mathbf(p)_k $

$ mathbf(p)_(k+1) = E^(-T) hat(mathbf(p))_(k+1) = E^(-T) (hat(mathbf(r))_k + beta_k hat(mathbf(p))_k) = (E E^T)^(-1) mathbf(r)_k + beta_k mathbf(p)_k $

（由于残差项 $hat(mathbf(r))_k = hat(mathbf(b)) - hat(A) hat(mathbf(x))_k = E^(-1) mathbf(b) - E^(-1) A mathbf(x)$，在将 $hat(mathbf(r))$ 变回 $mathbf(r)$ 时需要乘矩阵$E$而非矩阵 $E^(-T)$）

接下来计算 $alpha_k$ 和 $beta_k$：

$ alpha_k = ((mathbf(r)_k^T E^(-T)) (E^(-1) mathbf(r)_k))/((mathbf(p)_k^T E) (E^(-1) A E^(-T)) (E^T mathbf(p)_k)) = (mathbf(r)_k^T (E E^T)^(-1) mathbf(r)_k)/(mathbf(p)_k^T A mathbf(p)_k) $

$ beta_k = ((mathbf(r)_(k+1)^T E^(-T)) (E^(-1) mathbf(r)_(k+1)))/((mathbf(r)_k^T E^(-T)) (E^(-1) mathbf(r)_k)) = (mathbf(r)_(k+1)^T (E E^T)^(-1) mathbf(r)_(k+1))/(mathbf(r)_k^T (E E^T)^(-1) mathbf(r)_k) $

由于矩阵 $E E^T$ 频繁出现，我们不妨定义 $M = E E^T$，$mathbf(z)_k = M^(-1) mathbf(r)_k$。则算法流程变为：

#quote(block: true)[
+ $ mathbf(x)_0 := mathbf(0) $
+ $ mathbf(r)_0 := mathbf(b) $
+ $ mathbf(z)_0 := M^(-1) mathbf(r)_0 $
+ $ mathbf(p)_0 := mathbf(z)_0 $
+ 循环遍历 $k=0$ 到$n$：
  + $ alpha_k := (mathbf(r)_k^T mathbf(z)_k)/(mathbf(p)_k^T A mathbf(p)_k) $
  + $ mathbf(x)_(k+1) := mathbf(x)_k + alpha_k mathbf(p)_k $
  + $ mathbf(r)_(k+1) := mathbf(r)_k - alpha_k A mathbf(p)_k $
  + $ mathbf(z)_(k+1) := M^(-1) mathbf(r)_(k+1) $
  + $ beta_k := (mathbf(r)_(k+1)^T mathbf(z)_(k+1))/(mathbf(r)_k^T mathbf(z)_k) $
  + $ mathbf(p)_(k+1) := mathbf(z)_(k+1) + beta_k mathbf(p)_k $
+ 当 $k=n$ 或 $mathbf(r)_k$ 足够小时，返回 $mathbf(x)_k$。
]

如果矩阵$E$的性质足够好，让 $E^(-1) A E^(-T)$ 尽可能接近单位矩阵，那么迭代过程将会快很多。直观上可以这样理解：$hat(A) = E^(-1) A E^(-T)$ 越接近单位矩阵，那么二次型 $l(hat(mathbf(x))) = 1/2 hat(mathbf(x))^T hat(A) hat(mathbf(x)) - hat(mathbf(x))^T hat(mathbf(b))$ 的等势面就会越接近一个个同心圆，而我们又知道同心圆的梯度永远指向圆心（也就是这个二次型的极值点），所以这样就可以用更少的迭代步数收敛到圆心位置。如图所示。

#image("cg-preconditioning.svg", width: 70%)

至于具体怎么找一个满足条件的$E$矩阵，之后有机会再写了（