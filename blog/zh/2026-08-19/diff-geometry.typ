// title: 微分几何2：数学对象的坐标表示
// summary: 协向量、坐标与爱因斯坦求和记号。
// tags: mathematics, differential-geometry
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, theorem, definition, proof, example, corollary
#import "@preview/cetz:0.3.4"

#show: article.with(
  title: "微分几何2：数学对象的坐标表示",
  lang: "zh",
)

= 向量的对偶空间

继续#link("/zh/posts/2026-08-08/diff-geometry/")[上一篇文章]中的讨论。上次提到过，如果 $f : M arrow.r RR$ 是一个流形上的标量场，那么 $f$ 的微分 $dif f_p : T_p M arrow.r RR$ 是一个协向量场，也可以叫一个 $M$ 上的1-形式。可是，协向量又是什么？

我们需要先明确向量空间的对偶空间的概念。

#definition[
  对于向量空间 $V$，其*对偶空间（Dual Space）*$V^*$ 包含了所有 $V$ 到 $RR$ 的线性映射，即

  $ V^* = cal(L)(V, RR) $

  对偶空间上的向量被称为*对偶向量（Dual Vector）*。在微分几何的语境下也可以称为*协向量（Covector/Covariance Vector）*。
] <def:dual-space>

任何向量空间都可以构造其对偶空间。对偶空间的定义不依赖基向量的选取，因此即使没有选择公理也可以构造出向量空间的对偶空间，像是 $RR^infinity$ 或者是函数空间 $L^2[a, b]$ 这种空间都可以构造出其对偶空间。不过对于流形来说，我们只需要考虑有限维的 $RR^m$ 向量空间即可。

对偶空间 $V^* : V arrow.r RR$ 可以使用一般函数上定义的加法和数乘运算，即

$ (c_1 v^* + c_2 w^*)(x) = c_1 v^*(x) + c_2 w^*(x) $

不难证明，$V^*$ 在加法和数乘运算下封闭。因此，$V^*$ 的确是一个向量空间。

对偶空间的一大重要性质是：原空间 $V$ 可以自然嵌入（不依赖基向量选取的嵌入）对偶空间的对偶空间 $V^(**)$ 中。嵌入映射如下：

$ phi : V arrow.r V^(**), v arrow.r.bar phi(v) $

其中 $phi(v) : V^(**)$ 满足

$ phi(v)(w^*) = w^* (v) $

对于 $RR^m$ 这类比较良好的向量空间，也可以证明嵌入映射 $phi$ 是一个满射。也就是说，$V$ 和 $V^(**)$ 有自然同构。可以认为 $V^(**)$ 和 $V$ 就是同一个向量空间。这也是为什么对偶空间可以被叫做“对偶空间”——因为对偶空间的对偶空间又变回了原空间。

== 对偶空间的基向量

刚刚所有的推理都没有假设任何原空间上的基向量。如果我们将视野局限一些，只关注有限维的实向量空间 $V = RR^m$，那么一定可以给原空间 $V$ 选取一组基 ${mathbf(e)_i}_(i=1)^m$。一个自然的想法是，我们可以将对偶向量的基向量定义为下面这样一组函数 ${mathbf(e)^*_i}_(i=1)^m$：

#definition[
  向量空间 $V$ 的基向量 ${mathbf(e)_i}_(i=1)^m$ 所对应的*对偶基（Dual Basis）*为满足下述条件的向量集合 ${mathbf(e)^*_i}_(i=1)^m$：

  $ mathbf(e)^*_i (mathbf(e)_j) = cases(1\, & i = j, 0\, & i != j) $
] <def:dual-basis>

#theorem[
  对于任何一组 $V$ 上的基向量 ${mathbf(e)_i}_(i=1)^m$，满足上述描述的对偶基 ${mathbf(e)^*_i}_(i=1)^m$ 存在且唯一。
] <thm:exist-unique-of-dual-basis>

#proof[
  任取一组空间 $V^*$ 的基 ${mathbf(v)^*_i}_(i=1)^m$，定义映射 $F : RR^m arrow.r RR^m$ 为

  $ F lr( vec(x_1, x_2, dots.v, x_m) ) = vec(mathbf(v)^*_1, mathbf(v)^*_2, dots.v, mathbf(v)^*_m) (x_1 mathbf(e)_1 + x_2 mathbf(e)_2 + dots.c + x_m mathbf(e)_m ) $

  不难证明 $F$ 是一个线性映射，因此 $F$ 可以用一个 $m times m$ 矩阵表示。同时，由于 ${mathbf(e)_i}$ 张成空间 $V$，${mathbf(v)^*_i}$ 张成空间 $V^*$，$F$ 一定是满秩的。也就是说，存在 $F$ 的逆矩阵 $F^(-1)$。

  定义

  $ vec(mathbf(e)^*_1, mathbf(e)^*_2, dots.v, mathbf(e)^*_m) = F^(-1) vec(mathbf(v)^*_1, mathbf(v)^*_2, dots.v, mathbf(v)^*_m) $

  那么有：

  $
  vec(mathbf(e)^*_1, mathbf(e)^*_2, dots.v, mathbf(e)^*_m) (x_1 mathbf(e)_1 + x_2 mathbf(e)_2 + dots.c + x_m mathbf(e)_m ) &= F^(-1) vec(mathbf(v)^*_1, mathbf(v)^*_2, dots.v, mathbf(v)^*_m) (x_1 mathbf(e)_1 + x_2 mathbf(e)_2 + dots.c + x_m mathbf(e)_m ) \
  &= F^(-1) F vec(x_1, x_2, dots.v, x_m) \
  &= vec(x_1, x_2, dots.v, x_m)
  $

  将 $mat(x_1, x_2, dots.c, x_m)^top$ 依次替换为 $mat(1, 0, dots.c, 0)^top$、$mat(0, 1, dots.c, 0)^top$、...、$mat(0, 0, dots.c, 1)^top$ 即可证明 ${mathbf(e)^*_i}$ 符合上述要求。

  如果存在两组符合该要求的对偶基 ${mathbf(e)^*_i}$ 和 ${mathbf(bar(e))^*_i}$，则使用与上述方法相同的方法可以证明，二者之间的映射矩阵为单位矩阵，因此可以说 ${mathbf(e)^*_i}$ 和 ${mathbf(bar(e))^*_i}$ 是同一组基向量。
]

有了对偶基的概念，以下推论都是显然的了：

#corollary[
  对于有限维实向量空间 $V$，$dim V^* = dim V$。
]

#corollary[
  双重对偶空间 $V^(**)$ 的基向量 ${mathbf(e)^(**)_i}$ 自然同构于原空间中的基向量 ${mathbf(e)_i}$。
]

== 对偶向量的几何表示

一般来说我们用箭头来表示平面或者空间上的向量——“箭头”这个形状同时具有长度和方向，因此很适合表示向量这个数学结构。那么有没有对应于协向量的直观表示呢？

我们想到，既然协向量是一个向量到 $RR$ 的线性函数，我们不妨用这个函数的等值线来表示协向量。由于函数是线性的，它的图像就是一系列平行的直线/平面。如 @fig:covector-plane 所示。平行线越密，所表示的协向量就越大，因为同样长度和方向的向量会穿过更多的等值线。

#figure(
  image("covector.png", width: 75%),
  caption: [平面上的向量（蓝色箭头）和协向量（绿色平行直线）。协向量作用在向量上的取值可以直接读出。]
) <fig:covector-plane>

对于函数 $f : M arrow.r RR$，$dif f$ 给 $M$ 上的每个点都对应了一个协向量 $dif f_p : T_p M arrow.r RR$。这就是一个*协向量场*，也称为一个1-形式。流形上的协向量场可以用一系列弯曲的等值线来表示。在每个点局部，弯曲的等值线会近似变成平直的，也就是这个点局部的微分。将 $dif f_p$ 作用在点 $p$ 局部的一个向量上，得到的就是 $f$ 沿着这个向量往前走变化的速率。@fig:covector-sphere 展示了球面上的一个标量场 $f$ 和其微分 $dif f$ 对应的协向量场。

#figure(
  three-js-figure("/blog/zh/2026-08-19/covector-sphere.js", body: [
    _（交互式三维场景，仅在网页版显示。）_
  ]),
  caption: [球面上的一个标量场 $f$（左：函数值；右：等高线）。拖动红点可观察该点处切平面上的协向量 $dif f_p$（绿色平行直线）。]
) <fig:covector-sphere>

我们目前还没定义协向量的分量、内积、模长这些函数。到下一个章节，你会看到如何从这些平行线中读出协向量的这些数值。

在微分几何之外，对偶向量也非常有用。比如，物理中用来表示一束波的传播方向的向量是波矢 $mathbf(k)$，高中的时候我们通常就把它当常规向量来做运算，而现在我们知道了 $mathbf(k)$ 实际上是一个空间中的协向量。再比如，晶体学中会需要处理很多晶胞中三个基向量不是两两正交的情况，此时强行使用直角坐标系来表示平面的话往往很难看出它和晶体晶格的联系，而使用晶胞坐标系中的对偶向量就可以很方便地表示晶体中的一族平行的平面。参见#link("https://en.wikipedia.org/wiki/Miller_index", "米勒指数")。

= 向量与协向量的坐标表示

对于点 $p in M$ 的切空间 $T_p M$，每个覆盖了点 $p$ 邻域的坐标卡 $(U_alpha, phi_alpha)$ 都定义了 $p$ 点附近的一个近似欧氏的的坐标系。对 $phi_alpha$ 在 $p$ 点上取微分，得到 $dif phi_alpha : T_p M arrow.r RR^m$：这可以看作是给 $T_p M$ 向量空间定义了一个坐标系。

定义基向量：

$
  mathbf(e)_i = dif (phi_alpha^(-1))_(phi_alpha (p)) vec(0, dots.v, 0, 1\, & i"th", 0, dots.v, 0)
$

将向量 $mat(0, dots.c, 0, 1\, & i"th", 0, dots.c, 0)^top$ 简写为 $mathbf(delta)_i$（$mathbf(delta)_i in RR^m$），则不难看出，$mathbf(e)_i$ 满足：

$ (dif phi_alpha)_p mathbf(e)_i = lr( (dif phi_alpha)_p compose dif (phi_alpha^(-1))_(phi_alpha (p)) ) mathbf(delta)_i = mathbf(delta)_i $

也就是说，如果以 ${mathbf(e)_i}_(i=1)^m$ 为基底展开任何一个向量 $mathbf(v) in T_p M$

$ mathbf(v) = sum_(i = 1)^m v_i mathbf(e)_i $

再对其做 $(dif phi_alpha)_p$ 映射，就得到了：

$
(dif phi_alpha)_p mathbf(v) &= sum_(i = 1)^m v_i (dif phi_alpha)_p (mathbf(e)_i) \
&= sum_(i=1)^m v_i mathbf(delta)_i \
&= vec(v_1, v_2, dots.v, v_m)
$

换句话说，映射 $(dif phi_alpha)_p$ 的功能就是将向量 $mathbf(v) in T_p M$ 映射到其坐标表示上。而基向量 ${mathbf(e)_i}_(i=1)^m$ 就被称为坐标卡 $(U_alpha, phi_alpha)$ 的*坐标基（Coordinate Basis）*。

如果将函数 $phi_alpha$ 的各个分量展开，记第 $i$ 个分量为 $x_i$。用这个记号的话，也可以把 $mathbf(e)_i$ 这样写：

$
  mathbf(e)_i = dif (phi_alpha^(-1))_(phi_alpha (p)) mathbf(delta)_i = (partial phi_alpha^(-1)) / (partial x_i)
$

虽然一般来说 $partial / (partial x_i)$ 只能作用在 $RR^m$ 到 $RR^n$ 上的函数，但是此处借用了它的含义，可以理解为这里的偏微分符号只是 $dif (phi_alpha^(-1))_(phi_alpha (p)) mathbf(delta)_i$ 这个公式的一种简写。

在微分几何中，我们通常省略掉 $phi_alpha^(-1)$，直接将基向量写作 $partial / (partial x_i)$。甚至有些地方你还会见到直接简写为 $partial_i$ 的写法。我们在之后均采用这种简写，比如 $mathbf(v)$ 的分量形式就写作 $mathbf(v) = v_i partial_i$。

那么切空间的对偶空间 $T_p^* M$（也就是*余切空间（Cotangent Space）*）的基向量呢？根据 @def:dual-basis，我们希望寻找一组线性函数 $mathbf(e)^*_i : T_p M arrow.r RR$，满足 $mathbf(e)^*_i (partial_j) = cases(1\, & i = j, 0\, & i != j)$。而我们刚刚的推导中就得到了一个类似的量：

$
  (dif phi_alpha)_p (partial_i) = mathbf(delta)_i
$

如果把 $phi_alpha$ 的各个分量展开，也就是说，$phi_alpha (p) = mat(x_1 (p), x_2 (p), dots.c, x_m (p))^top$，其中 $x_i : T_p M arrow.r RR$。我们就能得到：

$
  (dif x_i) (partial_j) = delta_(i j) = cases(1\, & i = j, 0\, & i != j)
$

此处的 $delta_(i j)$ 是一个线性代数和微分几何中非常常用的符号，称作*克罗内克δ符号（Kronecker delta）*。上面的公式也证明了，*切空间 $T_p M$ 中的基向量 ${partial_i}_(i=1)^m$ 与余切空间 $T^*_p M$ 的基向量 ${dif x_i}_(i=1)^m$ 互为对偶基*。从现在开始，我们就会将坐标映射 $phi_alpha = mat(x_1, x_2, dots.c, x_m)^top$ 下的逆变基和协变基记作 ${partial_i}$ 和 ${dif x_i}$。

对于任何一个协向量 $mathbf(u)^* in T_p^* M$，同样可以将其展开成分量形式：

$ mathbf(u)^* = sum_(i=1)^m u_i dif x_i $

如果将协向量 $mathbf(u)^*$ 作用在一个向量 $mathbf(v) = sum_(i=1)^m v_i partial_i in T_p M$ 上，有：

$
mathbf(u)^* (mathbf(v)) &= sum_(i=1)^m sum_(j=1)^m u_i dif x_i (v_j partial_j) \
&= sum_(i=1)^m sum_(j=1)^m u_i v_j dif x_i (partial_j) \
&= sum_(i=1)^m sum_(j=1)^m u_i v_j delta_(i j) \
&= sum_(i=1)^m u_i v_i
$

= 坐标变换

众所周知，流形上每个点可能被不止一个坐标卡覆盖。如果多个坐标卡同时覆盖了一个点，此时为了保证向量、协向量这些数学对象在不同坐标系下都保持一致，我们还需要搞清楚这些东西的各个分量是怎么变换的。比如，如果 $(U_alpha, phi_alpha)$ 和 $(U_beta, phi_beta)$ 同时覆盖了点 $p$，那么二者之间就有换算函数 $phi_(beta alpha) = phi_beta compose phi_alpha^(-1)$。我们不妨定义二者的坐标分量为：

$ phi_alpha = mat(x_1, x_2, dots.c, x_n)^top $

$ phi_beta = mat(tilde(x)_1, tilde(x)_2, dots.c, tilde(x)_n)^top $

对于向量 $mathbf(v) = sum_(i=1)^m v_i partial_i = sum_(i=1)^m tilde(v)_i tilde(partial)_i$，可以使用微分的链式法则来描述 $v_i$ 与 $tilde(v)_i$ 之间的关系。根据我们最早对基向量 $partial_i$ 的定义，基向量就是坐标逆映射 $phi_alpha^(-1)$ 在某个方向上的偏微分。也就是说：

$
  tilde(partial)_i &= (dif phi_beta^(-1))_(phi_beta (p)) mathbf(delta)_i \
  &= (dif phi_alpha^(-1) compose phi_(beta alpha)^(-1))_(phi_beta (p)) mathbf(delta)_i \
  &= (dif phi_alpha^(-1))_(phi_alpha (p)) compose (dif phi_(beta alpha)^(-1))_(phi_beta (p)) mathbf(delta)_i \
  &= (dif phi_alpha^(-1))_(phi_alpha (p)) compose (dif phi_(beta alpha))_(phi_alpha (p))^(-1) mathbf(delta)_i
$

注意到 $phi_(beta alpha) : RR^m arrow.r RR^m$ 是两个欧氏空间之间的映射，也就是说 $(dif phi_(beta alpha))_(phi_alpha (p))$ 是这个函数的雅可比矩阵，不妨记作 $J$。那么我们就有：

$
  tilde(partial)_i = (dif phi_alpha^(-1))_(phi_alpha (p)) J^(-1) mathbf(delta)_i
$

写成分量形式就是：

$
  tilde(partial)_i &= (dif phi_alpha^(-1))_(phi_alpha (p)) sum_(k=1)^m J^(-1)_(j k) delta_(i k) \
  &= (dif phi_alpha^(-1))_(phi_alpha (p)) J^(-1)_(j i) \
  &= sum_(j = 1)^m partial_j J^(-1)_(j i)
$

而另一边，它的各个分量呢？我们可以将 $tilde(partial)_i$ 展开成 $partial_i$ 形式：

$
  mathbf(v) &= sum_(i=1)^m tilde(v)_i tilde(partial)_i \
  &= sum_(i=1)^m tilde(v)_i sum_(j = 1)^m partial_j J^(-1)_(j i) \
  &= sum_(j=1)^m (sum_(i=1)^m J^(-1)_(j i) tilde(v)_i) partial_j
$

也就是说，$(U_alpha, phi_alpha)$ 坐标卡中的分量 $v_i$ 与 $(U_beta, phi_beta)$ 中的分量 $tilde(v)_i$ 之间的关系是：

$ v_i = sum_(j=1)^m J^(-1)_(i j) tilde(v)_j $

两边左乘上矩阵 $J$，得到：

$ tilde(v)_i = sum_(i=1)^m J_(i j) v_j $

注意到，“基向量本身”和“在该基向量上的分量”这两个量在做坐标变换的时候，一个是乘上矩阵 $J^(-1)_(j i)$，另一个是乘上矩阵 $J_(i j)$。我们称和基向量变换使用相同方式变换的这些量为*协变（Covariant）*，而和向量分量使用相同方式变换的这些量为*逆变（Contravariant）*。

我们再来看协向量的变换。对于协向量 $mathbf(u)^* = u_i dif x_i = tilde(u)_i dif tilde(x)_i$，有：

$
  dif tilde(x)_i &= [(dif phi_beta)_p]_i \
  &= [dif (phi_(beta alpha) compose phi_alpha)_p]_i \
  &= [(dif phi_(beta alpha))_(phi_alpha (p))]_i compose (dif phi_alpha)_p \
  &= sum_(j=1)^m J_(i j) dif x_j
$

相应的，协变向量的分量变换就是：

$
  mathbf(u)^* &= sum_(i=1)^m tilde(u)_i dif tilde(x)_i \
  &= sum_(i=1)^m tilde(u)_i sum_(j=1)^m J_(i j) dif x_j \
  &= sum_(j=1)^m (sum_(i=1)^m J_(i j) tilde(u)_i) dif x_j
$

也就是说，

$
  u_j = sum_(i=1)^m tilde(u)_i J_(i j)
$

两边右乘上 $J^(-1)$ 得到：

$
  tilde(u)_i = sum_(j=1)^m u_j J^(-1)_(j i)
$

注意到，余切空间的基 $dif x_i$ 的变换规则和_切空间的分量_是一样的，也就是说，余切空间的基是_逆变_的，而协向量的分量反而是_协变_的。这一点与切空间中的向量刚好是反过来的。

#table(
  columns: 3,
  [], [*协变*], [*逆变*],
  [从 $(U_alpha, phi_alpha)$ 变换到 $(U_beta, phi_beta)$], [右乘矩阵 $J^(-1) = (dif phi_(alpha beta))_(phi_beta (p))$], [左乘矩阵 $J = (dif phi_(beta alpha))_(phi_alpha (p))$],
  [例子], [切空间基向量 $partial_i$、协变向量的分量 $u_i$], [余切空间基向量 $dif x_i$、逆变向量的分量 $v_i$]
)

现在你们只需要记住，逆变和协变分别对应左乘/右乘两个互为逆矩阵的变换矩阵即可。

== 一个例子

上述推理都在用抽象的线性代数在计算，非常不直观，我们不妨看一个简单的例子。假设我们考虑 $RR^2$ 上的两个坐标卡，坐标卡 $phi_alpha$ 与 $RR^2$ 本身完全对齐（即 $phi_alpha = id$），坐标卡 $phi_beta$ 满足 $phi_beta (mathbf(p)) = 2 mathbf(p)$。换句话说，如果将两张坐标卡画成网格，$phi_beta$ 的网格会是 $phi_alpha$ 的两倍密度。如 @fig:coordinate-transform 所示。

#figure(
  image("coordinate-transform.png"),
  caption: [同一个向量和协向量在两个坐标系下的分量。$beta$ 坐标系的网格密度是 $alpha$ 坐标系的两倍。]
) <fig:coordinate-transform>

此时 $phi_(beta alpha)$ 的雅可比矩阵在各处均为：

$ J = dif phi_(beta alpha) = mat(2, 0; 0, 2) $

注意观察 @fig:coordinate-transform 中的这个向量。同一个向量在左右两个坐标卡中读出来的分量显然是不同的：右侧坐标系中的两个单位向量是左侧的一半长，对应着右乘矩阵 $J^(-1)$；而右侧蓝色向量在 $x$ 和 $y$ 方向上的分量则是左侧的两倍，对应着左乘矩阵 $J$。这与我们一开始推导出来的“基向量协变、向量分量逆变”是一致的。

再看绿色的这个协向量。之前说过，平行直线越密，所表示的协向量就越大。而图中右侧的坐标网格更密，那么如果将右侧的坐标网格放大到和左侧保持一致，那么右侧这组表示协向量的平行直线就会比左侧更稀疏——更具体地说，其密度会是左侧的一半。也就是说，协向量在右侧坐标卡中的 $x$ 和 $y$ 分量均为左侧的一半，对应着右乘矩阵 $J^(-1)$。而如果我们把图中背景上的方形网格中的竖线和横线分别提取出来，这组平行竖线和平行横线就分别是余切空间的 $dif x$ 和 $dif y$ 两个基向量。由于右侧网格是左侧的两倍密，右侧的两个基向量显然也是左侧的两倍，这正好对应了左乘矩阵 $J$。这也说明了协向量的坐标变换方式和逆变向量是完全反过来的：“基向量逆变、向量分量协变”。

== 向量/协向量的矩阵表示

我们刚刚看到了许多量的逆变和协变关系。一个数学巧合是：逆变/协变量刚好可以对应到矩阵的列向量和行向量。比如，在坐标卡 $(U_alpha, phi_alpha)$ 中向量 $mathbf(v) = sum_(i=1)^m v_i partial_i$，则可以写成：

$
  mathbf(v) = mat(partial_1, partial_2, dots.c, partial_m) vec(v_1, v_2, dots.v, v_m)
$

从 $(U_alpha, phi_alpha)$ 图卡变到 $(U_beta, phi_beta)$ 时，分量的变换需要左乘上雅可比矩阵：

$
  vec(tilde(v)_1, tilde(v)_2, dots.v, tilde(v)_m) = J vec(v_1, v_2, dots.v, v_m) = mat( (partial tilde(x)_1) / (partial x_1), (partial tilde(x)_1) / (partial x_2), dots.c, (partial tilde(x)_1) / (partial x_m); (partial tilde(x)_2) / (partial x_1), (partial tilde(x)_2) / (partial x_2), dots.c, (partial tilde(x)_2) / (partial x_m); dots.c; (partial tilde(x)_m) / (partial x_1), (partial tilde(x)_m) / (partial x_2), dots.c, (partial tilde(x)_m) / (partial x_m)) vec(v_1, v_2, dots.v, v_m)
$

而基向量的变换需要右乘上雅可比的逆矩阵：

$
  mat(tilde(partial)_1, tilde(partial)_2, dots.c, tilde(partial)_m) = mat(partial_1, partial_2, dots.c, partial_m) J^(-1) = mat(partial_1, partial_2, dots.c, partial_m) mat( (partial x_1) / (partial tilde(x)_1), (partial x_1) / (partial tilde(x)_2), dots.c, (partial x_1) / (partial tilde(x)_m); (partial x_2) / (partial tilde(x)_1), (partial x_2) / (partial tilde(x)_2), dots.c, (partial x_2) / (partial tilde(x)_m); dots.c; (partial x_m) / (partial tilde(x)_1), (partial x_m) / (partial tilde(x)_2), dots.c, (partial x_m) / (partial tilde(x)_m) )
$

也就是说，向量 $mathbf(v)$ 在两个坐标卡下都可以用相同的形式表示。换句话说，$mathbf(v)$ 是一个坐标变换下的不变量。

$
  mathbf(v) &= mat(partial_1, partial_2, dots.c, partial_m) vec(v_1, v_2, dots.v, v_m) \
  &=  mat(partial_1, partial_2, dots.c, partial_m) J^(-1) J vec(v_1, v_2, dots.v, v_m) \
  &= (mat(partial_1, partial_2, dots.c, partial_m) J^(-1)) (J vec(v_1, v_2, dots.v, v_m)) \
  &= mat(tilde(partial)_1, tilde(partial)_2, dots.c, tilde(partial)_m) vec(tilde(v)_1, tilde(v)_2, dots.v, tilde(v)_m)
$

而协向量则刚好反过来——坐标分量是一个行向量，而基向量则是列向量。但有一点和逆变向量是一样的——协变向量同样是一个坐标变换下的不变量，在不同的坐标系下协变向量的矩阵表示形式是一样的。

$
  mathbf(u)^* &= mat(u_1, u_2, dots.c, u_m) vec(dif x_1, dif x_2, dots.v, dif x_m) \
  &= mat(u_1, u_2, dots.c, u_m) J^(-1) J vec(dif x_1, dif x_2, dots.v, dif x_m) \
  &= (mat(u_1, u_2, dots.c, u_m) J^(-1)) (J vec(dif x_1, dif x_2, dots.v, dif x_m)) \
  &= mat(tilde(u)_1, tilde(u)_2, dots.c, tilde(u)_m) vec(dif tilde(x)_1, dif tilde(x)_2, dots.v, dif tilde(x)_m)
$

而协向量作用在逆向量上会得到一个标量。用坐标表示的话就是协向量分量的行向量乘在逆向量分量的列向量上：

$
  mathbf(u)^* (mathbf(v)) &= mat(u_1, u_2, dots.c, u_m) vec(dif x_1, dif x_2, dots.v, dif x_m) mat(partial_1, partial_2, dots.c, partial_m) vec(v_1, v_2, dots.v, v_m) \
  &= mat(u_1, u_2, dots.c, u_m) I vec(v_1, v_2, dots.v, v_m) \
  &= mat(u_1, u_2, dots.c, u_m) vec(v_1, v_2, dots.v, v_m)
$

这个数同样是一个坐标变换下的不变量，其值独立于坐标系的选取。不论换到哪个坐标系，一个不变的协向量作用在一个不变的逆向量上得到的永远是同一个数。

$
  mathbf(u)^* (mathbf(v)) &= mat(u_1, u_2, dots.c, u_m) vec(v_1, v_2, dots.v, v_m) \
  &= mat(u_1, u_2, dots.c, u_m) J^(-1) J vec(v_1, v_2, dots.v, v_m) \
  &= mat(tilde(u)_1, tilde(u)_2, dots.c, tilde(u)_m) vec(tilde(v)_1, tilde(v)_2, dots.v, tilde(v)_m)
$

这种使用行列向量来表示逆变和协变向量的记号在量子力学中非常常用。狄拉克记号中的bra和ket就可以理解为行向量/列向量，或者是协变向量/逆变向量。

当然，微分几何中还会研究一些更高维的张量，比如度规张量，这些张量可能会有某些指标是逆变的、某些指标是协变的，相较于刚刚看到的向量的坐标变换规则更加复杂。一个我们已经见过的例子是雅可比矩阵 $J$：对于从 $(U_alpha, phi_alpha)$ 到 $(U_beta, phi_beta)$ 的雅可比矩阵 $J = dif phi_(beta alpha)$，将其写成坐标形式 $J_(i j)$ 的话，下标 $i$ 是逆变的，而下标 $j$ 是协变的。我们同样可以用之前提到过的“缩放2倍法”来检验某个下标是逆变还是协变：如果将 $phi_alpha$ 和 $phi_beta$ 中的一个坐标系固定不动、另一个坐标系缩放为原来的2倍，那么 $J_(i j)$ 的对应分量会怎么变化？

== 坐标变换下的不变量

从刚刚的推导中我们看到，一个逆变的量乘上一个协变的量就会得到一个独立于坐标系的不变量。只要不涉及二阶以上的微分，那么这条规则一定适用。不仅对于向量和协向量是如此，对于高维张量也是如此。

这条规则的另一面是，如果一个不依赖具体坐标系的不变量在某个坐标系下展开，那么逆变指标和协变指标在求和式中必须一一匹配。比如：#link("/zh/posts/2026-08-08/diff-geometry/", [上一篇文章])中我们没有依赖任何坐标系来定义流形上的向量，也就是说，流形上的“向量”这个数学对象应该是坐标变换下的不变量，因此我们看到在给向量 $mathbf(v) in T_p M$ 展开成坐标形式 $mathbf(v) = sum_(i=1)^m v_i partial_i$ 时，一定会有一个逆变指标（此处为 $v_i$）和一个协变指标（此处为 $partial_i$）成对出现。同样的，协向量 $mathbf(u)^* : T_p M arrow.r RR$ 也是一个独立于具体坐标系选取的数学对象，那么协向量的坐标表示 $mathbf(u)^* = sum_(i=1)^m u_i dif x_i$ 也会有一个逆变指标（$dif x_i$）和一个协变指标（$u_i$）成对出现。

= 爱因斯坦求和记号

相信有了以上知识，*爱因斯坦求和记号*的出现就成为一个非常自然的事情了。

首先，我们希望能够区分逆变指标和协变指标。我们不妨将逆变指标标成上标、协变指标标成下标。并且既然求和式中逆变指标和协变指标永远成对出现，并且求和符号写起来很费劲，那么我们不妨直接把求和符号省略掉，只要在式子里看到一对用同一个字母标注的上下标就知道需要给这组指标加一个求和符号。这样我们的向量记号就变成了：

$ mathbf(v) = sum_(i=1)^m v_i partial_i quad arrow.r quad mathbf(v) = v^i partial_i $

$ mathbf(u)^* = sum_(i=1)^m u_i dif x_i quad arrow.r quad mathbf(u)^* = u_i dif x^i $

对于没有成对出现的指标，我们称之为*自由指标（Free Index）*，自由指标必须在等式左右两端同时出现。如果等式两端同时包含某个自由指标，那么这个等式就是在描述某个数学对象在该指标下的分量。比如，使用雅可比矩阵做坐标变换的公式就可以写成：

$ tilde(v)^i = J^i_j v^j, tilde(partial)_i = (J^(-1))^j_i partial_j $

$ tilde(u)_i = (J^(-1))^j_i u_j, dif tilde(x)^i = J^i_j dif x^j $

这四个公式中，左右两个等式共同包含的 $i$ 是自由指标，而右侧式子中的一对上下标 $j$ 则是*哑标（Dummy Index）*，哑标在右侧相当于省略了求和记号。

一般来说，矩阵（也就是 $T_p M arrow.r T_p M$ 的线性变换）可以看作是一个二维张量 $A in T_p M times T^*_p M$。矩阵在某个坐标系的分量的第一个维度是逆变的、第二个维度是协变的。也就是说，矩阵的坐标分量需要写成 $A^i_j$。举一个矩阵乘法的例子：

$
  A^(-1)^i_j A^j_k = delta^i_k
$

这里的 $delta$ 就是之前我们见过的克罗内克符号。$delta^i_k$ 就相当于是单位矩阵。

既然矩阵的两个指标中一个是逆变的、一个是协变的，那么我们可以直接据此写出矩阵分量的坐标系变换公式：若某个矩阵 $A$ 在$alpha$ 坐标卡上的分量为 $A^i_j$、在 $beta$ 坐标卡上的分量为 $tilde(A)^i_j$，那么对于变换函数 $phi_(beta alpha)$ 和其雅可比矩阵 $J$，有：

$ tilde(A)^i_j = J^i_k A^k_l (J^(-1))^l_j $

学过线性代数的你相信已经很熟悉这个表达式了——这就是矩阵的相似变换 $tilde(A) = J A J^(-1)$。在欧几里得空间中做矩阵的参考系变换也用的是同一个表达式。

上面看到的例子中左右两侧都只有一项。如果有多项之间用加法连接，那么我们认为所有项都共用同一组自由指标，而每一项各自的哑标都是独立的。自由指标必须在每一项中都出现。比如，举一个例子：

$ A^i_j = B^i_k C^k_j + D^i_(k l) E^k F^l_j $

上面这个求和式中，$i$ 和 $j$ 是自由指标，等式左右两边都有，那么相对应的等式右边通过加号连接的这两项也都需要包含 $i$ 和 $j$。另一边，$B^i_k C^k_j$ 这一项有一个哑标 $k$， 而 $D^i_(k l) E^k F^l_j$ 这一项有两个哑标 $k$ 和 $l$。虽然这两项中都有哑标 $k$，但是这两个 $k$ 不能被认为是同一个 $k$，因为左侧的 $k$ 和右侧的 $k$ 可以分别换名字而不影响另一个 $k$。这个式子如果把求和符号写全应该长这样：

$ A^i_j = sum_(k=1)^m B^i_k C^k_j + sum_(k=1)^m sum_(l=1)^m D^i_(k l) E^k F^l_j $

爱因斯坦求和记号在表示张量运算的时候非常好用，在微分几何和广义相对论中很常用。之后我们还会看到其他张量，比如度规张量 $g_(i j)$，这些张量的运算我们就统一使用爱因斯坦记号表示了。
