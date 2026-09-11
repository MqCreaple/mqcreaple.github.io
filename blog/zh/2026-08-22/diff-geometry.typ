// title: 微分几何3：流形上的度规
// summary: 内积、张量场、度规与曲线的长度。
// tags: mathematics, differential-geometry
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, theorem, definition, proof, example, corollary
#import "@preview/cetz:0.3.4"

#show: article.with(
  title: "微分几何3：流形上的度规",
  lang: "zh",
)

在#link("/zh/posts/2026-08-19/diff-geometry/", "上一篇文章")中，我们认识了与向量对偶的数学结构——协向量，以及看到了如何将向量和协向量在坐标卡上展开成分量形式。不过，我们还有一个很关键的量没有定义——*流形上的长度*。回忆一下，在欧氏空间中的曲线我们是怎么计算长度的？没错，我们给曲线分成无穷多段，然后对每一小段计算它的*切向量模长*：

$ |L| = integral_(t_1)^(t_2) ||dot(L)(t)|| dif t $

同样的定义当然也适用于微分几何，毕竟流形上任何一点的局部都可以看作是一个欧氏空间。但是这里有一个关键的概念我们还没有定义——流形上的切向量怎么计算模长？为了回答这个问题，我们需要给流形的每个切空间上都引入一个*内积函数*：

$ chevron.l dot, dot chevron.r_p : T_p M times T_p M -> RR $

开始本文之前，先复习一下各个函数空间和场的记号：

+ $S -> T$ 表示集合 $S$ 与 $T$ 之间的一般映射，不加任何限制。
+ $cal(L)(S, T)$ 表示线性空间 $S$ 到 $T$ 之间的线性映射。
+ $C^infinity (S, T)$ 表示流形 $S$ 到 $T$ 之间的光滑映射。
+ $frak(X)(M)$ 表示流形 $M$ 上的向量场。
+ $Omega^1 (M)$ 表示流形 $M$ 上的协向量场。

= 流形上的内积与度规

回忆一下内积的性质：

1. 双线性
  $ chevron.l c_1 mathbf(a) + c_2 mathbf(b), c_3 mathbf(c) + c_4 mathbf(d) chevron.r = c_1 c_3 chevron.l mathbf(a), mathbf(c) chevron.r + c_1 c_4 chevron.l mathbf(a), mathbf(d) chevron.r + c_2 c_3 chevron.l mathbf(b), mathbf(c) chevron.r + c_2 c_4 chevron.l mathbf(b), mathbf(d) chevron.r $
2. 对称性
  $ chevron.l mathbf(a), mathbf(b) chevron.r = chevron.l mathbf(b), mathbf(a) chevron.r $
3. 正定性
  $ chevron.l mathbf(a), mathbf(a) chevron.r >= 0 $
  $ chevron.l mathbf(a), mathbf(a) chevron.r = 0 arrow.double.l.r mathbf(a) = 0 $

当然，由于我们在讨论微分流形上的内积，我们还需要额外加一条限制：内积函数必须是光滑的。

#definition[
  流形 $M$ 上的*内积* $g$ 是一个纤维丛 $M -> T^* M times T^* M $ 的光滑截面，满足对于任意一点 $p in M$，
  
  $ g_p : T_p M times T_p M -> RR, (X, Y) mapsto chevron.l X, Y chevron.r_p $
  
  满足双线性、对称性、正定性，且对于任意 $M$ 上的光滑向量场 $X$ 和 $Y$，

  $ g(X, Y) : M -> RR, p mapsto chevron.l X_p, Y_p chevron.r_p $

  是一个光滑函数。
] <def:inner-product>

如果将向量场 $X$ 和 $Y$ 用坐标卡 $(U_alpha, phi_alpha)$ 展开，那么内积函数在每个点 $p$ 上都会对应一个对称正定的二阶张量，这里记作 $g$。又因为向量分量 $X^i$ 和 $Y^i$ 都是逆变的，为了加出一个不变量，$g$ 的两个指标必须都是协变的，因此度规张量属于*(0, 2)型张量*。我们将这个张量称作*度规张量*。定义了度规的流形则被称为*黎曼流形*。

$ chevron.l X, Y chevron.r = g_(i j) X^i Y^j $

同样可以用上一篇文章提到过的缩放2倍法来判断张量的逆变/协变性。假设 $(U_beta, phi_beta)$ 和 $(U_alpha, phi_alpha)$ 相比每个坐标分量都放大到了原来的2倍，那么 $tilde(X)^i$ 和 $tilde(Y)^i$ 的数值都会是原来 $X^i$ 和 $Y^i$ 的两倍，而此时为了让内积 $chevron.l X, Y chevron.r$ 的数值保持不变，我们必须将 $g_(i j)$ 的数值缩减到原来的四分之一。从这里就能看出 $g_(i j)$ 的两个指标必须都是协变的。

由于度规张量的两个分量都是协变的，如果用矩阵记号表示的话，那理论上来说两个维度都需要是行向量。但显然，矩阵必须有恰好一行和一列，因此我们只能妥协一下，将 $g_(i j)$ 的一个指标沿着行排布、另一个指标沿着列排布，相应的 $X^i$ 和 $Y^j$ 中就要选一个来转置一下。最终写成这样：

$ chevron.l X, Y chevron.r = mat(X^1, X^2, dots.c, X^m) mat(g_(1 1), g_(1 2), dots.c, g_(1 m); g_(2 1), g_(2 2), dots.c, g_(2 m); dots.v, dots.v, dots.down, dots.v; g_(m 1), g_(m 2), dots.c, g_(m m)) vec(Y^1, Y^2, dots.v, Y^m) $

这与线性代数中的二次型 $x^top A y$ 如出一辙。实际上，二次型中的对称矩阵 $A$ 就可以看作是一个二阶协变张量，作用在两个逆变向量上。

== 音乐同构与逆度规

如果我们给一个向量空间定义了内积，那么就可以在该空间和其对偶空间之间建立一个很简洁的同构关系，这个同构关系同样不依赖于任何具体坐标系的选取。不要忘了对偶空间 $T^*_p M$ 就是所有向量到实数的线性映射 $cal(L) (T_p M, RR)$。

$ (dot)^flat : T_p M -> T^*_p M, X mapsto chevron.l X, dot, chevron.r_p $

由于内积本身是双线性的，那么给内积里填上一个数之后就可以获得一个关于另一个参数线性的函数 $chevron.l X, dot chevron.r$。由于这个变换将逆变向量变成了协变向量，指标从上标变成了下标，因此数学家借用了音乐中的*降号*来表示这个变换：

$ X^flat = chevron.l X, dot, chevron.r_p in T^*_p M $

而反过来呢？任何一个协向量 $X^*$ 都能找到对应的逆向量 $X$ 使得与该逆向量做内积等价于与协向量作用吗？换句话说，$(dot)^flat$ 是双射吗？

#theorem[
  降号映射 $(dot)^flat$ 是双射。
]

#proof[
  由于 $dim T_p M = dim T^*_p M$，且不难证明 $(dot)^flat$ 是线性映射，因此我们只需要证明 $(dot)^flat$ 是单射即可。

  假设 $X, Y in T_p M$ 且 $X != Y$。如果 $chevron.l X, dot chevron.r_p = chevron.l Y, dot chevron.r_p$，那么一定有 $chevron.l X - Y, dot chevron.r_p = 0$。取该函数作用在 $(X - Y)$ 上的结果：

  $ chevron.l X - Y, X - Y chevron.r_p = 0 $

  由内积的对称正定性，一定可以推出 $X = Y$，与假设矛盾。因此，函数 $chevron.l X, dot chevron.r_p != chevron.l Y, dot chevron.r_p$，二者是两个不同的协向量。
  
  上述推理保证了映射 $(dot)^flat$ 将两个不同的 $X, Y in T_p M$ 映射到了两个不同的协向量 $chevron.l X, dot chevron.r_p != chevron.l Y, dot chevron.r_p$ 上。因此 $(dot)^flat$ 是单射。
]

既然降号映射是双射，那就意味着这个映射有逆映射。你应该猜到了，这个映射的名称就是*升号映射* $(dot)^sharp : T^*_p M -> T_p M$。通过升降号映射在 $T_p M$ 和 $T^*_p M$ 之间建立的自然同构就称为*音乐同构*#strike[虽然实际上它和音乐没有半毛钱关系]。

降号映射也可以用分量形式写出来。不难看出，如果用 $X^i$ 表示向量 $X in T_p M$ 的分量，用 $X_i$ 表示其对应的协向量 $X^flat in T^*_p M$ 的分量，那么二者之间的变换函数就是度规张量 $g$：

#theorem[
  对于向量 $X in T_p M$ 以及其对偶向量 $X^flat in T^*_p M$，若二者在坐标卡 $(U_alpha, phi_alpha)$ 中的坐标展开分别为 $X = X^i partial_i$ 和 $X^flat = X_i dif x^i$，则有：

  $ X_i = g_(i j) X^j $
]

要证明它也很简单。

#proof[
  根据协向量和度规张量的定义，任取一个 $Y in T_p M$，$X^flat (Y) = chevron.l X, Y chevron.r_p$，有：

  $ X_i Y^i = X^flat (Y) = chevron.l X, Y chevron.r_p = g_(i j) X^i Y^j $

  给右边重命名一下下标，

  $ X_i Y^i = g_(j i) X^j Y^i $
  
  由于 $Y^i$ 可以任取，因此为了保证两边相等，两边可以同时消去 $Y^i$。又因为 $g_(i j)$ 是对称张量，有 $g_(i j) = g_(j i)$，因此上式可以化简为：

  $ X_i = g_(i j) X^j $
]

类似地，我们可以暂时“发明”一个张量 $g^(i j)$ 用来表示升号映射：

$ X^i = g^(i j) X_j $

将两个变换复合一下，就有了：

$ X^i = g^(i j) X_j = g^(i j) g_(j k) X^k $

显然，$g^(i j) g_(j k)$ 必须是一个单位矩阵，即

$ g^(i j) g_(j k) = delta^i_k $

$g^(i j)$ 被称作 $g_(i j)$ 的*逆张量*，也可以称作*逆度规*。与度规张量能够用来计算向量内积一样，逆度规张量也可以用来计算协向量的内积。在此将证明留给读者。

#theorem[
  对于向量 $X, Y in T_p M$ 以及向量空间上定义的度规 $g_p(X, Y) = chevron.l X, Y chevron.r_p$，若在坐标卡中有 $X = X^i partial_i, Y = Y^i partial_i$，且：
  
  $ chevron.l X, Y chevron.r_p = g_(i j) X^i Y^j $

  则对于 $g_(i j)$ 的对偶张量 $g^(i j)$ 以及 $X, Y$ 的对偶向量 $X^flat = X_i dif x^i, Y^flat = Y_i dif x^i$ 可以定义内积：

  $ chevron.l X^flat, Y^flat chevron.r_p = g^(i j) X_i Y_j $

  其数值恒等于 $X$ 和 $Y$ 的内积 $chevron.l X, Y chevron.r_p$。即：

  $ g_(i j) X^i Y^j = g^(i j) X_i Y_j $
]

== 长度与角度

有了向量内积之后，就可以定义曲线的长度了。我们定义向量 $X in T_p M$ 模长为：

$ ||X|| = sqrt(chevron.l X\, X chevron.r) $

我们在#link("/zh/posts/2026-08-08/diff-geometry/", "第一篇文章")中就定义过了流形上的路径，并且提到了流形路径的每一点上都有一个切向量。直接利用这一点就可以写出路径长度的表达式：

$ |gamma| = integral_(t_1)^(t_2) ||dot(gamma)(t)|| dif t $

$||dot(gamma)(t)|| : I subset.eq RR -> RR$ 是一个我们再熟悉不过的单值函数了，只需要写出表达式算积分即可。

有了内积之后，我们同样可以定义两个向量之间的夹角：

$ cos(theta) = (chevron.l X, Y chevron.r) / (||X|| dot ||Y||) $

== 一个例子

先从我们熟悉的立体几何开始看起。考虑一个单位球面 $S^2$，以及球面上的球极坐标。坐标卡 $phi_alpha : lr(S^2 - {mat(sin theta, 0, cos theta)^top | theta in [0, pi]}) -> RR^2 $ 给球面除了一条经线以外的所有点都分配了一个坐标 $(theta, phi)$，其中 $theta in (0, pi), phi in (0, 2 pi)$。由于球面是内嵌在一个三维空间中的，我们可以直接将切向量在三维空间中的内积借用过来作为二维流形上的度规。

对于球面上的点 $(theta, phi)$，其对应的三维坐标为 $(sin theta cos phi, sin theta sin phi, cos theta)$。对其求导，得到沿着 $theta$ 和 $phi$ 方向的切线：

$ partial_theta = vec(cos theta cos phi, cos theta sin phi, -sin theta) $

$ partial_phi = vec(-sin theta sin phi, sin theta cos phi, 0) $

接下来对这两个基向量分别求内积，即可得到度规张量的各个分量：

$ g_(theta theta) = chevron.l partial_theta, partial_theta chevron.r = 1 $

$ g_(theta phi) = chevron.l partial_theta, partial_phi chevron.r = 0 $

$ g_(phi phi) = chevron.l partial_phi, partial_phi chevron.r = sin^2 theta $

此时度规张量也可以写成：

$ g = dif theta^2 + sin^2 theta dif phi^2 $

假设我们想要计算路径 $gamma(t) = phi_alpha^(-1)(t, 2 t), t in [0, pi]$ 的路径长度（换句话说就是球面上的曲线 $cases( theta = t, phi = 2 t ), t in [0, pi]$），只需要首先计算路径上每个点的切向量表达式：

$ dot(gamma)(t) = partial_theta + 2 partial_phi $

用分量形式来书写就是

$ dot(gamma)^theta (t) = 1 $

$ dot(gamma)^phi (t) = 2 $

接着对每个点的切向量做积分：

$
|gamma| &= integral_(t = 0)^pi sqrt(chevron.l dot(gamma)(t)\, dot(gamma)(t) chevron.r) dif t \
&= integral_(t = 0)^pi sqrt(g_(i j) dot(gamma)^i dot(gamma)^j) dif t \
&= integral_(t = 0)^pi sqrt(mat(1, 2) mat(1, 0; 0, sin^2 (theta(t))) vec(1, 2)) dif t \
&= integral_(t = 0)^pi sqrt(1 + sin^2 t) dif t
$

这个积分是一个椭圆积分，没有初等解析解。其数值解为 $|gamma| approx 3.8202$。

#figure(
  three-js-figure("/blog/zh/2026-08-22/metric-on-sphere.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [球面 $S^2$ 上的路径 $gamma(t) = (theta = t, phi = 2 t)$ 及其在球极坐标坐标卡下的表示。球面上的红色、绿色和橙色箭头分别是切向量 $partial_theta$、$partial_phi$ 和路径切向量 $dot(gamma) = partial_theta + 2 partial_phi$。蓝色椭圆表示度规 $g = dif theta^2 + sin^2 theta dif phi^2$ 下等长的向量集合，在极点附近椭圆会沿 $phi$ 方向拉长。],
) <fig:metric-on-sphere>

= 子流形与光滑嵌入

在刚刚的例子中，流形 $S^2$ 是内嵌在三维欧氏空间 $RR^3$ 中的一个子流形，这让我们可以直接将 $RR^3$ 中的度规“借用”到 $S^2$ 上。这种方法其实也可以推广到更一般的两个流形中。首先我们可以定义*子流形*的概念：

#definition[
  对于 $m$ 维流形 $M$ 和 $n$ 维流形 $N$，若映射 $f : C^infinity (N, M)$，且满足对于任意一点 $p in N$ 都有 $dif f_p : T_p N -> T_(f(p)) M$ 是单射，那么 $f$ 被称为 $N$ 到 $M$ 的一个*浸入（Immersion）*。
] <def:immersion>

浸入并不要求 $f$ 是单射，也不要求 $f$ 保持原来流形的拓扑结构。比如，将开区间 $(0, 4 pi)$ 通过映射 $t mapsto (cos(t), sin(t))$ 映射到单位圆 $S^1$ 上，这个映射是一个浸入，但显然这个映射不是单射（因为绕了单位圆两圈），这个映射也没有保持原来线段的全局拓扑结构，因此不是拓扑嵌入。

当然，某些比较极端的映射则不属于浸入，比如将一个曲面压缩成一个点或者一条曲线的这种映射就不是浸入，因为它让曲面上每个点局部的切空间降维了。

#definition[
  对于拓扑空间 $M$ 和 $N$，若连续映射 $iota : N -> M$ 为单射，且逆映射 $iota^(-1) : f(N) -> N$ 连续（即 $iota : N -> f(N)$ 是拓扑同胚），则称 $iota$ 为 $N$ 到 $M$ 的一个*拓扑嵌入（Topological Embedding）*。
] <def:topological-embedding>

一个比较显然的结论是，如果 $N$ 到 $M$ 有拓扑嵌入 $iota : N -> M$，那么 $N$ 上的拓扑 $cal(O)_N$ 经过 $iota$ 映射之后就是 $cal(O)_M$ 在 $iota(N)$ 上的子空间拓扑（详见维基百科#link("https://en.wikipedia.org/wiki/Subspace_topology", "子空间拓扑")）。换句话说，将 $N$ 嵌入 $M$ 的过程也必须保持 $N$ 自身的拓扑结构，不能通过切断或者连接改变 $N$ 的拓扑结构。

最后是流形嵌入和子流形的定义：

#definition[
  如果映射 $iota : N -> M$ 同时是浸入和拓扑嵌入，那么称 $iota$ 为 $N$ 到 $M$ 的一个*光滑嵌入（Smooth Embedding）*，记作 $N arrow.r.hook M$。
] <def:embedding>

#definition[
  对于流形 $M$，若 $N subset M$ 是一个流形，则称 $N$ 为 $M$ 的*子流形（Submanifold）*。
]

对于光滑嵌入和子流形，有如下结论：

#theorem[
  1. 光滑嵌入 $iota : N arrow.r.hook M$ 的像一定是一个 $M$ 的子流形。
  2. 对于 $M$ 的子流形 $N subset M$，$id_N : N -> M, p mapsto p$ 是一个光滑嵌入。
  3. 对于 $m$ 维流形 $M$ 的 $n$ 维子流形 $N$ 以及点 $p in N$，可以构造 $p$ 的邻域 $U$ 上的一个坐标卡 $phi : U -> RR^m$，使得

    $ phi(U inter N) = phi(U) inter (RR^n times {mathbf(0)}) $

    换句话说，坐标卡 $phi$ 将所有 $N$ 上的点映射到的坐标的后 $m - n$ 个数都是 $0$。
] <thm:smooth-embedding>

这个定理的证明比较繁琐，在此省略了。感兴趣的读者可以参考 Introduction to Smooth Manifolds 这本教材 @lee2013introduction。

== 光滑嵌入的微分性质

对于任何光滑嵌入 $iota : N arrow.r.hook M$，@thm:smooth-embedding 告诉我们：$dif iota_p : cal(L)(T_p N, T_(iota(p)) M)$ 的秩等于 $N$ 的维度 $n$。这个性质帮我们杜绝了很多退化情况，让我们可以放心地使用 $dif iota_p$ 作为连接 $T_p N$ 和 $T_(iota p) M$ 这两个切空间的桥梁。

不妨用不带波浪号的 $X^i partial_i$ 表示 $N$ 上的量，带波浪号的 $tilde(X)^i tilde(partial)_i$ 表示 $M$ 上的量。可以用 $dif iota_p$ 将 $T_p N$ 上的向量 $X$ 给映射到 $T_p M$ 中。这个操作被称为*推前（Pushforward）*。

$ tilde(X) = dif iota_p X $

$ tilde(X)^i = (partial tilde(x)^i) / (partial x^j) X^j $

反过来，可以将 $M$ 上的协向量给*拉回（Pullback）*到流形 $N$ 上。对于协向量 $tilde(omega) in T^*_(iota(p)) M$，拉回运算被记作：

$ omega = tilde(omega) compose dif iota_p $

$ omega_i = (partial tilde(x)^j) / (partial x^i) tilde(omega)_j $

有时你也会看到使用记号 $iota_* (X)$ 和 $iota^* (tilde(w))$ 来表示推前和拉回运算。

那么我们能不能把 $T_(iota(p)) M$ 上的向量给拉回到 $T_p N$ 上，或者是把 $T^*_p N$ 上的协向量给推前到 $T^*_(iota(p)) M$ 上呢？答案是不行，因为 $N$ 的维数小于 $M$ 的维数，因此这两个操作都会导致推前/拉回的数学对象无法唯一确定。请记住：当我们将低维流形 $N$ 嵌入高维流形 $M$ 时，只有逆变量能够推前，只有协变量能够拉回。

== 拉回度规

既然协变向量可以拉回，那么度规张量作为一个(0, 2)型的二阶协变张量，自然也是可以做拉回操作的。对于 $M$ 上的度规 $tilde(g) = tilde(g)_(i j) dif tilde(x)^i dif tilde(x)^j$，其在 $N$ 上的*拉回度规*记作 $g$，那么对于 $p in N$ 和切空间上的向量 $X, Y in T_p N$，有。

$ g(X, Y) = tilde(g)(dif iota_p X, dif iota_p Y) $

写成向量分量形式就是：

$ g_(i j) = tilde(g)_(k l) (partial tilde(x)^k) / (partial x^i) (partial tilde(x)^l) / (partial x^j) $

如果将 $g_(i j)$ 的各个分量写成矩阵形式，用我们熟悉的线性代数记号来写就是：

$ g = J^T tilde(g) J $

由于 $tilde(g)$ 是对称正定的，嵌入变换的雅可比 $J$ 一定是满秩的，因此拉回度规 $g$ 也一定是对称正定的。这一点是由变换公式 $J^T tilde(g) J$ 保证了的。

#bibliography("reference.bib", full: true)
