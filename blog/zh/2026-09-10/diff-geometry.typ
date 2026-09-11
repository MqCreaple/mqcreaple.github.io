// title: 微分几何4：平行移动与联络
// summary: 流形上的场、向量的平行移动、联络与 Christoffel 符号。
// tags: mathematics, differential-geometry
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, theorem, definition, proof, example, corollary, assumption
#import "@preview/cetz:0.3.4"

#show: article.with(
  title: "微分几何4：平行移动与联络",
  lang: "zh",
)

= 算符与求和记号

#link("/zh/posts/2026-08-19/diff-geometry/", "之前的文章")中已经讲过爱因斯坦求和记号了。不过当时我们的记号只能用在向量、矩阵和张量上。在微分几何中，凡是涉及场的微分性质的表达式里，通常不仅会有张量，还会有*算符*。在做张量计算（比如 $A^i_j b^j = c^i$）时，我们可以只看张量场 $A$ 在每个点 $p$ 上的取值即可，相邻点上的取值不会影响当前点的计算。而算符虽然也写成一个符号加上指标的形式，它们和张量场在运算规则上有本质的不同：比如偏导数算符 $partial_i = partial / (partial x^i) : C^infinity (M, RR) -> C^infinity (M, RR)$ 作用在一个场上时，点 $p$ 附近的场取值会影响 $p$ 点上算符运算后的结果。因此，我们需要重新定义算符在求和式中的运算方式。

我们规定：*算符仅作用在其右侧第一个张量元素上*。如果多个元素需要同时被一个算符作用，那么这些元素需要用括号变成一个整体。这也意味着算符在求和式中*不能随意变换位置*。比如：

$ partial_i A^i = sum_(i=1)^m (partial A^i) / (partial x^i) = mathbf(nabla) dot mathbf(A) : M -> RR $

就是我们熟悉的散度运算，最终得到一个标量场。而如果把两个符号换一个位置：

$ A^i partial_i = sum_(i=1)^m A^i partial / (partial x^i) = mathbf(A) dot mathbf(nabla) : C^infinity (M, RR) -> C^infinity (M, RR) $ <eq:directional-derivative>

则是一个标量场到标量场的算符，表示沿着向量 $mathbf(A)$ 的方向导数。有了爱因斯坦记号之后，矢量微积分中的 $mathbf(nabla)$ 算符就可以走进历史的垃圾堆里了，因为使用求和记号可以很方便地将所有矢量算符写成算符求和的形式。在接下来的文章中我们还会介绍另一个用 $nabla$ 记号来标记的算符，这个算符和矢量微积分中的 $mathbf(nabla) = mat(partial_x, partial_y, partial_z)^top$ 没有任何关系，请注意区分。

用上面说的括号规则，导数的乘法法则可以这样写：

$ partial_i (A B) = A partial_i B + B partial_i A $

与我们在微积分中见到的规律类似，如果只要求一个场与 $partial_i$ 交换，那么该场只需不依赖于坐标 $x^i$；如果要求它与所有方向导数都交换，那么它在 $M$ 的每个连通分支上都必须是常值场。

$ A "与" partial_i "交换" <=> partial_i A = 0 $

$ A "与所有方向导数交换" <=> A "在每个连通分支上为常值" $

接下来的推导中我们会用到不少带有算符的求和式，所以请做好准备。

= 向量的平行移动

在前面几篇文章中，我们定义了向量、协向量、以及流形上的度规。现在只要给我们一条流形上的曲线，我们就可以算出这条曲线的长度了。可是，还是有一些概念我们暂时无法定义，比如：弯曲的流形上是否有“直线”？

#figure(
  three-js-figure("/blog/zh/2026-09-10/cow-walk.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [使用 W、A、S、D 控制移动，水平拖拽旋转朝向，按空格键或“Toggle Camera”按钮切换跟随相机与自由相机。轨迹记录了行走路径；每前进一定距离图中就会绘制该点的速度方向向量与切平面。],
) <fig:cow-walk>

与平直空间 $RR^m$ 不同，弯曲空间上每个点都有各自独立的切空间，邻近两点的切空间之间从直观上说应该是有某种关联的。如 @fig:cow-walk 中所示，如果我站在某个光滑流形的一点 $p$ 上一直按住 W 不动，沿着该点切向量的方向往前走，行走过程中不改变自身的朝向，那么我的轨迹会在流形上划出一条路径 $gamma$，其中每个点 $gamma(t)$ 都有各自独立的切空间 $T_(gamma(t)) M$。既然我在行进过程中没有改变我的朝向，那意味着我在 $t=0$ 时刻的朝向 $dot(gamma)(0) in T_(gamma(0)) M$ 一定和我在 $t = 0.01$ 时刻的朝向 $dot(gamma)(0.01) in T_(gamma(0.01)) M$ 有关联，只不过我们目前还没有合适的工具来描述这种关联。

为了能够更深入地研究切空间上如何将一个点的向量移到其他点上，我们需要引入一个新的概念：联络。

假设流形 $M$ 上有一个路径 $gamma : I -> M$，在这个路径上有一个向量场 $X$，满足 $X(t) in T_(gamma(t)) M$。我们暂时将所有这样的向量场的集合记作 $frak(X)(gamma)$。*联络（Connection）*定义了这条路径上的一系列切空间是怎么关联在一起的。

在黎曼流形中，我们通常使用*协变导数（Covariant Derivative）*来表示一个联络。协变导数是一个线性算符 $nabla_dot(gamma) : frak(X)(gamma) -> frak(X)(gamma)$，其几何意义表示：如果我将某个点附近的另一个向量“平移”到该点上，与该点上原本的向量计算变化率，再取极限之后得到的“导数”是多少。

#figure(
  three-js-figure("/blog/zh/2026-09-10/covariant-derivative.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [抛物面 $z = -c (x^2 + y^2)$ 上的平行移动演示：拖动路径上的点可以比较该点的向量场值、平行移动得到的向量以及两者的差 $Delta X$。将 $Delta X$ 除以两点之间的 $Delta t$ 即可近似计算该点的协变导数 $nabla_dot(gamma) X$。],
) <fig:parallel-transport>

@fig:parallel-transport 展示了协变导数的计算方法。一个直观的理解是，假设我们是一只站在流形上的蚂蚁，举着一个箭头沿着某个路径 $gamma$ 往前走。当我们向前走时，手里举着的箭头会自动贴合到流形的表面，而地面上每个点上都有一个各不相同的箭头（即向量场 $X$）。走到相邻的点之后，我们扔掉手上的箭头，再把隔壁的箭头捡起来。最后我们计算地面上这个箭头与我们每次从隔壁搬过来的箭头的变化率 $Delta X$ 除以我们走这段路花费的时间 $Delta t$，取 $Delta t -> 0$ 的极限，就得到了协变导数 $nabla_dot(gamma) X$。

相应地，如果一个向量场 $X in frak(gamma)$ 满足：

$ nabla_dot(gamma) X = 0 $

那么就称向量场 $X$ 上的向量在路径 $gamma$ 上是*平行*的。这一点也比较符合直观——如果我们把路径点 $p$ 上的向量 $X in T_p M$ 移动到路径上的另一个点 $q$ 的向量 $Y in T_q M$ 上，结果二者之间没有任何差别，那么这两个向量就是平行的，记作： $X attach(parallel, br: gamma) Y$

更一般地，如果我们将求导路径 $gamma$ 也当成是协变导数算符的一个参数，那么我们可以认为协变导数算符输入了两个向量场：一个表示求导路径，一个表示被求导的向量场。

$ nabla : frak(X)(M) times frak(X)(M) -> frak(X)(M), (dot(gamma), X) mapsto nabla_dot(gamma) X $ <eq:covariant-derivative-signature>

== 协变导数的性质

那么是任何算符都能作为协变导数吗？并不是。在众多可能的导数算符中，只有满足下面这些性质的算符才能表示“蚂蚁在流形上搬运向量”的直观过程。我们不妨依次看一看这些性质。

=== 线性性

首先，如果我们固定所求导的路径 $gamma$，改变被求导的向量场 $X in frak(X)(gamma)$，我们的直觉告诉我们，如果对两个向量场 $X, Y$ 做线性组合再求导，即 $nabla_dot(gamma)(c_1 X + c_2 Y)$，应该等于两者分别求导后再做线性组合 $c_1 nabla_dot(gamma) X + c_2 nabla_dot(gamma) Y$，即 @asm:covariant-derivative-r-linear。

当然，这里的 $c_1$ 和 $c_2$ 需要是常数，在路径 $gamma$ 的每个点上都需要取同一个常数值。否则的话，$c_1$ 和 $c_2$ 沿着路径的变化也会改变向量场的协变导数——不妨取一个特例，$M = RR^m$，$X$ 是一个常值向量场，$gamma(t) = mat(t, 0, 0, ..., 0)^top$ 是沿着 $+x$ 方向匀速向前的路径。此时显然有 $nabla_dot(gamma) X = 0$；但是，如果这时给 $X$ 乘上一个变化的 $c$，比如取 $c(t) = t$，那么 $c X$ 就是一个变化的向量场，此时再沿着路径 $gamma$ 取协变导数，得到的结果显然就不是 $0$ 了。

#assumption()[
  固定求导路径 $gamma$，协变导数算符 $nabla_(dot(gamma))$ 是 $RR$-线性算符，满足对于任意 $c_1, c_2 in RR$：

  $ nabla_(dot(gamma)) (c_1 X + c_2 Y) = c_1 nabla_(dot(gamma)) X + c_2 nabla_(dot(gamma)) Y $
] <asm:covariant-derivative-r-linear>

如果我们把被求导的向量场 $X$ 固定住，改变求导的路径 $dot(gamma)$ 呢？我们不妨再次回到“蚂蚁搬箭头”的这个比喻中。当固定了向量场 $X$ 不变，那么每个时刻蚂蚁向前走时搬运的向量的变化率应当只取决于蚂蚁当前的速度 $dot(gamma)$，与其他量均无关。同时，搬运向量的变化率也应该是与当前的速度向量线性变化的。比如，如果这只蚂蚁以两倍于之前的速度向前走，那么它搬运的向量变化率就是之前的两倍；如果沿着两个向量方向 $dot(gamma)_1$ 和 $dot(gamma)_2$ 搬运 $X$ 的变化率分别为 $nabla_(dot(gamma)_1) X$ 和 $nabla_(dot(gamma)_2) X$，那么沿着二者之和 $dot(gamma)_1 + dot(gamma)_2$ 的协变导数也应该是 $nabla_(dot(gamma)_1) X + nabla_(dot(gamma)_2) X$。

与之前更改被求导向量场 $X$ 不同，由于 $nabla_(dot(gamma)) X$ 在 $p in M$ 的取值只与点 $p$ 处的 $dot(gamma)$ 相关，与邻近点的 $dot(gamma)$ 都不相关，因此 $nabla$ 关于 $dot(gamma)$ 不仅是 $RR$-线性的，更是 $C^infinity$-线性的——你可以给 $dot(gamma)$ 乘上一个随空间位置变化的光滑函数 $f in C^infinity (M, RR)$，并且把 $f$ 提出来不影响协变导数的计算结果。如下所示：

$
  forall f in C^infinity (M, RR), nabla_(f dot(gamma)) X = f nabla_(dot(gamma)) X
$

可以用一个特例来说明这个假设：假如 $M = RR^m$ 是一个平直空间，$X$ 是一个常值向量场，那么我不论给被求导路径的速度向量 $dot(gamma)$ 乘上什么光滑函数 $f in C^infinity (RR^m, RR)$，所得到的协变导数只可能是 $0$——因为你在从相邻点搬运向量过来时永远会得到相同的向量，不论你的速度有多快。而另一边，如果我给 $X$ 乘上一个随空间位置变化的函数 $f$，那么由于被求导的向量场本身发生了变化，$nabla_(dot(gamma)) (f X)$ 就不一定是 $0$ 了。

再加上之前提出的 $nabla$ 关于 $dot(gamma)$ 满足加法分配律的假设，就得到了 @asm:covariant-derivative-c-inf-linear。

#assumption[
  固定被求导向量场 $Y in frak(X)(M)$，协变导数算符 $nabla_X Y$ 是 $C^infinity$-线性算符，满足

  $ forall f_1, f_2 in C^infinity (M, RR), nabla_(f_1 X_1 + f_2 X_2) Y = f_1 nabla_(X_1) Y + f_2 nabla_(X_2) Y  $
] <asm:covariant-derivative-c-inf-linear>

=== 莱布尼茨法则

莱布尼茨法则可以看作是协变导数的乘法法则，其描述了向量场乘上一个连续函数时其协变导数的表达式。在这里我们先给出莱布尼茨法则的严谨表述：

#assumption[
  （莱布尼茨法则）对于 $M$ 上的协变导数算符 $nabla$ 和求导路径 $dot(gamma)$，若被求导向量场 $X in frak(X)(M)$ 乘上了一个 $M$ 上的标量场 $c in C^infinity (M, RR)$，则有

  $
    nabla_(dot(gamma)) (c X) & = c nabla_(dot(gamma)) X + X(gamma(t)) dif/(dif t) (c compose gamma)(t) \
    & = c nabla_(dot(gamma)) X + X dif c (dot(gamma))
  $
] <asm:leibniz-rule>

不难看出，当 $c$ 取一个常值标量场时，$dif / (dif t) (c compose gamma)(t)$ 恒为 $0$，此时 @asm:leibniz-rule 退化为 @asm:covariant-derivative-r-linear 的数乘部分。但莱布尼茨条件只给出了标量函数乘法下的求导规则，并不能单独推出 $nabla_(dot(gamma)) (X + Y) = nabla_(dot(gamma)) X + nabla_(dot(gamma)) Y$；当 $X$ 和 $Y$ 在各点线性无关时，也不可能把它们统一写成 $Y = c X$。因此，关于被求导向量场的加法分配律仍然需要作为独立假设引入，也就是 @asm:covariant-derivative-r-linear。

实际上，使用 $RR$-线性性（@asm:covariant-derivative-r-linear）并定义 $nabla_(partial_i) partial_j$ 后，就能写出协变导数的一般坐标表达式；引入莱布尼茨条件可以更直接地得到这一表达式。因此，在这里我们暂且将莱布尼茨条件作为一个基本假设引入。

=== 度量兼容性

即使算符满足了 @asm:covariant-derivative-r-linear 和 @asm:covariant-derivative-c-inf-linear 中的两个线性性，仍然有无穷多可能的 $nabla$ 算符：

- $nabla_(dot(gamma)) X = 0$ 满足两个参数的 $RR$- 和 $C^infinity$-线性性，因为所有向量都被映射到零向量场。
- $nabla_(dot(gamma)) X = chevron.l dot(gamma), X chevron.r Y $ 也满足两个参数的 $RR$- 和 $C^infinity$-线性性，其中 $Y in frak(X)(M)$ 是任意 $M$ 上的光滑向量场。由于 $chevron.l dot(gamma), X chevron.r$ 是双线性的，给它乘上任何一个向量场也仍然是双线性的，因此符合条件。

显然，仅有线性性还是不够，我们需要一些更强的约束。考虑到我们的流形 $M$ 是一个黎曼流形，每个点上都定义了一个度规张量，因此一个合理的约束是：当我们将一个切空间中的向量通过平行移动搬到另一个切空间之后，需要*保持两个空间的度规不变*。也就是说，如果向量 $X, Y in T_p M$ 和 $Z, W in T_q M$ 通过路径 $gamma$ 联络，并且满足 $X attach(parallel, br: gamma) Z, Y attach(parallel, br: gamma) W$，那么就有 $chevron.l X, Y chevron.r_p = chevron.l Z, W chevron.r_q$。这个性质被称为流形的*度量兼容性（Metric Compatibility）*，也被称为*黎曼法则*。

$ forall X, Y in T_p M, forall Z, W in T_q M, X attach(parallel, br: gamma) Z, Y attach(parallel, br: gamma) W => chevron.l X, Y chevron.r_p = chevron.l Z, W chevron.r_q $ <eq:metric-compatibility-1>

#figure(
  three-js-figure("/blog/zh/2026-09-10/metric-compatibility.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [球面上的度量兼容性演示：拖动点沿球面移动，红色和绿色向量是一组单位正交基，并按球面联络沿拖拽轨迹平行移动。灰色轨迹记录点的移动路径，每隔固定球面距离留下一个切空间快照。红绿向量各自的长度和两者的内积不会随着拖拽而变化。],
) <fig:metric-compatibility>

一个与之等价的表述是：

#assumption[
  对于任意 $M$ 上的向量场 $Y, Z in frak(X)(M)$ 和路径 $gamma$，都有

  $ dif / (dif t) chevron.l Y(gamma(t)), Z(gamma(t)) chevron.r = chevron.l Y, nabla_dot(gamma) Z chevron.r + chevron.l nabla_dot(gamma) Y, Z chevron.r $ <eq:metric-compatibility>
] <asm:metric-compatibility>

从 @eq:metric-compatibility-1 推导 @asm:metric-compatibility 不难，对于任意 $t$，只需要取一条 $gamma$ 上与 $Y(gamma(t))$ 和 $Z(gamma(t))$ 分别平行的两簇向量，将 $Y$ 和 $Z$ 减去这两簇平行向量，再取极限、忽略掉高次项，即可证明。反过来推导则更简单——如果 $Y$ 和 $Z$ 都是沿着 $gamma$ 平行移动的向量场，那么 @eq:metric-compatibility 右侧的两个协变导数都为 $0$，因此左侧的内积沿着路径保持为常数。

=== 无挠性

最后这个性质可能不太直观，但是它是保证我们能够唯一确定协变导数的一个关键性质。这里直接给出它的表述：

#assumption[
  对于任何向量场 $X, Y in frak(X)(M)$，有

  $ nabla_X Y - nabla_Y X = [X, Y] = X[Y] - Y[X] $

  其中 $X[Y]$ 表示求向量场 $Y$ 沿着 $X$ 方向的路径微分（即 $X[Y] = X^i partial_i (Y^j) partial_j$）。$[X, Y]$ 为两个向量场的李括号。满足这个性质的算符 $nabla$ 被称作*无挠（Torsion Free）*的。
] <asm:torsion-free>

这个性质有一个特例，能够帮助我们更好地理解*挠率*和*无挠性*的概念。

#corollary[
  若联络 $nabla$ 无挠。对于光滑映射 $gamma : RR^2 arrow.r M, (s, t) mapsto gamma(s, t)$，记 $dot(gamma)_s = (partial gamma) / (partial s), dot(gamma)_t = (partial gamma) / (partial t)$。则有：

  $ nabla_(dot(gamma)_s) dot(gamma)_t = nabla_(dot(gamma)_t) dot(gamma)_s $
]

这一点不难证明。

#proof[
  根据无挠性的定义，

  $ nabla_(dot(gamma)_s) dot(gamma)_t - nabla_(dot(gamma)_t) dot(gamma)_s = [dot(gamma)_s, dot(gamma)_t] = dot(gamma)_s [dot(gamma)_t] - dot(gamma)_t [dot(gamma)_s] $ <eq:torsion-free-on-gamma>

  将右侧的路径微分表达式 $dot(gamma)_s [dot(gamma)_t]$ 展开成我们熟悉的分量形式

  $ dot(gamma)_s [dot(gamma)_t] = (partial gamma^i) / (partial s) partial / (partial x^i) (partial gamma^j) / (partial t) partial / (partial x^j) = (partial gamma^j) / (partial s partial t) partial / (partial x^j) $

  另一个路径微分同理。由于 $(partial gamma^j) / (partial s partial t) = (partial gamma^j) / (partial t partial s)$，二者抵消，最终得到 @eq:torsion-free-on-gamma 右侧为0。
]

无挠性可以这样理解：如果我们在任何流形上放一个光滑的二维网格 $gamma$，在网格上任意一点附近，沿着网格的 $s$ 方向去搬运 $t$ 方向上的切向量和沿着网格的 $t$ 方向去搬运 $s$ 方向的切向量会与该点上原本的 $t$ / $s$ 切向量得到相同的差值。

== 协变导数的坐标表示与克氏符号

黎曼几何的一个基本定理就是：上述四个条件能够唯一确定一个协变导数算符。

#theorem[
  给定黎曼流形 $(M, g)$，存在唯一的协变导数算符 $nabla : frak(X)(M) times frak(X)(M) -> frak(X)(M), (X, Y) mapsto nabla_X Y$ 同时满足

  1. 莱布尼茨法则（@asm:leibniz-rule）
  2. 求导路径的 $C^infinity$-线性性（@asm:covariant-derivative-c-inf-linear）
  3. 黎曼法则 / 度量相容性（@asm:metric-compatibility）
  4. 无挠性（@asm:torsion-free）

  且对于任何坐标卡 $(U, phi) in scr(A)$，存在唯一的一组三指标符号 $Gamma^i_(j k)$ 满足：向量场 $Y = Y^i partial_i$ 在路径 $gamma(t)$ 下的协变导数的分量为

  $ nabla_dot(gamma) Y = (partial_j Y^i + Gamma^i_(j k) Y^k) dot(gamma)^j partial_i $ <eq:nabla-expression>

  其中 $Gamma^i_(j k)$ 被称为*克里斯托费尔符号（Christoffel Symbol）*。由这四个性质唯一确定的协变导数算符 $nabla$ 也被称为 *列维-奇维塔联络（Levi-Civita Connection）*。克里斯托费尔符号的数值可以用以下求和式计算：

  $ Gamma^k_(i j) = g^(k l) / 2 ( partial_i g_(j l) + partial_j g_(i l) - partial_l g_(i j) ) $ <eq:christoffel-expression>
] <thm:covariant-derivative-uniqueness>

我们来看一下这个定理怎么证明。

#proof[
  首先，根据 @asm:covariant-derivative-c-inf-linear，我们可以将求导路径向量 $X$ 在坐标卡 $(U_alpha, phi_alpha)$ 上拆成分量形式 $X = X^i partial_i$，则有：

  $ nabla_X Y = nabla_(X^i partial_i) Y = X^i nabla_(partial_i) Y $

  （注意上式中省略了关于 $i$ 的求和符号；可以将 $partial_i$ 看作是坐标卡 $U_alpha$ 上的向量场）

  下一步，根据 $RR$-线性性（@asm:covariant-derivative-r-linear）和莱布尼茨法则（@asm:leibniz-rule），将 $Y$ 拆成分量形式，只不过这次等式右侧变成了两项：

  $
    X^i nabla_(partial_i) Y & = X^i nabla_(partial_i) (Y^j partial_j) \
    & = X^i Y^j nabla_(partial_i) (partial_j) + X^i (dif Y^j)(partial_i) partial_j
  $ <eq:christoffel-derivation-1>

  不难看出，$dif Y^j$ 在基向量 $partial_i$ 方向的分量就是 $(partial Y^j) / (partial x^i) = partial_i Y^j$，因此 @eq:christoffel-derivation-1 可以写成：

  $
    nabla_X Y = X^i nabla_(partial_i) Y = X^i Y^j nabla_(partial_i) (partial_j) + X^i partial_i (Y^j) partial_j
  $ <eq:christoffel-derivation-2>

  由于 $nabla_(partial_i) (partial_j)$ 这一项不依赖我们选取的向量场 $X$ 和 $Y$，而是在该坐标卡上定义的局部对象，我们不妨定义 $nabla_(partial_i) (partial_j)$ 在坐标卡 $(U_alpha, phi_alpha)$ 上的向量分量展开为 $Gamma^k_(i j) partial_k$，则 @eq:christoffel-derivation-2 经过指标名称替换后与 @eq:nabla-expression 一致。

  根据无挠性（@asm:torsion-free），当 $i != j$ 时，取 $gamma(s, t)$ 为第 $i$ 个坐标等于 $s$、第 $j$ 个坐标等于 $t$、其余坐标固定的截面；$i = j$ 时结论显然。因此有 $nabla_(partial_i) (partial_j) = nabla_(partial_j) (partial_i)$，即：

  $ Gamma^k_(i j) = Gamma^k_(j i) $ <eq:christoffel-torsion-free>

  为了证明 $Gamma^k_(i j)$ 的唯一性以及得到 $Gamma^k_(i j)$ 的具体表达式，我们不妨将黎曼法则用坐标分量展开。$dif / (dif t) chevron.l Y(gamma(t)), Z(gamma(t)) chevron.r$ 实际上就是标量场 $chevron.l Y, Z chevron.r$ 在路径 $gamma$ 上的方向导数，而我们又知道方向导数的坐标展开就是 $dot(gamma)^i partial_i$。取 $dot(gamma) = X$，根据#link("/zh/posts/2026-08-22/diff-geometry/", "上一篇文章")对度规张量的定义，有：

  $ chevron.l Y, Z chevron.r = g_(i j) Y^i Z^j $

  代入 @asm:metric-compatibility，有

  $ X^i partial_i (g_(j k) Y^j Z^k) = g_(i j) Y^i (Gamma^j_(k l) X^k Z^l + X^k partial_k Z^j ) + g_(i j) Z^i (Gamma^j_(k l) X^k Y^l + X^k partial_k Y^j ) $

  使用偏导数的乘法法则展开上式左侧

  $ X^i partial_i (g_(j k) Y^j Z^k) = X^i (g_(j k) Y^j partial_i Z^k + g_(j k) Z^k partial_i Y^j + Y^j Z^k partial_i g_(j k)) $

  与右侧抵消后得到：

  $ X^i Y^j Z^k partial_i g_(j k) = g_(i j) Y^i Gamma^j_(k l) X^k Z^l + g_(i j) Z^i Gamma^j_(k l) X^k Y^l $

  对右侧两项做指标替换并应用 @eq:christoffel-torsion-free 后得到：

  $ X^i Y^j Z^k partial_i g_(j k) = X^i Y^j Z^k g_(j l) Gamma^l_(i k) + X^i Y^j Z^k g_(k l) Gamma^l_(i j) $ <eq:christoffel-derivation-3>

  注意此处的向量场 $X$, $Y$ 和 $Z$ 都是我们任选的。不妨记 $Gamma_(k i j) = g_(k l) Gamma^l_(i j)$，为了让 @eq:christoffel-derivation-3 对任意的 $X$, $Y$ 和 $Z$ 都成立，必然有：

  $ Gamma_(j i k) + Gamma_(k i j) = partial_i g_(j k) $

  结合 @eq:christoffel-torsion-free，做一些简单的代数变换，不难证明：

  $ Gamma_(k i j) = 1/2 (partial_i g_(j k) + partial_j g_(i k) - partial_k g_(i j)) $

  由于 $g^(i j)$ 与 $g_(i j)$ 互为对方的逆，将上式与 $g^(k l)$ 缩并后得到：

  $ Gamma^k_(i j) = g^(k l) Gamma_(l i j) = g^(k l) / 2 (partial_i g_(j k) + partial_j g_(i k) - partial_k g_(i j)) $
]

我们之前看到过 $nabla_X Y$ 是一个关于 $X$ 和 $Y$ 的算符，其值同时取决于我们选取的向量场 $X$ 和 $Y$。@thm:covariant-derivative-uniqueness 告诉我们，在任何坐标卡 $(U_alpha, phi_alpha)$ 中，协变导数可以被拆分成两项：$X^i partial_i Y^j partial_j$ 表示向量场 $Y$ 的各个分量沿着 $X$ 的方向导数；$Gamma^k_(i j) X^i Y^j partial_k$ 描述沿方向 $X$ 平行移动时坐标基向量的变化，具体改变幅度就是 $nabla_(partial_i) (partial_j) = Gamma^k_(i j) partial_k$。需要注意，克氏符号依赖于坐标系的选取；即使流形本身是平直的，在曲线坐标下也可能非零。因此它表示的是联络在当前坐标下的局部表示，而不是空间的内在弯曲；真正的弯曲需要用曲率张量描述。

== 克氏符号的坐标变换

注意到我之前一直将克氏符号 $Gamma^k_(i j)$ 称作“符号”，而向量分量 $X^i$、协向量分量 $omega_i$、度规张量 $g_(i j)$ 这些量则被称为“张量”。这是因为，克氏符号虽然也写成一个符号加上上下标的形式，但是它的坐标变换规则与一般张量的变换规则不同。

从之前的几篇文章中我们知道，如果有两个坐标卡 $(U_alpha, phi_alpha) = (U_alpha, x^1, x^2, dots.c, x^m)$ 和 $(U_beta, phi_beta) = (U_beta, tilde(x)^1, tilde(x)^2, dots.c, tilde(x)^m)$ 同时覆盖了流形 $M$ 上的一点 $p$，那么张量的各个分量在这两个坐标卡之间的变换规则很简单——逆变指标乘上 $(partial tilde(x)^j) / (partial x^i)$，协变指标乘上 $(partial x^j) / (partial tilde(x)^i)$ 即可。比如向量、协向量和度规张量的变换都符合上述规则：

$ tilde(X)^i = (partial tilde(x)^i) / (partial x^j) X^j $

$ tilde(omega)_i = (partial x^j) / (partial tilde(x)^i) omega_j $

$ tilde(g)_(i j) = (partial x^k) / (partial tilde(x)^i) (partial x^l) / (partial tilde(x)^j) g_(k l) $

而克氏符号呢？既然我们已经有了克氏符号的定义，不妨做一些简单的推导。

#theorem[
  （克氏符号的坐标变换）对于 $M$ 上覆盖点 $p$ 的两个坐标卡 $(U_alpha, phi_alpha) = (U_alpha, x^1, x^2, dots.c, x^m)$ 和 $(U_beta, phi_beta) = (U_beta, tilde(x)^1, tilde(x)^2, dots.c, tilde(x)^m)$，记 $U_alpha$ 上的克氏符号为 $Gamma^k_(i j)$、$U_beta$ 上的克氏符号为 $tilde(Gamma)^k_(i j)$，则二者之间有如下换算关系：

  $ tilde(Gamma)^k_(i j) = (partial x^l) / (partial tilde(x)^i) (partial x^m) / (partial tilde(x)^j) (partial tilde(x)^k) / (partial x^n) Gamma^n_(l m) + (partial tilde(x)^k) / (partial x^l) (partial^2 x^l) / (partial tilde(x)^i partial tilde(x)^j) $ <eq:christoffel-coordinate-transform>
]

#proof[
  根据克氏符号的定义，

  $
    tilde(Gamma)^k_(i j) tilde(partial)_k & = nabla_(tilde(partial)_i) (tilde(partial)_j) \
    & = nabla_((partial x^l) / (partial tilde(x)^i) partial_l) ((partial x^m) / (partial tilde(x)^j) partial_m)
  $

  根据莱布尼茨法则和 $C^infinity$-线性性，有：

  $
    tilde(Gamma)^k_(i j) tilde(partial)_k & = (partial x^l) / (partial tilde(x)^i) nabla_(partial_l) ((partial x^m) / (partial tilde(x)^j) partial_m) \
    & = (partial x^l) / (partial tilde(x)^i) ((partial x^m) / (partial tilde(x)^j) nabla_(partial_l) partial_m + partial / (partial x^l) (partial x^m) / (partial tilde(x)^j) partial_m) \
    &= (partial x^l) / (partial tilde(x)^i) ((partial x^m) / (partial tilde(x)^j) Gamma^n_(l m) partial_n + partial / (partial x^l) (partial x^n) / (partial tilde(x)^j) partial_n)
  $ <eq:christoffel-coordinate-transform-derivation-1>

  等式左侧的 $tilde(Gamma)^k_(i j) tilde(partial)_k$ 可以变形为：

  $ tilde(Gamma)^k_(i j) tilde(partial)_k = tilde(Gamma)^k_(i j) (partial x^n) / (partial tilde(x)^k) partial_n $

  带回 @eq:christoffel-coordinate-transform-derivation-1 并在两边同时乘上 $(partial tilde(x)^a) / (partial x^n)$ 后得到：

  $ (partial tilde(x)^a) / (partial x^n) (partial x^n) / (partial tilde(x)^k) tilde(Gamma)^k_(i j) partial_n = (partial tilde(x)^a) / (partial x^n) (partial x^l) / (partial tilde(x)^i) ((partial x^m) / (partial tilde(x)^j) Gamma^n_(l m) + partial / (partial x^l) (partial x^n) / (partial tilde(x)^j)) partial_n $

  $ tilde(Gamma)^a_(i j) = (partial tilde(x)^a) / (partial x^n) (partial x^l) / (partial tilde(x)^i) (partial x^m) / (partial tilde(x)^j) Gamma^n_(l m) + (partial tilde(x)^a) / (partial x^n) (partial^2 x^n) / (partial tilde(x)^i partial tilde(x)^j) $
]

也就是说，除了一般的张量变换中都会有的 $(partial x^l) / (partial tilde(x)^i) (partial x^m) / (partial tilde(x)^j) (partial tilde(x)^k) / (partial x^n) Gamma^n_(l m)$ 这一项以外，克氏符号的坐标变换还多了一个二阶导项 $(partial tilde(x)^k) / (partial x^l) (partial^2 x^l) / (partial tilde(x)^i partial tilde(x)^j)$。这是因为切向量和度规张量这些张量的分量在每个点上都能直接变换，只需要坐标变换的一阶导数；而根据 @eq:christoffel-expression，克氏符号是由度规的一阶导数构造出来的，因此它的坐标变换会涉及坐标变换函数的二阶导数，不能像张量分量那样只乘雅可比矩阵。

= 测地线——流形上的直线

之前我们定义过，当一个沿着路径 $gamma$ 的向量场 $X in frak(X)(gamma)$ 满足 $nabla_(dot(gamma)) X = 0$ 时，向量 $X$ 沿着路径 $gamma$ 平行。

回到之前在牛的表面上行走的例子（@fig:cow-walk）。如果我按住 W 不动，最终我会在牛上画出一条路径来，我们也说了这条路径某种意义上来说可以当作是弯曲空间中的“直线”。现在有了平行移动这个数学工具，我们就可以描述这条路径所具有的性质了：这条路径 $gamma$ 的每个点上的速度向量 $dot(gamma)$ 沿着路径 $gamma$ 本身都是平行的。据此，我们可以给出以下定义：

#definition[
  当流形 $M$ 上的曲线 $gamma$ 满足 $nabla_(dot(gamma)) dot(gamma) = 0$ 时，这条曲线就被称为流形上的一个*测地线（Geodesic）*。
]

测地线有一个很好的性质：测地线任何一点的切向量都是等长的。这一点可以直接通过度量兼容性证明。

#theorem[
  若 $gamma: I -> M$ 是黎曼流形 $(M, g)$ 上的一个测地线，那么有 $forall t in I, ||dot(gamma)|| = chevron.l dot(gamma), dot(gamma) chevron.r$ 是常数。
] <thm:geodesics-tangent-magnitude-constant>

#proof[
  由度量兼容性（@asm:metric-compatibility），有：

  $ dif / (dif t) chevron.l dot(gamma)(t), dot(gamma)(t) chevron.r = 2 chevron.l dot(gamma), nabla_(dot(gamma)) dot(gamma) chevron.r = 0 $

  因此 $chevron.l dot(gamma)(t), dot(gamma)(t) chevron.r$ 不随 $t$ 变化。
]

根据协变导数的定义，对于一个给定的流形 $M$，计算测地线时我们需要解下面这个测地线方程：

$ nabla_(dot(gamma)) dot(gamma) = (dot(gamma)^i partial_i dot(gamma)^k + Gamma^k_(i j) dot(gamma)^i dot(gamma)^j) partial_k = 0 $ <eq:geodesics-equation-1>

如果我们只考虑 $gamma$ 在坐标卡 $(U_alpha, phi_alpha)$ 上的分量（即曲线 $(x^1 (t), x^2 (t), dots.c, x^m (t)) = (phi_alpha compose gamma)(t)$），那么 @eq:geodesics-equation-1 也可以变形为

$ (dif^2 x^k) / (dif t^2) + Gamma^k_(i j) (dif x^i) / (dif t) (dif x^j) / (dif t) = 0 $ <eq:geodesics-equation-2>

== 例子：球面上的测地线

不妨来看一个具体的例子。假设我们想要计算球面 $S^2 = {r in RR^3 | ||r||_2 = 1}$ 上从某点出发的测地线。不妨采用球极坐标系 $(theta, phi) mapsto (sin theta cos phi, sin theta sin phi, cos theta)$ 作为我们的坐标卡。

上一篇文章已经算过，在这个坐标系下，球面的度规为

$ g = dif theta^2 + sin^2 theta dif phi^2 $

也就是说，$g_(theta theta) = 1$、$g_(phi phi) = sin^2 theta$，其余分量为 $0$。相应地，逆度规就是

$ g = partial_theta^2 + 1 / (sin^2 theta) partial_phi^2 $

根据 @eq:christoffel-expression，需要计算的非零克氏符号为

$ Gamma^theta_(phi phi) = 1/2 g^(theta theta) (partial_phi g_(phi theta) + partial_phi g_(theta phi) - partial_theta g_(phi phi)) = -sin theta cos theta $

$ Gamma^phi_(theta phi) = Gamma^phi_(phi theta) = cot theta $

其余分量均为 $0$。设 $gamma(s) = (theta(s), phi(s))$ 是测地线，将其代入测地线方程（@eq:geodesics-equation-2），可以得到

$
  (dif^2 theta) / (dif s^2) - sin theta cos theta ((dif phi) / (dif s))^2 &= 0 \
  (dif^2 phi) / (dif s^2) + 2 cot theta (dif theta) / (dif s) (dif phi) / (dif s) &= 0
$ <eq:sphere-geodesic-equations>

第二个方程可以改写为

$
  dif / (dif s) (sin^2 theta (dif phi) / (dif s))
  = sin^2 theta ((dif^2 phi) / (dif s^2) + 2 cot theta (dif theta) / (dif s) (dif phi) / (dif s))
  = 0
$

因此

$ L = sin^2 theta (dif phi) / (dif s) $ <eq:sphere-angular-momentum>

是一个常数。

我们先处理简单情形 $L = 0$。由于在坐标卡内 $sin theta != 0$，@eq:sphere-angular-momentum 表明 $(dif phi) / (dif s) = 0$。代入 @eq:sphere-geodesic-equations 的第一个方程，得到 $(dif^2 theta) / (dif s^2) = 0$，因此 $theta(s) = a s + b$，而 $phi$ 保持为常数。不难看出这条曲线是球面上的一条经线。

接下来考虑 $L != 0$ 的情形。此时 $(dif phi) / (dif s) != 0$，可以把 $theta$ 看成 $phi$ 的函数。令

$ u(phi) = cot (theta(phi)) $

则由 @eq:sphere-angular-momentum 可知 $(dif phi) / (dif s) = L (1 + u^2)$，并且

$
  (dif u) / (dif phi) & = -csc^2(theta(phi)) (dif theta) / (dif phi) \
  & = - 1 / (sin^2 (theta(phi)) (dif phi) / (dif s)) (dif theta) / (dif s) \
  & = - 1 / (sin^2 (theta(phi)) L/(sin^2 (theta(phi)))) (dif theta) / (dif s) \
  & = -1/L (dif theta) / (dif s)
$

把这两个关系代入 @eq:sphere-geodesic-equations 的第一个方程，可以得到

$ (dif phi) / (dif s) dif / (dif phi) (-L (dif u) / (dif phi)) - u / (1 + u^2) ((dif phi) / (dif s))^2 = 0 $

化简后得

$ (dif^2 u) / (dif phi^2) + u = 0 $

因此

$ u(phi) = A cos phi + B sin phi $ <eq:sphere-cot-solution>

其中 $A$ 和 $B$ 是常数。由于球面上的点可以写成 $r = (sin theta cos phi, sin theta sin phi, cos theta) = (x, y, z)$，将 @eq:sphere-cot-solution 两边乘上 $sin theta$，就得到

$ z = cos theta = A sin theta cos phi + B sin theta sin phi = A x + B y $

这正是一个经过原点的平面。它与单位球面的交集是一条大圆，因此 $L != 0$ 时的测地线都是大圆。结合 $L = 0$ 时的经线情形，可知球面上的测地线恰好就是所有大圆。
