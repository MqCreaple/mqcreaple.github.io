// title: 微分几何1：微分流形
// summary: 微分流形的定义、图卡与图集、向量。
// tags: mathematics, differential-geometry
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, theorem, definition, proof, cetz-canvas
#import "@preview/cetz:0.3.4"

#show: article.with(
  title: "微分几何1：微分流形",
  lang: "zh",
)

最近这段时间的实习里接触了不少网格上的计算几何问题，其中用到了不少微分几何的知识，令我实在有些力不从心。因此，我打算开启一个新的系列文章，不仅作为我自己学习微分几何的笔记，也希望用交互图表的方式更加直观地展示微分几何中的很多抽象概念。

前置知识：一些基础的拓扑学（不用太深入，知道一些常用概念即可，如开集、闭集、连续函数等）。

= 从流形说起

如果我们想要描述一个平直的空间，比如一个平面或者一个三维欧几里得空间，那么使用我们熟悉的向量和矩阵就足够了。比如，平面上天然定义了直线和直线之间的平行关系，那么只要任选两个不平行的方向，给平面画上网格，我们就有了一个坐标系，相应的也就有了坐标系上的向量，以及向量的加法和数乘运算。

微分几何研究的对象则不局限于平直空间。比如，我们可以考虑一个球面：能否用合适的数学工具来描述球面上的曲线、向量等数学对象？更进一步呢，任意形状的曲面行不行？@fig:manifold-0 给出了几个例子，这几个例子都是二维曲面，曲面都有不同形式的弯曲，导致我们很难在这些曲面上定义诸如“直线”或者“向量”这些概念。

#figure(
  three-js-figure("/blog/zh/2026-08-08/manifold-0.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [四个流形的例子，从左到右分别为：球面、环面、莫比乌斯环、光滑的牛。]
) <fig:manifold-0>

但是注意到一点，以上的这几个例子都有一个很好的性质。如果你是一只蚂蚁，在上面这几个几何结构上爬，那么只要你足够小，你所看到的表面就和一个平面没有任何区别。我们将具有这样性质的曲面定义为*流形*。

#figure(
  three-js-figure("/blog/zh/2026-08-08/cow-walk.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [在牛这个流形上行走的演示：一个小人沿曲面上的（近似）测地线移动，相机从身后跟随，使得局部曲面看起来像一个平面。使用 W、A、S、D 控制移动，水平拖拽旋转朝向。],
) <fig:cow-walk>

#definition[
  一个*流形*$M$ 是一个点集，满足任何 $p in M$ 都有一个邻域同胚于一个欧几里得空间 $RR^m$ 的开子集。其中 $m$ 被称为流形 $M$ 的*维度*。
] <def:manifold-rough>

我们也可以举出一些反例，比如下面这些东西就不是流形，因为这些图案上存在某些不同构于平直欧氏空间的点。比如，十字交叉图案上，交叉点附近的区域同时和四个方向的平面相邻，因此这些区域不可能同构于欧氏空间。

#figure(
  three-js-figure("/blog/zh/2026-08-08/manifold-1.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [一些流形的反例。图中红色区域标注了图案上不同构于欧氏空间的区域。]
)

@def:manifold-rough 从直观上很合理，可是，什么是“邻域”？什么又是“开子集”？这就需要用到一些拓扑学知识了。为了让点与点之间的相邻关系有定义，我们需要在 $M$ 的基础上添加一个*拓扑* $cal(O) subset.eq cal(P)(M)$。

除此之外，我们还需要给每一个点的邻域定义一个到 $RR^m$ 的同胚。也就是说，我们需要找一系列开集 $\{ U_alpha \}_(alpha in A) subset.eq cal(O)$，并给其中的每个开集 $U_alpha$ 定义一个到 $RR^m$ 子集的拓扑同胚，不妨将这个函数记作 $phi_alpha$。这个 $U_alpha$ 和 $phi_alpha$ 元组的集合就被称为一个*图册（Atlas）*，每一个单独的 $(U_alpha, phi_alpha)$ 被称为一个*坐标卡（Chart）*。对于 $p in U_alpha$，$phi_alpha$ 将 $p$ 映射到了一个向量 $phi_alpha(p) in RR^m$，这个向量也被称为这个点的*坐标*。

注意到我们只需要选取 $cal(O)$ 的一个子集来作为 $\{ U_alpha \}$ 即可，只要这个子集覆盖了流形 $M$ 上的每个点（即 $\{ U_alpha \}$ 构成 $M$ 的一个*开覆盖*）。比如，一个球面可以用下面这种方式用四个开集来覆盖：

#figure(
  three-js-figure("/blog/zh/2026-08-08/atlas-on-sphere.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [四个开集覆盖了整个球面，这四个开集和其映射函数定义了一个球面的图册 $scr(A)$。地理中通常使用这种方式来绘制地球地图。]
)

注意到，坐标卡与坐标卡之间是可以重叠的，一个点可以同时被多个坐标卡覆盖。那么这也就意味着，同一个点在不同的坐标卡上会有不同的坐标。这导致坐标卡之间有时会需要进行换算，如 @fig:chart-transition 所示：

#figure(
  cetz-canvas({
    import cetz.draw: *

    // Manifold M
    rect((0, 5.5), (13, 11.5))
    content((0.5, 11.8), [$M$], anchor: "west")

    // Charts U_alpha and U_beta (a Venn-like overlap)
    circle((4.5, 8.5), radius: (2.5, 1.5))
    circle((8.5, 8.5), radius: (2.5, 1.5))
    content((4.5, 10.5), [$U_alpha$])
    content((8.5, 10.5), [$U_beta$])

    // Images in R^m at the bottom of M
    circle((3, 1.5), radius: 1.1)
    circle((10, 1.5), radius: 1.1)
    content((3, 0.0), [$Omega_alpha subset.eq RR^m$])
    content((10, 0.0), [$Omega_beta subset.eq RR^m$])

    // Chart maps
    line((4.5, 7.0), (3, 2.7), mark: (end: ">"))
    content((3.0, 4.8), [$phi_alpha$])
    line((8.5, 7.0), (10, 2.7), mark: (end: ">"))
    content((10.0, 4.8), [$phi_beta$])

    // Transition map between the images
    line((4.5, 1.5), (8.5, 1.5), mark: (start: ">", end: ">"))
    content((6.5, 2.5), [$phi_beta compose phi_alpha^(-1)$])
    content((6.5, 0.5), [$phi_alpha compose phi_beta^(-1)$])
  }),
  caption: [两个坐标卡 $(U_alpha, phi_alpha)$ 与 $(U_beta, phi_beta)$ 之间的换算函数为 $phi_beta compose phi_alpha^(-1)$ 或者 $phi_alpha compose phi_beta^(-1)$，有时也简写为 $phi_(beta alpha)$ 和 $phi_(alpha beta)$。]
) <fig:chart-transition>

一般来说，微分流形要求任何两个相交的坐标卡之间的换算函数必须是一个光滑函数，否则的话很多微分性质都会变得不好。

据此我们可以提出“流形”的一个更严谨的定义：

#definition[
  （流形的严格定义）一个 *微分流形* 是一个三元组 $(M, cal(O), scr(A))$。其中

  1. $cal(O) subset.eq cal(P)(M)$ 是 $M$ 上的所有开集，$(M, cal(O))$ 构成一个拓扑。
  2. $scr(A) = lr(\{ (U_alpha, phi_alpha) \})_(alpha in A)$，其中 $\{ U_alpha \}_(alpha in A) subset.eq cal(O)$ 是 $M$ 的一个*开覆盖*，即

     $ union.big_(alpha in A) U_alpha = M $

     且 $phi_alpha: U_alpha arrow.r Omega_alpha, (Omega_alpha subset.eq RR^m)$ 是一个拓扑同胚。
  3. 对于任意点 $p in M$ 的开邻域 $p in U in cal(O)$，若存在 $alpha, beta$ 使得 $U subset.eq U_alpha$ 且 $U subset.eq U_beta$，则函数 $phi_beta compose phi_alpha^(-1)$ 是一个光滑函数（*$C^infinity$ 兼容*）。 
] <def:manifold>

= 流形上的路径和向量

众所周知，平直欧几里得空间上的向量被定义为两个点之间的位移。向量加法可以用平行四边形法则来算，且向量的值不依赖于起始位置，我们可以把向量在平面上任意平移而向量的值不变。但是，弯曲流形上不像平直空间那样有现成的三角形和平行四边形结构，因此无法直接将两点的位移定义为一个向量（因为这样的向量无法在流形上平移）。那么，我们该怎么定义流形上的“向量”呢？

既然我们无法定义位移向量，流形上的每个点附近都有一个到平直空间 $RR^m$ 的同胚，流形上每个点的局部都可以定义一个类似“速度向量”的概念，称作*切向量*。

在定义一个点附近的切向量之前我们需要先定义流形上“路径”的概念。

#definition[
  流形 $M$ 上的*路径* $gamma$ 为区间 $I subset.eq RR$ 到 $M$ 的连续函数，且在任意点 $t in I$ 以及任意覆盖 $gamma(t)$ 的坐标卡 $(U_alpha, phi_alpha)$ 上都有：函数 $(phi_alpha compose gamma)$ 在 $t$ 处光滑。
]

由于 $M$ 自身是一个拓扑空间，“连续性”有定义是显然的。对于微分流形要求的更强一些的“光滑性”，我们可以用坐标映射和 $RR^m$ 现成的性质来定义它。这种依赖坐标映射将一个不好定义/不好计算的量映射到欧氏空间中的方法你还会在之后反复看到。

有了“路径”的概念之后，我们该怎么描述路径上某点处的切线呢？一个自然的想法是，对于路径 $gamma$ 和路径上的点 $gamma(t) = p$，只要能找到一个覆盖 $p$ 邻域的坐标卡 $(U_alpha, phi_alpha)$，那么就可以用坐标映射 $phi_alpha$ 把 $gamma$ 给映射到我们熟悉的欧氏空间中（即函数 $phi_alpha compose gamma$）。再之后该怎么计算切线相信大家都了解了：只需要求该函数在 $t$ 点附近的导数即可。不过这个定义有一个问题：最后我们计算出来的导数 $(phi_alpha compose gamma)'(t) in RR^m$ 的数值依赖于我们选取的坐标卡，如果我们选择了一个不同的坐标卡，算出来的导数也会不一样。有没有什么办法能够让切向量的定义不依赖于坐标卡呢？

既然我们计算切向量需要用坐标映射，而我们又不希望切向量依赖于坐标卡的选取，那么不妨将“在某点切向量相同的路径集合”本身定义为该点的切向量。

#definition[
  对于所有满足 $gamma(0) = p$ 的路径集合，定义等价关系 $gamma_1 ~ gamma_2$ 为：

  $ exists (U_alpha, phi_alpha) in scr(A), p in U_alpha and lr(dif / (dif t) phi_alpha (gamma_1(t)) |)_(t = 0) = lr(dif / (dif t) phi_alpha (gamma_2(t)) |)_(t = 0) $

  记路径 $gamma$ 在 $~$ 关系下的等价类为 $[gamma]$。
]

这个定义中同样使用了坐标卡来将路径在某点处的切向量变成一个可比较的量。@thm:equiv-independent-from-chart 证明了只要两条路径在某个坐标卡里的切向量相等，那么在任意覆盖了该点的坐标卡里这两条路径的切向量都相等。也就是说，等价关系 $~$ 实际上不依赖于具体的坐标卡，而是一个路径之间的固有属性。这就避免了之前定义中切向量依赖于坐标卡选取的问题。

#theorem[
  若路径 $gamma_1$ 和 $gamma_2$ 满足 $gamma_1 (0) = gamma_2 (0) = p in M$，且存在坐标卡 $(U_alpha, phi_alpha) in scr(A)$ 满足

  1. $p in U_alpha$
  2. $lr(dif / (dif t) phi_alpha (gamma_1(t)) |)_(t = 0) = lr(dif / (dif t) phi_alpha (gamma_2(t)) |)_(t = 0)$

  那么对于任意的包含点 $p$ 的坐标卡 $(U_beta, phi_beta)$ 都有：

  $ lr(dif / (dif t) phi_beta (gamma_1(t)) |)_(t = 0) = lr(dif / (dif t) phi_beta (gamma_2(t)) |)_(t = 0) $
] <thm:equiv-independent-from-chart>

#proof[
  设 $(U_alpha, phi_alpha)$ 到 $(U_beta, phi_beta)$ 的换算函数为 $phi_(beta alpha)$，则有如下关系：

  $ phi_beta (gamma_1(t)) = phi_(beta alpha) (phi_alpha (gamma_1(t))) $

  由于 $phi_(beta alpha)$ 和其逆函数 $phi_(alpha beta) = phi_(beta alpha)^(-1)$ 均为光滑函数，该函数的雅可比矩阵 $J_(phi_(beta alpha))$ 有定义且可逆，因此有如下关系：

  $ dif / (dif t) phi_beta (gamma_1(t)) = J_(phi_(beta alpha)) dif / (dif t) phi_alpha (gamma_1(t)) $

  若已知如下关系：
  
  $ lr(dif / (dif t) phi_alpha (gamma_1(t)) |)_(t = 0) = lr(dif / (dif t) phi_alpha (gamma_2(t)) |)_(t = 0) $
  
  两边左乘雅可比矩阵之后得到：
  
  $ lr(dif / (dif t) phi_beta (gamma_1(t)) |)_(t = 0) = lr(dif / (dif t) phi_beta (gamma_2(t)) |)_(t = 0) $
]

最后，只需要将 $[gamma]$ 定义为 $gamma$ 的切向量即可。

#definition[
  路径 $gamma: I arrow.r M$ 在点 $t = 0$ 处的*切向量*为该点在 $~$ 关系下的等价类，记作：

  $ dot(gamma)(0) = [gamma] $

  对于 $t eq.not 0$ 的情形，记 $gamma_1(tau) = gamma(tau + t)$，则有 $dot(gamma)(t) = dot(gamma)_1(0)$。
]

#definition[
  对于点 $p in M$，称该点的*切空间*为所有从该点出发的路径等价类 $[gamma]$ 的集合，记作 $T_p M$。
]

= 切空间的性质

不难证明，对于 $m$ 维流形 $M$ 和点 $p in M$，切空间 $T_p M$ 上可以不依赖具体的坐标卡来定义向量加法和数乘运算，因此可以证明 $T_p M$ 同构于一个标准向量空间 $RR^m$。这里就把证明过程留给读者了。

#definition[
  对于 $M$ 上从 $p$ 出发的路径 $gamma_1, gamma_2, gamma_3$，若在某个包含 $p$ 的坐标卡 $(U_alpha, phi_alpha)$ 下有如下关系：

  $ c_1 lr(dif / (dif t) (phi_alpha compose gamma_1)(t) |)_(t = 0) + c_2 lr(dif / (dif t) (phi_alpha compose gamma_2)(t) |)_(t = 0) = lr(dif / (dif t) (phi_alpha compose gamma_3)(t) |)_(t = 0) $

  则可以定义三条路径的切向量在 $T_p M$ 上满足关系

  $ c_1 dot(gamma)_1(t) + c_2 dot(gamma)_2(t) = dot(gamma)_3(t) $
] <def:vector-ops-on-tangent-space>

#theorem[
  @def:vector-ops-on-tangent-space 不依赖坐标卡的选取，且用 @def:vector-ops-on-tangent-space 中的向量加法和数乘运算构造的向量空间 $T_p M$ 同构于 $RR^m$。
]

但是注意一点，对于不同的点 $p eq.not q$，$T_p M$ 和 $T_q M$ 是两个不同的向量空间：$T_p M$ 里的两个向量可以相加，$T_q M$ 同理，但是一个 $T_p M$ 和一个 $T_q M$ 上的向量不能相加。这一点与平直空间不同：欧氏空间里的向量不依赖起始点，因此不同的两个点的切空间也可以认为是同一个 $RR^m$ 向量空间。

#figure(
  three-js-figure("/blog/zh/2026-08-08/tangent-spaces.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [球面上两个点 $p$ 和 $q$ 处的切空间 $T_p M$ 和 $T_q M$。用鼠标拖拽点可以在球面上移动它，其切平面和向量会随之变化。],
) <fig:tangent-spaces>

在某个空间中的每个点上再叠加一个新的空间的数学结构有一个专门的名字，叫*纤维丛（Fibre Bundle）*。更具体地说，流形 $M$ 上面的所有切空间 $T_p M$ 构成的集合是 $M$ 的*切丛（Tangent Bundle）*，记作 $T M$。$T M$ 本身也可以看作是一个 $2 m$ 维的流形。不过有关纤维丛的内容更偏数学理论了，研究物理或者工程大概用不到这些内容。

= 流形上的微分

有了切空间的概念，接下来就可以研究流形到流形的映射了。

#definition[
  对于 $m$ 维流形 $M$ 和 $n$ 维流形 $N$，若函数 $f: M arrow.r N$ 满足：对于任意点 $p in M$，存在 $M$ 上的坐标卡 $(U, phi)$ 和 $N$ 上的坐标卡 $(V, psi)$，使得

  1. $ p in U, f(p) in V $
  2. $(psi compose f compose phi^(-1))$ 是一个光滑函数。

  则称映射 $f$*光滑*。
] <def:smooth>

由于 $(psi compose f compose phi^(-1))$ 的定义域和值域为欧氏空间 $RR^m$ 和 $RR^n$ 的子集，这个函数的光滑性是已经有定义的。这个定义其实同样是把一般流形的性质用坐标卡变成我们熟悉的欧氏空间中的性质。

使用与 @thm:equiv-independent-from-chart 相同的方法，不难证明将 @def:smooth 的“存在”换成“任意”仍然成立，因为表达式 $(psi compose f compose phi^(-1))$ 的左右两侧都可以复合上任何坐标变换函数。

对于光滑函数 $f$，可以定义函数的微分 $dif f$：

#definition[
  对于流形 $M$、$N$ 以及光滑映射 $f: M arrow.r N$，对 $M$ 上任何一点 $p$ 均可以定义 $f$ 在该点上的*微分*。

  $ dif f_p : T_p M arrow.r T_(f(p)) N $

  满足：任何 $[gamma] in T_p M$，$dif f_p ([gamma]) = [f(gamma)]$。
] <def:differentiation>

至于为什么 $M$ 上的路径等价类 $[gamma]$ 经过映射之后仍然是流形 $N$ 上的等价类，这一点可以通过 $(psi compose f compose phi^(-1))$ 的雅可比矩阵来证明。具体证明过程在此省略了。同时也可以用雅可比矩阵来说明 $dif f$ 是一个线性函数。

== 特殊情形的流形微分

根据之前的推论，欧几里得空间 $RR^m$ 的切空间仍然是 $RR^m$ 本身，并且欧几里得空间在不同的点上都共享同一个切空间。当 @def:differentiation 中的 $M$ 取 $RR^m$、$N$ 取 $RR^n$ 时，$dif f_p$ 就是一个 $RR^m$ 到 $RR^n$ 的线性映射。同时不难发现，此时我们定义的 $dif f_p$ 就是 $f$ 在 $p$ 点的雅可比矩阵。

其实这个平直空间的特例可以帮助我们理解一般流形间映射的微分：对于一般的流形 $M$ 和 $N$，$p$ 点的微分映射 $dif f$ 可以看作是 $p$ 点和 $f(p)$ 点附近这两个近似欧氏空间的向量空间的某种“雅可比矩阵”——一个不严谨的比喻是，当点 $p_1$ 从点 $p$ 位移一个无穷小的向量之后，$dif f_p$ 将 $M$ 上的“切向量” $(p_1 - p)$ 映射到了 $N$ 上的“切向量” $(f(p_1) - f(p))$。

如果 $M$ 和 $N$ 中一个是一般的流形、另一个是欧氏空间呢？比如，取 $N = RR^m$，此时函数 $f : M arrow.r RR^m$ 就可以理解为 $M$ 的一个坐标卡。这时，$dif f_p$ 的作用就是将 $T_p M$ 上的向量映射到坐标卡所表示的坐标空间中。反过来，如果 $M = RR^n$ 是一个欧氏空间，那么 $f$ 就是一个坐标映射的逆映射，$dif f$ 的功能就是将 $p$ 点上某个切向量的坐标表示给映射回 $T_f(p) N$ 空间中。

如果 $N = RR$，即 $f : M arrow.r RR$ 是流形 $M$ 上的一个单值函数，此时 $dif f_p : T_p M arrow.r RR$ 在 $M$ 上的每个点都定义了一个 $T_p M$ 空间到 $RR$ 的线性映射。这个东西叫*协向量（Covector / Covariant Vector）*，而 $dif f$ 所表示的协向量场又叫*微分1-形式（Differential 1-Form）*。这两个概念我们下一篇文章再详细说明。

== 流形微分的性质

回忆一下我们高中学过的导数性质：

1. 导数算符是线性的。$ (c_1 f + c_2 g)'(x) = c_1 f'(x) + c_2 g'(x) $
2. 反函数的导数是原函数导数的倒数。$ (f^(-1))'(f(x)) = 1 / (f'(x)) $
3. 复合函数的导数满足链式法则。$ (g compose f)(x) = g'(f(x)) dot.c f'(x) $
4. 函数 $f(x) = x$ 的微分处处为$1$。

到了大学，学过多元函数微积分之后，你又会看到：

1. 雅可比矩阵是线性的。$ J_(c_1 mathbf(f) + c_2 mathbf(g))(mathbf(p)) = c_1 J_mathbf(f) (mathbf(p)) + c_2 J_mathbf(g) (mathbf(p)) $
2. $mathbf(f) : RR^n arrow.r RR^n$ 映射若在 $mathbf(p)$ 点局部可逆，则其逆映射 $mathbf(f)^(-1)$ 的雅可比矩阵为原映射雅可比的逆矩阵。 $ J_(mathbf(f)^(-1)) (mathbf(f)(mathbf(p))) = (J_mathbf(f) (mathbf(p)))^(-1) $
3. 复合函数的雅可比矩阵满足链式法则。$ J_(mathbf(g) compose mathbf(f))(mathbf(p)) = J_mathbf(g) (mathbf(f)(mathbf(p))) J_mathbf(f) (mathbf(p)) $
4. 自反函数 $id(mathbf(p)) = mathbf(p)$ 的雅可比矩阵为单位矩阵 $I$。

这三条性质都可以在流形微分运算中找到对应。如下所示：

#theorem[
  （微分算符是线性的）对于流形 $M$ 和 $N$ 间的光滑映射 $f, g : M arrow.r N$，有：

  $ dif (c_1 f + c_2 g)_p = c_1 dif f_p + c_2 dif g_p $
]

#theorem[
  （逆映射的微分）对于流形 $M$ 和 $N$ 间的光滑映射 $f : M arrow.r N$，有：

  $ dif (f^(-1))_(f(p)) = (dif f)^(-1)_p $
]

#theorem[
  （复合映射的微分）对于流形 $M$、$N$、$P$，以及光滑映射 $f : M arrow.r N$ 和 $g : N arrow.r P$，有：

  $ dif (g compose f)_p = dif g_(f(p)) compose dif f_p $
]

#theorem[
  （自反映射的微分）映射 $id_M : M arrow.r M, p arrow.r.bar p$ 的微分为：

  $ dif id_M = id_(T_p M) $
]

上述四条性质使用 $p$ 点附近的坐标映射都不难证明，此处就留作练习了。不难发现，一元函数的微分和多元函数的微分都可以看作是上面四个定理的特例——$RR^m arrow.r RR^n$ 的线性映射就是矩阵，而逆映射和复合映射就对应着矩阵的逆和矩阵相乘，而这在 $m = n = 1$ 时又退化为实数的倒数和乘法。
