// title: 微分几何6：李代数和旋转
// summary: 用李括号表示交换关系，探讨在旋转群上的应用。
// tags: mathematics, differential-geometry, lie-algebra, robotics
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, plotly-figure, theorem, definition, proof, example, corollary, assumption, lemma, cetz-canvas, diagram
#import "@preview/cetz:0.5.2"
#import "@preview/fletcher:0.5.8": node, edge

#show: article.with(
  title: "李代数和旋转",
  lang: "zh",
)

本文作为#link("/zh/posts/2026-09-25/lie-group/", "“微分几何5：李群和李代数”")的延续，前半部分先补充一下上一章没讲完的内容，后半部分则尝试以 $S O(3)$ 群为例来从李代数的角度解释许多三维旋转中的现象。

上次说到，一个李群 $G$ 就是一个具有群结构的微分流形，而李代数 $frak(g)$ 则是李群 $G$ 单位元 $e in G$ 的切空间，二者之间可以通过指数映射 $exp : frak(g) -> G$ 建立联系。指数映射不一定是单射，也不一定是满射。对于 $RR^(n times n)$ 的子群，其指数映射就是矩阵指数运算。

李群 $G$ 是一个弯曲的流形，在数学上非常难处理，而李代数 $frak(g)$ 作为一个向量空间则相对来说要好处理很多。$frak(g)$ 上已经定义了向量的加法和数乘运算，那么这些运算是否能够对应到李群上呢？

之前我们提到过向量数乘在指数映射下的含义。若 $v in frak(g)$，则 $v$ 有左不变向量场 $V : frak(X)(G)$，而 $exp(t v)$ 就是向量场 $V$ 过单位元 $e$ 的积分路径（也叫一个*向量流*）。根据左不变向量场的性质，如果我们对整个流形 $G$ 左乘 $exp(v)$，那么左不变向量场仍然不变，而单位元则从 $e$ 变换到了 $exp(v)$。此时我们在变换后的空间中再向前走一个单位时间，就会到达 $exp(v) dot exp(v)$。而由于左乘 $exp(v)$ 不会改变左不变向量场 $V$，因此这个点也可以看作是从原点出发向前走两个单位时间：

$ exp(2 v) = exp(v) dot exp(v) $

换句话说，$exp(2 v)$ 就是将 $exp(v)$ 通过李群的乘法作用上自己一次之后的结果。更进一步，

$ forall n in NN, exp(n v) = exp(v) dot exp(v) dot dots.c dot exp(v) = exp(v)^n $ <eq:exponent-of-scalar-product>

同时，如果我们取 $exp(v)^(-1)$ 的左乘变换，可以证明

$ exp(-v) = exp(v)^(-1) $

换句话说 @eq:exponent-of-scalar-product 里的 $n$ 可以扩展到整数域。其中正数的次方就是将群元素反复作用在自身上，而负数次方则是将群元素的逆元反复作用在自身上。

到目前为止，这些性质似乎非常符合我们对指数函数的印象。那么我们不妨推测一下，向量加法的指数是否也符合我们熟悉的规律？

$ exp(u + v) eq.quest exp(u) exp(v) $

显然，这个规律不可能成立，因为左侧式子中的 $u$ 和 $v$ 是对称的（因为向量空间 $frak(g)$ 上有加法交换律），而右侧式子中的 $u$ 和 $v$ 并不对称。如果这个规律成立的话那就意味着任何李群都是交换群了。我们也可以举个具体的反例，在 $G L(2, RR)$ 群上，

$ exp(mat(0, 1; 0, 0)) = mat(1, 1; 0, 1), exp(mat(0, 0; 1, 0)) = mat(1, 0; 1, 1) $

而

$ exp(mat(0, 1; 1, 0)) = mat(cosh 1, sinh 1; sinh 1, cosh 1) != mat(1, 1; 1, 0) mat(1, 0; 1, 1) $

既然李代数上两个元素的加法不能直接变成李群上的乘法。那么，李群上有哪些其它操作能够和李代数上的操作对应吗？

= 再看李括号

我们仔细思考一下：$exp(u + v)$ 和 $exp(u) exp(v)$ 分别代表什么含义？显然，前者表示沿着 $u + v$ 的左不变向量场向前走一个单位时间到达的点，而后者可以看作是先沿着 $u$ 的左不变向量场向前走一个单位时间，接着再沿着 $v$ 的左不变向量场走一个单位时间。在平直空间上这两条路径显然会到达同一个点，而在弯曲的流形 $G$ 上，这可就不一定了。

#figure(
  cetz-canvas({
    import cetz.draw: *
    let red = rgb("#ef4444")
    let green = rgb("#22c55e")
    let yellow = rgb("#eab308")
    let surface-edge = rgb("#64748b")

    // Four curved edges give G a curved, rectangular-ish silhouette.
    bezier((-1.0, -0.8), (8.7, -0.4), (2.0, -1.4), (6.8, 0.2), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((8.7, -0.4), (8.4, 5.0), (9.6, 1.0), (9.1, 4.0), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((8.4, 5.0), (-1.0, 4.5), (6.8, 5.8), (2.4, 5.4), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((-1.0, 4.5), (-1.0, -0.8), (-1.8, 3.0), (-1.7, 0.5), stroke: (paint: surface-edge, thickness: 1pt))
    content((8.1, 4.55), [$G$])

    // A broad, tilted tangent plane centered at e, large enough for all three vectors.
    line(
      (-0.45, -0.45), (3.75, 0.25), (4.45, 4.45), (0.25, 3.75),
      close: true,
      fill: rgb("#bfdbfe").transparentize(38%),
      stroke: (paint: rgb("#3b82f6"), thickness: 0.8pt),
    )
    content((0.65, 0.35), [$frak(g) = T_e G$])

    // Tangent vectors u, v, and u+v at the identity.
    line((2.0, 2.0), (3.35, 2.25), mark: (end: ">"), stroke: (paint: red, thickness: 1.5pt))
    line((2.0, 2.0), (2.25, 3.35), mark: (end: ">"), stroke: (paint: green, thickness: 1.5pt))
    line((2.0, 2.0), (3.60, 3.60), mark: (end: ">"), stroke: (paint: yellow, thickness: 1.7pt))
    // Dashed copies of u and v show the parallelogram rule for vector addition.
    line((3.35, 2.25), (3.60, 3.60), stroke: (paint: green.transparentize(15%), thickness: 0.65pt, dash: "dashed"))
    line((2.25, 3.35), (3.60, 3.60), stroke: (paint: red.transparentize(15%), thickness: 0.65pt, dash: "dashed"))
    content((3.32, 2.06), text(fill: red)[$u$])
    content((1.83, 3.40), text(fill: green)[$v$])
    content((3.24, 3.84), text(fill: yellow)[$u + v$])

    // The exponential-product paths on G. The two final points are close,
    // but distinct, to suggest the noncommutative correction.
    bezier((2.0, 2.0), (5.0, 2.3), (3.0125, 2.1875), (4.35, 2.65), mark: (end: ">"), stroke: (paint: red, thickness: 1.7pt))
    bezier((5.0, 2.3), (5.35, 4.85), (5.1875, 3.3125), (5.45, 4.15), mark: (end: ">"), stroke: (paint: green, thickness: 1.7pt))
    bezier((2.0, 2.0), (4.75, 4.75), (3.2, 3.2), (4.45, 4.1), mark: (end: ">"), stroke: (paint: yellow, thickness: 1.9pt))

    // Identity and endpoint markers.
    circle((2.0, 2.0), radius: 0.065, fill: black, stroke: none)
    circle((5.0, 2.3), radius: 0.055, fill: red, stroke: none)
    circle((4.75, 4.75), radius: 0.055, fill: yellow, stroke: none)
    circle((5.35, 4.85), radius: 0.055, fill: green, stroke: none)
    content((1.65, 2.2), [$e$])
    content((5.0, 1.98), text(fill: red)[$exp(u)$])
    content((3.8, 5.0), text(fill: yellow)[$exp(u + v)$])
    content((6.1, 5.15), text(fill: green)[$exp(u) exp(v)$])
  }),
  caption: [左侧切平面上的 $u$、$v$ 与 $u + v$，以及李群流形上的对应路径。红色路径先沿 $u$ 到达 $exp(u)$，绿色路径再沿 $v$ 的左不变向量场到达 $exp(u) exp(v)$；黄色路径沿 $u + v$ 到达 $exp(u + v)$。两个终点通常不重合。]
) <fig:exp-of-u-v-and-u-plus-v>

那么，如何描述这两条路径终点之间的差距呢？这就要说到之前我们提过一句但是没有细讲的一个概念了：李括号。

回顾一下。

#definition[
  对于流形 $M$ 和流形上的向量场 $X, Y : frak(X)(M)$，定义二者的*李括号（Lie Bracket）* $[X, Y]$（也叫*李导数（Lie Derivative）* $cal(L)_X Y$）满足对于任意流形上的场 $f : C^infinity (M, RR)$：

  $ [X, Y](f) = cal(L)_X Y = X(Y(f)) - Y(X(f)) $

  其中 $X(f)$ 表示函数 $f$ 沿着向量场 $X$ 的方向导数。
] <def:lie-bracket-on-manifold>

如果你看完这个定义觉得哪里怪怪的，这也正常——因为 $X(Y(f)) - Y(X(f))$ 是一个向量场这件事情其实并不显然。可是怎么证明它是否是一个向量场呢？由于这里对 $[X, Y]$ 的定义只和它的方向导数有关，因此为了证明它确实是一个向量场，我们就要抛弃掉#link("/zh/posts/2026-08-08/diff-geometry/", "第一篇文章")里的符合几何直觉的向量场定义，而是改成使用代数方法的向量场定义。即：$M$ 上的向量场等价于 $M$ 上的一个方向导数算符。有了这个定义，我们可以使用莱布尼茨法则来检查李括号是否符合方向导数的定义。

#theorem[
  两个向量场的李括号 $[X, Y]$ 符合莱布尼茨条件，即对于任意光滑函数 $f, g : C^infinity (M, RR)$，有

  $ [X, Y](f g) = f [X, Y](g) + g [X, Y](f) $
]

#proof[
  $
    [X, Y](f g) =& X(Y(f g)) - Y(X(f g)) \
    =& X(f Y(g) + g Y(f)) - Y(f X(g) + g X(f)) \
    =& (f X(Y(g)) + X(f)Y(g)) + (g X(Y(f)) + X(g)Y(f)) \
    &- (f Y(X(g)) + Y(f)X(g)) - (g Y(X(f)) + Y(g)X(f)) \
    =& (f X(Y(g)) - f Y(X(g))) + (g X(Y(f)) - g Y(X(f))) \
    =& f [X, Y](g) + g [X, Y](f)
  $
]

比较巧的是，$X(Y(f))$ 和 $Y(X(f))$ 两者单独拿出来都不是向量场，但是相减之后能够将所有无关项全部消掉，留下来的量竟然就变成了一个向量场。如果你第一次看到这个结论可能会感到惊讶，不过我们应当选择相信数学推导给出的结论。

我们讲了半天李括号的定义，可是它究竟和我们一开始提出的两个路径端点之差有什么关系？不妨来看看下面的几何解释。

== 李括号的几何解释

当然，李括号也可以用一种更直观的方法来理解。定义 $phi.alt_t^X (p)$ 为向量场 $X$ 过 $p$ 的流。也就是说：

$ dif / (dif t) phi.alt_t^X (p) = X_(phi.alt_t^X (p)) $

那么观察下面这个路径：从起点 $p$ 开始，先沿着 $X$ 流一小段时间 $dif t$、再沿着 $Y$ 流 $dif t$、再沿着 $-X$ 流 $dif t$、最后再沿着 $-Y$ 流 $dif t$。此时，取 $dif t -> 0$ 的极限，我们到达的终点距离起点就会越来越近，可以用一个 $T_p M$ 上的向量来描述二者之间的位移。

$ rho_t (p) = phi.alt^(-Y)_t compose phi.alt^(-X)_t compose phi.alt^Y_t compose phi.alt^X_t (p) $ <eq:flow-definition-of-commutator>

如果你将上式展开的话，你会发现 $rho_t(p)$ 与 $p$ 点的位移可以近似于 $X(Y) - Y(X) = [X, Y]$。值得注意的是，当 $t -> 0$ 时，$rho_t (p)$ 趋向 $p$ 的速率是 $t^2$ 级别的，因此这里直接取 $rho_t$ 关于时间的导数的话只会得到 $0$。

$ rho_t (p) = p + [X, Y] t^2 + O(t^3) $

注：上述记号并不严谨，因为一般来说不能将流形上的点和其切空间上的向量直接相加。也可以额外假设 $M$ 是一个嵌入在欧氏空间 $RR^n$ 中的流形，这样上面的加法可以理解为被嵌入的 $RR^n$ 空间上的向量加法，这样这个公式就有数学意义了。

#figure(
  cetz-canvas({
    import cetz.draw: *
    let red = rgb("#ef4444")
    let green = rgb("#22c55e")
    let yellow = rgb("#eab308")
    let ink = rgb("#334155")
    let surface-edge = rgb("#64748b")

    // A curved, unfilled boundary suggests the manifold G around the loop.
    bezier((-1.45, -1), (7.92, -0.77), (1.25, -1.82), (5.6, -0.02), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((7.92, -0.77), (7.77, 6.65), (9.05, 1.55), (7.1, 4.93), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((7.77, 6.65), (-1.38, 6.28), (5.22, 7.7), (1.02, 5.9), stroke: (paint: surface-edge, thickness: 1pt))
    bezier((-1.38, 6.28), (-1.45, -1), (-2.13, 3.65), (-0.48, 0.88), stroke: (paint: surface-edge, thickness: 1pt))
    content((6.7, 6.1), [$M$])

    // The four short flows form an almost-closed commutator loop.
    bezier((1.6, 1.1), (5.0, 2.0), (2.7, 1.0), (4.25, 1.75), mark: (end: ">"), stroke: (paint: red, thickness: 1.8pt))
    bezier((5.0, 2.0), (5.8, 4.7), (5.3, 2.9), (5.9, 4.0), mark: (end: ">"), stroke: (paint: green, thickness: 1.8pt))
    bezier((5.8, 4.7), (2.2, 4.3), (4.8, 4.9), (3.4, 4.05), mark: (end: ">"), stroke: (paint: red, thickness: 1.8pt))
    bezier((2.2, 4.3), (2.05, 1.55), (1.9, 3.4), (2.3, 2.3), mark: (end: ">"), stroke: (paint: green, thickness: 1.8pt))

    // The yellow chord emphasizes the small residual displacement.
    line((1.6, 1.1), (2.05, 1.55), mark: (end: ">"), stroke: (paint: yellow, thickness: 2pt))
    circle((1.6, 1.1), radius: 0.065, fill: ink, stroke: none)
    circle((2.05, 1.55), radius: 0.06, fill: ink, stroke: none)
    content((0.95, 0.95), [$p$])
    content((2.55, 1.55), [$rho_t(p)$])
    content((3.35, 0.92), text(fill: red)[$phi.alt_t^X$])
    content((5.85, 3.0), text(fill: green)[$phi.alt_t^Y$])
    content((3.88, 3.95), text(fill: red)[$phi.alt_t^(-X)$])
    content((1.55, 2.82), text(fill: green)[$phi.alt_t^(-Y)$])
    content((0.6, 1.5), text(fill: yellow)[$approx [X, Y] t^2$])
  }),
  caption: [依次沿 $X$、$Y$、$-X$ 和 $-Y$ 的流走一小段时间后，路径不会完全闭合；黄色箭头表示终点相对起点的微小位移，在 $t -> 0$ 时趋近于 $[X, Y] t^2$。]
) <fig:lie-derivative-1>

可以这样粗略地理解：两条红色的路径之差近似为 $-X(p + Y t) dot t + X(p) dot t approx -Y(X)  t^2$，而两条绿色的路径之差近似为 $Y(p + X t) dot t - Y(p) dot t approx X(Y) t^2$，因此绕四条路径一圈之后就会回到 $(X(Y) - Y(X)) t^2 = [X, Y] t^2$。

一个与上述定义等价的定义是：若 $phi.alt^X_t (p)$ 表示向量场 $X$ 的流，那么李括号 $[X, Y]$ 在某点 $p$ 上的值就是向量场 $Y$ 经过 $phi.alt^X_t$ 映射前拉到 $p$ 上之后求导的结果。

$ lr(cal(L)_X Y |)_p = lr(dif / (dif t) ((phi.alt_t^X)^*_p Y_(phi.alt_t^X (p))) |)_(t = 0) $

相当于我们把路径 $phi.alt^X_t (p)$ 上在 $p$ 点附近的 $Y$ 全部通过流函数“拽”到了同一个点 $p$ 上，将这个向量场变成一个 $T_p M$ 上的向量函数，这样就可以对它求导了。这也是为什么李括号也被叫做李导数。

#figure(
  cetz-canvas({
    import cetz.draw: *
    let green = rgb("#22c55e")
    let pulled-1 = rgb("#86efac")
    let pulled-2 = rgb("#4ade80")
    let pulled-3 = rgb("#15803d")
    let yellow = rgb("#eab308")
    let flow-color = rgb("#64748b")
    let grid-color = rgb("#94a3b8").transparentize(20%)
    let map-color = rgb("#334155")
    let manifold-edge = rgb("#64748b")

    // Curved, unfilled boundary around the entire Lie derivative illustration.
    bezier((-0.4, 0.4), (11.0, 0.3), (2.3, -0.2), (8.3, 0.8), stroke: (paint: manifold-edge, thickness: 1pt))
    bezier((11.0, 0.3), (10.9, 5.5), (11.7, 2.0), (11.4, 4.5), stroke: (paint: manifold-edge, thickness: 1pt))
    bezier((10.9, 5.5), (-0.3, 5.45), (8.2, 6.2), (2.5, 5.9), stroke: (paint: manifold-edge, thickness: 1pt))
    bezier((-0.3, 5.45), (-0.4, 0.4), (-1.0, 3.8), (-0.9, 1.5), stroke: (paint: manifold-edge, thickness: 1pt))
    content((10.45, 5.1), [$M$])

    // Apply the same local square grid through an affine matrix at each point.
    let draw-grid = (cx, cy, width, height, a, b, c, d, color) => {
      let map = (u, v) => (cx + a * u + b * v, cy + c * u + d * v)
      for i in range(5) {
        let s = i / 4 - 0.5
        let u = s * width
        let v = s * height
        line(map(u, -height / 2), map(u, height / 2), stroke: (paint: color, thickness: 0.55pt))
        line(map(-width / 2, v), map(width / 2, v), stroke: (paint: color, thickness: 0.55pt))
      }
    }

    let p = (1.65, 3.7)
    let q1 = (4.2, 3.25)
    let q2 = (6.6, 2.7)
    let q3 = (9.0, 2.1)
    let A1 = (1.02, 0.08, 0.03, 0.98)
    let A2 = (1.06, 0.18, 0.12, 0.9)
    let A3 = (1.12, 0.3, 0.2, 0.78)
    // Choose pullbacks in p1, p2, p3 order, then push them forward by A_i.
    let pull1 = (0.15, 0.8)
    let pull2 = (0.4, 0.72)
    let pull3 = (0.7, 0.65)
    let y1 = (A1.at(0) * pull1.at(0) + A1.at(1) * pull1.at(1), A1.at(2) * pull1.at(0) + A1.at(3) * pull1.at(1))
    let y2 = (A2.at(0) * pull2.at(0) + A2.at(1) * pull2.at(1), A2.at(2) * pull2.at(0) + A2.at(3) * pull2.at(1))
    let y3 = (A3.at(0) * pull3.at(0) + A3.at(1) * pull3.at(1), A3.at(2) * pull3.at(0) + A3.at(3) * pull3.at(1))

    // The grid at p uses the identity matrix. Sample grids use matrices
    // progressively farther from identity as the flow moves away from p.
    draw-grid(p.at(0), p.at(1), 1.8, 1.8, 1, 0, 0, 1, rgb("#64748b"))
    draw-grid(q1.at(0), q1.at(1), 1.55, 1.55, A1.at(0), A1.at(1), A1.at(2), A1.at(3), grid-color)
    draw-grid(q2.at(0), q2.at(1), 1.55, 1.55, A2.at(0), A2.at(1), A2.at(2), A2.at(3), grid-color)
    draw-grid(q3.at(0), q3.at(1), 1.55, 1.55, A3.at(0), A3.at(1), A3.at(2), A3.at(3), grid-color)

    // One extended cubic flow curve; p and q1, q2, q3 lie on this curve.
    bezier((0.8, 3.80485), (9.8, 1.90119), (3.8, 3.33181), (6.8, 2.65093), mark: (end: ">"), stroke: (paint: flow-color, thickness: 1.2pt))

    // Green arrows show Y at p and at each sampled point.
    line(p, (1.55, 4.58), mark: (end: ">"), stroke: (paint: green, thickness: 1.8pt))
    line(q1, (q1.at(0) + y1.at(0), q1.at(1) + y1.at(1)), mark: (end: ">"), stroke: (paint: pulled-1, thickness: 1.8pt))
    line(q2, (q2.at(0) + y2.at(0), q2.at(1) + y2.at(1)), mark: (end: ">"), stroke: (paint: pulled-2, thickness: 1.8pt))
    line(q3, (q3.at(0) + y3.at(0), q3.at(1) + y3.at(1)), mark: (end: ">"), stroke: (paint: pulled-3, thickness: 1.8pt))

    // Pull back each local vector with the inverse of its grid matrix A_i.
    // The pulled vectors use the same shades as their corresponding Y(p_i).
    line(p, (p.at(0) + pull1.at(0), p.at(1) + pull1.at(1)), mark: (end: ">"), stroke: (paint: pulled-1, thickness: 1.8pt))
    line(p, (p.at(0) + pull2.at(0), p.at(1) + pull2.at(1)), mark: (end: ">"), stroke: (paint: pulled-2, thickness: 1.8pt))
    line(p, (p.at(0) + pull3.at(0), p.at(1) + pull3.at(1)), mark: (end: ">"), stroke: (paint: pulled-3, thickness: 1.8pt))

    // Join the vector tips as a curve of pulled-back values, extended at both ends.
    bezier((1.25, 4.64), (1.55, 4.58), (1.35, 4.63), (1.45, 4.59), stroke: (paint: pulled-3, thickness: 1.1pt))
    bezier((1.55, 4.58), (1.8, 4.5), (1.64, 4.55), (1.72, 4.52), stroke: (paint: pulled-3, thickness: 1.1pt))
    bezier((1.8, 4.5), (2.05, 4.42), (1.89, 4.47), (1.97, 4.44), stroke: (paint: pulled-3, thickness: 1.1pt))
    bezier((2.05, 4.42), (2.35, 4.35), (2.15, 4.4), (2.25, 4.37), stroke: (paint: pulled-3, thickness: 1.1pt))
    bezier((2.35, 4.35), (2.72, 4.24), (2.48, 4.32), (2.62, 4.27), stroke: (paint: pulled-3, thickness: 1.1pt))

    // The tangent at Y_p is the flow derivative, i.e. the Lie derivative.
    line((1.55, 4.58), (2.12, 4.45), mark: (end: ">"), stroke: (paint: yellow, thickness: 2pt))

    for point in (p, q1, q2, q3) {
      circle(point, radius: 0.055, fill: map-color, stroke: none)
    }
    content((1.25, 3.52), [$p$])
    content((3.92, 2.86), [$p_1$])
    content((6.22, 2.28), [$p_2$])
    content((8.62, 1.68), [$p_3$])
    content((4.5, 4.26), text(fill: pulled-1)[$Y_(p_1)$])
    content((7.15, 3.72), text(fill: pulled-2)[$Y_(p_2)$])
    content((10.05, 2.92), text(fill: pulled-3)[$Y_(p_3)$])
    content((5.25, 2.55), text(fill: flow-color)[$phi.alt_t^X$])
    content((2.05, 5.02), text(fill: yellow)[$lr(cal(L)_X Y |)_p = [X, Y]_p$])
  }),
  caption: [灰色曲线表示 $X$ 的流，周围逐渐发生线性变形的网格表示流对局部空间的作用。绿色向量 $Y$ 沿流被拉回到 $T_p M$ 后，其端点形成一条曲线；黄色箭头是这条曲线在 $Y_p$ 处的切向量，即李导数 $lr(cal(L)_X Y |)_p = [X, Y]_p$。]
) <fig:lie-derivative-2>

注意区分李导数 $cal(L)_X Y$ 与协变导数 $nabla_X Y$。二者同样是将不同位置的向量通过某种方式“拽”到同一个切空间上来求导，但是二者“拽”的方式不一样。协变导数依赖于空间上定义的联络 $nabla$，通过联络来平移向量时只需要考虑向量移动的路径，不需要考虑路径各点附近空间的形变；而李导数在任何光滑流形上都有定义、不需要联络，通过流 $phi.alt^X_t$ 的拉回操作来将空间各点上的向量映射到同一点，而如果 $X$ 的流扭曲了某点 $p_1$ 局部的空间，用它将该点的向量 $Y_(p_1)$ 拉回到 $p$ 点时这个向量会需要做一步反向的变换。这也是为什么协变导数只与 $Y$ 沿着 $X$ 的方向导数相关，而李导数同时与 $X(Y)$ 和 $Y(X)$ 相关。

$ nabla_X Y = X^i partial_i Y^j partial_j + Gamma^k_(i j) X^i Y^j partial_k $

$ cal(L)_X Y = X^i partial_i Y^j partial_j - Y^i partial_i X^j partial_j $

== 李括号的性质

根据 @def:lie-bracket-on-manifold，不难证明以下几条性质：

#theorem[
  （反对称性）
  
  $ [X, Y] = -[Y, X] $
] <thm:lie-bracket-antisymmetry>

#corollary[
  $ [X, X] = 0 $
]

根据方向导数的线性性，也不难证明以下等式：

#theorem[
  （雅可比恒等式）

  $ [X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0 $
] <thm:jacobi-identity>

如果我们考虑两个流形 $M$ 与 $N$ 之间的微分同胚 $F: C^infinity (M, N)$，可以证明，$F$ 映射也保持了两个流形上的李括号结构。即：$M$ 上两个向量场 $X$ 和 $Y$ 的李括号经过 $F$ 映射到 $N$ 上，与 $X$ 和 $Y$ 分别映射到 $N$ 上再做李括号是一样的。

#theorem[
  对于光滑映射 $F: C^infinity (M, N)$，有

  $ F_* [X, Y] = [F_* X, F_* Y] $
] <thm:diffeomorphism-preserve-lie-bracket>

#proof[
  取 $M$ 上的点 $p$，根据方向导数的定义，有

  $ X(f)_p = dif f_p (X_p) $

  将场 $f$ 推前至流形 $N$ 上，得到 $(f compose F^(-1)) : C^infinity (N, RR)$。对其取 $F_* X$ 在点 $q in N$ 上的方向导数有：

  $
    (F_* X)(f compose F^(-1))_q &= dif (f compose F^(-1))_q (F_* X)_q \
    &= dif f_(F^(-1)(q)) compose (dif F^(-1))_q compose (dif F)_(F^(-1) (q)) (X_(F^(-1)(q))) \
    &= dif f_(F^(-1)(q)) (X_(F^(-1)(q))) \
    &= (X(f))_(F^(-1)(q)) \
    &= (X(f) compose F^(-1))_q
  $

  取 $g = f compose F^(-1)$ 为 $N$ 上的一个光滑函数，则有

  $ (F_* X)(g) = (X(g compose F)) compose F^(-1) $

  取 $g$ 关于 $[F_* X, F_* Y]$ 的方向导数，有

  $
    [F_* X, F_* Y](g) &= (F_* X)((F_* Y)(g)) - (F_* Y)((F_* X)(g)) \
    &= (F_* X)(Y(g compose F) compose F^(-1)) - (F_* Y) (X(g compose F) compose F^(-1)) \
    &= X(Y(g compose F)) compose F^(-1) - Y(X(g compose F)) compose F^(-1) \
    &= [X, Y](g compose F) compose F^(-1) \
    &= (F_* [X, Y])(g)
  $

  由于 $g$ 可以任意选取，上述结论可以证明原命题。
]

为什么我们需要关心微分同胚保持李括号的结构呢？因为接下来我们就要用这个结论来把李群的向量场上的李括号变成一个李代数 $frak(g)$ 上的结构。

== 李代数上的李括号

如果我们研究的对象不是一般的微分流形而是一个李群，那么 @thm:diffeomorphism-preserve-lie-bracket 也可以应用到李群的左乘变换上。不难证明：

#corollary[
  若 $X, Y : frak(X)(G)$ 为李群 $G$ 上的左不变向量场，则 $[X, Y]$ 也是左不变向量场。
] <cor:lie-bracket-closed-on-left-invariant-fields>

#proof[
  任取元素 $g in G$，$L_g : G -> G$ 是 $G$ 到自身的微分同胚。应用 @thm:diffeomorphism-preserve-lie-bracket，有：

  $ (L_g)_* [X, Y] = [(L_g)_* X, (L_g)_* Y] = [X, Y] $

  因此 $[X, Y]$ 左不变。
]

而我们又知道，李群 $G$ 上的左不变向量场同构于李代数 $frak(g)$，因此，我们可以给李代数 $frak(g)$ 上也定义一个李括号运算，而 @cor:lie-bracket-closed-on-left-invariant-fields 表明李括号操作在 $frak(g)$ 上是封闭的。

自此，我们可以给出李代数的严格定义：

#definition[
  向量空间 $frak(g)$ 以及 $frak(g)$ 上的二元运算 $[dot, dot]: frak(g) times frak(g) -> frak(g)$ 被称作*李代数（Lie Algebra）*，其中 $[dot, dot]$ 为李代数上的*李括号（Lie Bracket）*，满足：

  - 双线性：
    $ forall a, b in RR, [a x + b y, z] = a [x, z] + b [y, z] $
    $ forall a, b in RR, [x, a y + b z] = a [x, y] + b [x, z] $
  - 反对称性：
    $ [x, y] = -[y, x] $
  - 雅可比恒等式
    $ [x, [y, z]] + [y, [z, x]] + [z, [x, y]] = 0 $
] <def:lie-algebra>

#definition[
  李群 $G$ 的李代数 $(frak(g), [dot, dot]) = "Lie"(G)$ 是所有 $G$ 上的左不变向量场构成的集合，其李括号为左不变向量场的李括号。
] <def:lie-algebra-of-lie-group>

不难看出，$G$ 上的左不变向量场与 $T_e G$ 同构，因此这个定义与上一章中给出的 $frak(g) = T_e G$ 是等价的。我们可以将李群 $G$ 上的左不变向量场的李括号运算映射到 $frak(g)$ 上，从而给 $frak(g)$ 上定义一个李括号运算。

在之前我们没有给切空间 $frak(g)$ 上添加李括号这个代数结构时，$frak(g)$ 只是一个向量空间。显然我们无法仅通过一个平直的向量空间来还原出所属李群的弯曲结构。比如，一个平面和一个二维环面的切空间都同构于 $RR^2$，不可能只通过观察这个向量空间来推导出其所属的李群的结构。但是加上李括号之后就不一样了：由于光滑向量场的李括号 $[dot, dot] : G times G -> G$ 描述了李群 $G$ 上空间局部的弯曲性质，而李代数上的李括号 $[dot, dot] : frak(g) times frak(g) -> frak(g)$ 也将这个性质部分保留了下来。

事实上，可以证明，对于任何满足 @def:lie-algebra 的李代数 $frak(g)$ 都存在一个连通且单连通的李群 $tilde(G)$，使得 $"Lie"(tilde(G)) = frak(g)$。任何拥有相同李代数结构的李群都可以看作是 $tilde(G)$ 的某种变换。比如，如果允许李群不连通的话，可以给 $tilde(G)$ 乘上任何离散群；如果允许李群不单连通的话，可以给 $tilde(G)$ 和任何离散正规子群做商。这个定理的证明比较复杂#strike[而且我不会]，所以就留给感兴趣的读者自行探索了。

== Baker-Campbell-Hausdorff 定理

回到 @fig:exp-of-u-v-and-u-plus-v 上。有了李括号这个工具，我们就可以尝试描述 $exp(u)exp(v)$ 的值了。

对于 $u, v in frak(g)$，李括号的几何解释告诉我们 $exp(t u) exp(t v)$ 和 $exp(t v) exp(t u)$ 之间应该相差了大约 $t^2 [u, v]$，而这里我们比较的是 $exp(t u) exp(t v)$ 和 $exp(t(u + v))$。我们可以根据对称性大胆猜测，$exp(t(u + v))$ 应该大致在 $exp(t u)exp(t v)$ 和 $exp(t v)exp(t u)$ 之间，因此它和 $exp(t u)exp(t v)$ 之间相差的向量应该正比于 $[u, v]$，且比例系数近似为 $t^2 / 2$。

$ exp(t u) exp(t v) approx exp(t(u + v) + t^2/2 [u, v] + O(t^3)) $

当然我们也可以使用一些更复杂的方法展开高次项，更高次项的公式就没有二次项这么简单了。如果我们定义 $exp$ 映射在 $G$ 的单位元附近的逆映射为 $log$（之所以能这么假设是因为 $exp$ 在 $G$ 的某个开邻域上是满射）：

#theorem[
  （Baker-Campbell-Hausdorff 定理）

  $ log(exp(u)exp(v)) = u + v + 1/2 [u, v] + 1/12 [u, [u, v]] + 1/12 [v, [v, u]] + dots.c $
]

这个定理的严格证明非常复杂#strike[而且我也不会]，所以同样留给感兴趣的读者了。

= 线性群上的李代数

如果我们考虑一般线性群 $G L(n, RR)$ 的李代数 $frak(g l)(n, RR)$，可以来思考一下这里的“李括号”的含义是什么。首先，由于 $G L(n, RR)$ 在 $RR^(n times n)$ 中是一个开集，不难看出 $frak(g l)(n, RR) tilde.equiv RR^(n times n)$。假设 $X in frak(g l)(n, RR)$，那么任取 $G L(n, RR)$ 上的一个矩阵 $A in G L(n, RR)$，左不变向量场 $X^L$ 在 $A$ 点上的取值 $(X^L)_A = A X$。注意这里是 $A X$ 而不是 $X A$，因为“左不变”要求 $A$ 要乘在 $X$ 的左边。相应地，从 $A$ 沿着 $X^L$ 的流就可以写成 $A exp(t X)$。

使用 @eq:flow-definition-of-commutator 的几何解释，可以计算出从 $A in G L(n, RR)$ 出发沿着两个矩阵 $X, Y in frak(g l)(n, RR)$ 的左不变向量场按照 $X^L$、$Y^L$、$-X^L$、$-Y^L$ 的顺序走一小段时间 $t$ 后的终点为：

$ E(t) = A exp(t X) exp(t Y) exp(-t X) exp(-t Y) $

在 $t -> 0$ 时可以取二阶近似（由于我们关心的 $[X, Y]$ 出现在 $t^2$ 项中，所以这里必须至少取到二次项）：

$
  & A exp(t X) exp(t Y) exp(-t X) exp(-t Y) \
  approx& A (I + t X + t^2/2 X^2) (I + t Y + t^2/2 Y^2) (I - t X + t^2/2 X^2) (I - t Y + t^2/2 Y^2) \
  approx& A (1 + t^2 (X Y - Y X) + O(t^3)) \
$

也就是说，李代数 $frak(g l)(n, RR)$ 上的李括号就是矩阵的交换子：

$ [X, Y] = X Y - Y X $ <eq:lie-bracket-of-gl-n>

有了这个理解之后，就可以接着看一些线性群 $G L(n, RR)$ 的子群了。

== $S O(3)$ 的李代数

考虑特殊正交群 $S O(n) = {R in G L(n, RR) | R^top R = R R^top = I}$，任取一条路径 $R : RR -> S O(n)$，则有：

$ R(t) R(t)^top = I $

如果我们想要计算这条路径的切向量 $dot(R)(t)$，那么对上式两边求导得到：

$ dot(R)(t) R(t)^top + R(t) dot(R)(t)^top = 0 $

$ dot(R)(t) R(t)^top = -(dot(R)(t) R(t)^top)^top $

也就是说，$dot(R)(t) R(t)^top$ 是一个反对称矩阵。如果我们只关心单位矩阵 $I$ 的切空间，那么取 $R(t) = I$，有：

$ dot(R) in frak(s o)(n) <=> dot(R) = -dot(R)^top $ <eq:antisymmetry-of-so-n>

也就是说李代数 $frak(s o)(n)$ 由所有的 $n$ 阶反对称矩阵构成。由于反对称矩阵只要确定不包含对角线的上三角区域就能确定整个矩阵，因此 $frak(s o)(n)$ 是 $n(n - 1)/2$ 维向量空间，相应地 $S O(n)$ 是一个 $n(n - 1)/2$ 维流形。

对于三维特殊正交群（即三维旋转群）$S O(3)$ 的李代数，通常使用如下记号来表示反对称矩阵：

$ [mathbf(omega)]_times = mat(0, -omega_3, omega_2; omega_3, 0, -omega_1; -omega_2, omega_1, 0) $

其中 $omega_1, omega_2, omega_3$ 是三维向量 $mathbf(omega) in RR^3$ 的三个分量。可以将 $[dot]_times : RR^3 -> frak(s o)(3)$ 看作是一个三维向量到三阶反对称矩阵的同构，并且不妨记这个映射的逆映射为 $(dot)^or : frak(s o)(3) -> RR^3$。

为什么我们要引入这个三维向量表示呢？不仅是因为三维向量比三阶矩阵更好计算，而且 $frak(s o)(3)$ 上的李括号操作刚好对应着三维向量的叉乘：

$
  [mathbf(alpha)]_times [mathbf(beta)]_times &= mat(0, -alpha_3, alpha_2; alpha_3, 0, -alpha_1; -alpha_2, alpha_1, 0) mat(0, -beta_3, beta_2; beta_3, 0, -beta_1; -beta_2, beta_1, 0) \
  &= mat(-alpha_2 beta_2 - alpha_3 beta_3, alpha_2 beta_1, alpha_3 beta_1; alpha_1 beta_2, -alpha_1 beta_1 - alpha_3 beta_3, alpha_3 beta_2; alpha_1 beta_3, alpha_2 beta_3, -alpha_1 beta_1 - alpha_2 beta_2) \
$

$
  [mathbf(beta)]_times [mathbf(alpha)]_times &= mat(0, -beta_3, beta_2; beta_3, 0, -beta_1; -beta_2, beta_1, 0) mat(0, -alpha_3, alpha_2; alpha_3, 0, -alpha_1; -alpha_2, alpha_1, 0) \
  &= mat(-alpha_2 beta_2 - alpha_3 beta_3, alpha_1 beta_2, alpha_1 beta_3; alpha_2 beta_1, -alpha_1 beta_1 - alpha_3 beta_3, alpha_2 beta_3; alpha_3 beta_1, alpha_3 beta_2, -alpha_1 beta_1 - alpha_2 beta_2) \
$

$
  [[mathbf(alpha)]_times, [mathbf(beta)]_times] &= [mathbf(alpha)]_times [mathbf(beta)]_times - [mathbf(beta)]_times [mathbf(alpha)]_times \
  &= mat(0, alpha_2 beta_1 - alpha_1 beta_2, alpha_3 beta_1 - alpha_1 beta_3; alpha_1 beta_2 - alpha_2 beta_1, 0, alpha_3 beta_2 - alpha_2 beta_3; alpha_1 beta_3 - alpha_3 beta_1, alpha_2 beta_3 - alpha_3 beta_2, 0) \
  &= [mathbf(alpha) times mathbf(beta)]_times
$ <eq:lie-algebra-isomorphism-of-so-3-and-r-3>

其中 $mathbf(alpha) times mathbf(beta)$ 就是我们熟悉的三维向量叉乘。也就是说，李代数 $(frak(s o)(3), [dot, dot])$ 和三维向量空间关于叉乘的李代数 $(RR^3, times)$ 是同构的。这个结论在物理学和工程学中非常有用，因为它告诉我们三维旋转群 $S O(3)$ 的李代数可以用三维向量和叉乘来表示。

总结一下，现在我们有三种记号来表示三维旋转群：

1. 群 $S O(3)$：每个元素 $R in S O(3)$ 是一个正交矩阵，满足 $R^top R = I$。
2. 李代数 $frak(s o)(3)$：每个元素 $r in frak(s o)(3)$ 是一个反对称矩阵，满足 $r^top = -r$。
3. 三维向量空间 $RR^3$：每个元素 $mathbf(omega) in RR^3$ 是一个三维向量。

其中 $S O(3)$ 是一个李群，它的局部空间是弯曲的；而 $frak(s o)(3)$ 和 $RR^3$ 是李群的切空间，它们是平坦的。三者之间的关系可以用下图表示：

#figure(
  diagram(
    node((0, 0), $S O(3)$),
    edge((2, 0), "-|>", $log$, bend: 30deg),
    edge((2, 0), (0, 0), "-|>", $exp$, bend: 30deg),
    node((2, 0), $(frak(s o)(3), [dot, dot])$),
    edge((4, 0), "-|>", $(dot)^or$, bend: 30deg),
    edge((4, 0), (2, 0), "-|>", $[dot]_times$, bend: 30deg),
    node((4, 0), $(RR^3, times)$)
  ),
  caption: [$S O(3)$、$frak(s o)(3)$ 与 $(RR^3, times)$ 之间的关系。]
)

=== 旋转向量的几何意义

这里的三维向量 $mathbf(omega) in RR^3$ 也是有几何含义的。比如，可以考虑 $S O(3)$ 上由 $[mathbf(omega)]_times$ 生成的左不变向量场上的流 $R(t) = exp(t [mathbf(omega)]_times)$。这个流由如下微分方程描述：

$ (dif R(t)) / (dif t) = R(t) [mathbf(omega)]_times $

可以把这里的 $R(t)$ 当作一个随时间变化的旋转参考系 $S'$ 到世界坐标系 $S$  的换算矩阵。那么对于 $S'$ 系中的一个固定点 $mathbf(r)' in RR^3$，它在世界坐标系 $S$ 中的坐标为 $mathbf(r) = R(t)mathbf(r)'$。对其求导得到：

$
  (dif mathbf(r)) / (dif t) &= (dif R(t)) / (dif t) mathbf(r)' \
  &= R(t) [mathbf(omega)]_times mathbf(r)' \
  &= R(t) (mathbf(omega) times mathbf(r)') \
  &= mathbf(omega) times (R(t) mathbf(r)') \
  &= mathbf(omega) times mathbf(r)
$

有没有感觉这个公式很熟悉？没错，这就是我们在高中物理学过的刚体转动公式：一个点在旋转参考系中的速度等于角速度向量与该点位置向量的叉乘。也就是说，$mathbf(omega)$ 就是旋转的角速度向量，它的方向表示旋转轴，大小表示旋转速率。我们在高中学的使用叉乘来计算旋转的各种性质，提到过角速度向量并不像位置、速度这些量一样可以简单地相加减，其实这背后是李群 $S O(3)$ 的李代数结构在起作用。

观察指数映射 $exp([mathbf(omega)]_times)$。这个数相当于是路径 $R(t)$ 在 $t = 1$ 处的取值。结合前面说的 $R(t)$ 旋转的角速度向量是 $mathbf(omega)$，不难看出，$exp([mathbf(omega)]_times) in S O(3)$ 矩阵的几何意义就是将空间绕着轴 $mathbf(omega)$ 旋转了角度 $|mathbf(omega)|$。你可能听说过三维旋转的轴角法表示——使用三维向量的方向来表示旋转轴，向量的长度表示旋转角度。$mathbf(omega) |-> exp([mathbf(omega)]_times)$ 映射就是轴角法所表示的向量到其表示的旋转矩阵的映射。

利用立体几何，可以推导出旋转矩阵 $exp([mathbf(omega)]_times)$ 的解析表达式，也就是*罗德里格旋转公式*：令 $mathbf(omega) = theta hat(mathbf(omega))$，其中 $theta = |mathbf(omega)|$ 是旋转角度，单位向量 $hat(mathbf(omega))$ 是旋转轴。则有：

$ exp([theta hat(mathbf(omega))]_times) = I + sin theta [hat(mathbf(omega))]_times + (1 - cos theta)[hat(mathbf(omega))]_times^2 $

罗德里格公式的推导与李代数无关，因此我在本文中不多赘述。读者只需要知道 $S O(3)$ 上的指数映射 $exp$ 可以写出解析表达式即可。

=== $S O(3)$ 上的 Baker-Campbell-Hausdorff 定理

Baker-Campbell-Hausdorff 定理也可以应用到 $S O(3)$ 上。假设 $mathbf(alpha), mathbf(beta) in RR^3$，则有：

$
  exp([mathbf(alpha)]_times) exp([mathbf(beta)]_times) &= exp([mathbf(alpha)]_times + [mathbf(beta)]_times + 1/2 [[mathbf(alpha)]_times, [mathbf(beta)]_times] + dots.c) \
  &= exp([mathbf(alpha) + mathbf(beta) + 1/2 (mathbf(alpha) times mathbf(beta)) + dots.c]_times)
$

也就是说，先绕着轴 $mathbf(beta)$ 旋转、再绕着轴 $mathbf(alpha)$ 旋转，大致等价于绕着轴 $mathbf(alpha) + mathbf(beta) + 1/2 (mathbf(alpha) times mathbf(beta))$ 旋转。下面这个示例展示了这一点：

#figure(
  three-js-figure("/blog/zh/2026-10-28/bch-so3.js", body: [
    _（交互式三维场景，仅在网页版本显示。）_
  ]),
  caption: [左侧立方体依次绕 $mathbf(beta)$ 和 $mathbf(alpha)$ 旋转；中间立方体绕 $mathbf(alpha) + mathbf(beta)$ 旋转；右侧立方体绕 $mathbf(alpha) + mathbf(beta) + 1/2 (mathbf(alpha) times mathbf(beta))$ 旋转。叉乘项展示了 BCH 公式中的一阶非交换修正。]
) <fig:bch-so3>

三维旋转的 BCH 修正在工程里非常有用，比如看下面这个问题：

#quote(block: true)[
  假设我们在观察一个刚体，令其在 $t$ 时刻物体参考系到世界参考系的换算矩阵为 $R(t)$。惯性传感器记录了一个刚体在 $t = 0$ 到 $t = T$ 时间段每个时刻局部参考系下的角速度向量 $mathbf(omega)(t)$，现在我们希望根据惯性传感器的信息积分出物体的旋转角 $mathbf(theta)(t) = log(R(t))^or$，取 $mathbf(theta)(0) = 0$。
]

显然，由于 $S O(3)$ 是弯曲的，我们不能把 $mathbf(omega)(t)$ 简单积分得到 $mathbf(theta)(t)$。但是我们可以使用 BCH 定理来近似计算 $mathbf(theta)(t)$。

考虑一段非常小的时间 $Delta t$，设这段时间里 $mathbf(omega)(t)$ 保持不变，那么有：

$ R(t + Delta t) = R(t) exp([mathbf(omega)(t) Delta t]_times) $

$ exp([mathbf(theta)(t + Delta t)]_times) = exp([mathbf(theta)(t)]_times) exp([mathbf(omega)(t) Delta t]_times) $

根据 BCH 定理，有：

$
  mathbf(theta)(t + Delta t) &= mathbf(theta)(t) + mathbf(omega)(t) Delta t + 1/2 theta(t) times mathbf(omega)(t) Delta t + dots.c \
  &= mathbf(theta)(t) + (I + 1/2 [theta(t)]_times + dots.c) mathbf(omega)(t) Delta t + O(Delta t^2)
$

取 $Delta t -> 0$ 的极限，有：

$ dot(mathbf(theta))(t) = (I + 1/2 [theta(t)]_times + dots.c) mathbf(omega)(t) $

如果展开 BCH 定理的更高次项，可以得到：

$ dot(mathbf(theta))(t) = (I + [theta(t)]_times / 2 + [theta(t)]_times^2 / 12 - [theta(t)]_times^4 / 720 + [theta(t)]_times^6 / 30240 + dots.c ) mathbf(omega)(t) $

这个将 $dot(mathbf(theta))(t)$ 和 $mathbf(omega)(t)$ 关联起来的矩阵就是 $S O(3)$ 的右雅可比矩阵 $J_r$ 的逆矩阵 $J_r^(-1)$。其中

$ exp([mathbf(theta) + delta mathbf(theta)]_times) = exp([mathbf(theta)]_times) exp([J_r (mathbf(theta)) delta mathbf(theta)]_times) $

至于为什么会有这个关系，读者自证不难。

== $S U(2)$/单位四元数的李代数

@eq:lie-bracket-of-gl-n 的推导使用了 $G L(n, RR)$ 群，不过同样的推导对于复数矩阵 $G L(n, CC)$ 也成立。特殊酉群 $S U(n) = {A in G L(n, CC) | det(A) = 1, A^dagger A = I}$ 作为 $G L(n, CC)$ 的子群，其李代数 $frak(s u)(n)$ 上的李括号同样也是矩阵的交换子。

使用类似 @eq:antisymmetry-of-so-n 的推导，设 $a in frak(s u)(n)$，由于 $exp(a t)^dagger exp(a t) = I$，两边取导数可以得到 $a$ 是反厄米矩阵，即 $a^dagger = -a$。又由于 $det(exp(a)) = 1$，$a$ 必须满足 $tr(a) = 0$。对于二阶特殊酉群 $S U(2)$，同时满足这两个条件的矩阵空间 $frak(s u)(2)$ 是三维的，可以取如下三组泡利矩阵作为基：

$ i X = mat(0, i; i, 0), i Y = mat(0, 1; -1, 0), i Z = mat(i, 0; 0, -i) $

换句话说，

$ a in frak(s u)(2) <=> a = mat(xi i, -overline(eta); eta, -xi i), xi in RR, eta in CC $

其中 $overline(z)$ 表示复数共轭。

相应地，$S U(2)$ 李群也是一个三维流形。可以证明，$S U(2)$ 中的所有元素都可以写成如下形式：

$ A in S U(2) <=> A = mat(alpha, -overline(beta); beta, overline(alpha)), alpha, beta in CC, |alpha|^2 + |beta|^2 = 1 $ <eq:su2-parametrization>

复数 $alpha$ 和 $beta$ 各自有两个维度，而约束条件 $|alpha|^2 + |beta|^2 = 1$ 限制了一个维度，这同样证明了 $S U(2)$ 是三维的。同时不难注意到，如果令 $alpha = a + b i$、$beta = c + d i$，那么 $|alpha|^2 + |beta|^2 = 1$ 就等价于 $a^2 + b^2 + c^2 + d^2 = 1$。也就是说，$S U(2)$ 流形微分同胚于一个四维空间里的三维球面。这也是为什么有时候你会看到 $S U(2)$ 被称为 $S^3$。

=== $S U(2)$ 与单位四元数

如果你之前没有学过量子力学，那 $S U(2)$ 对你来说可能不是它最熟悉的名字。$S U(2)$ 还有一个在工程生里更加广为人知的名字——单位四元数群 ${q in HH | |q| = 1}$。你可能会好奇 $S U(2)$ 作为一个复数矩阵群和四元数有什么关系，不过马上我们就会看到了。

复习一下四元数的知识。一个四元数包含四个实数分量：

$ q in HH => q = a + b i + c j + d k $

四元数的乘法满足如下关系：

$ i^2 = j^2 = k^2 = i j k = -1 $

有时我们也会将四元数的虚部写成一个三维向量，即：

$ q = a + mathbf(u), mathbf(u) = b i + c j + d k $

那么四元数的乘法也可以这样表示：

$ q_1 q_2 = (a + mathbf(u)) (b + mathbf(v)) = (a b - mathbf(u) dot mathbf(v)) + (a mathbf(v) + b mathbf(u) + mathbf(u) times mathbf(v)) $

四元数的共轭为：

$ overline(q) = a - b i - c j - b k = a - mathbf(u) $

与复数类似，四元数的模长平方也可以写成自身乘上自身的共轭：

$ |q|^2 = q overline(q) = a^2 + b^2 + c^2 + d^2 = a^2 + |mathbf(u)|^2 $

不难证明，单位四元数 ${q in HH | |q| = 1}$ 构成了四元数群 $HH$ 的一个子群。这个群的单位元为 $1$，每个元素的逆元为其共轭。由于单位四元数满足 $a^2 + |mathbf(u)|^2 = 1$，因此它们也构成了一个三维球面 $S^3$。

我们可以尝试分析单位四元数群的李代数。取一条光滑路径 $q(t)$，由于 $q (t)overline(q(t)) = 1$，对两边取导数，得到 $dot(q)(t) overline(q(t)) + q(t) overline(dot(q)(t)) = 0$。设 $q(t) = 1$，则有 $dot(q) = -overline(dot(q))$，也就是说 $dot(q)$ 是一个纯虚四元数。

如果你的注意力比较惊人，你可能会看到 $S U(2)$ 和 ${q in HH | |q| = 1}$ 之间存在一个群同胚：

$ mat(a + b i, c + d i; - c + d i, a - b i) |-> a + b i + c j + d k $

相当于 @eq:su2-parametrization 中取 $alpha = a + b i$、$beta = c + d i$。读者可以自行检验，这个映射是一个双射，且 $S U(2)$ 上的矩阵乘法对应到了四元数的乘法，因此这个映射是一个群同胚。

那么一个自然的结论是，$S U(2)$ 的李代数 $frak(s u)(2)$ 与单位四元数的李代数 ${q in HH | q = -overline(q)}$ 之间也存在一个同构。

$ i Z = mat(i, 0; 0, -i) |-> i $

$ i Y = mat(0, 1; -1, 0) |-> j $

$ i X = mat(0, i; i, 0) |-> k $

出于一些历史原因，泡利矩阵 $X, Y, Z$ 与纯虚四元数的 $i, j, k$ 的对应关系并不完全符合直观。不过，既然存在这样一个同构，我们就可以说：单位四元数群与二阶特殊酉群本质上是同一个群。由于本篇文章的重点在于讨论 $RR^3$ 上的旋转，而工程中通常使用四元数来表示三维旋转。因此，下述内容中如果不加特殊说明，默认 $S U(2) subset HH$ 是单位四元数群，$frak(s u)(2) subset HH$ 是单位四元数的李代数。

=== $frak(s u)(2)$ 与 $frak(s o)(3)$

观察 $frak(s u)(2)$ 的李括号。由于单位四元数群与二阶特殊酉群同构，我们可以用特殊酉群的李括号来表示单位四元数的李括号。有：

$ [i, j] = [mat(i, 0; 0, -i), mat(0, 1; -1, 0)] = mat(0, 2i; 2i, 0) = 2k $

$ [j, k] = [mat(0, 1; -1, 0), mat(0, i; i, 0)] = mat(2i, 0; 0, -2i) = 2i $

$ [k, i] = [mat(0, i; i, 0), mat(i, 0; 0, -i)] = mat(0, 2; -2, 0) = 2j $

有没有觉得这组公式很熟悉？没错，只要我们给 $frak(s u)(2)$ 换一组基，就可以将它变成标准的三维向量叉乘：令 $hat(i) = i / 2, hat(j) = j / 2, hat(k) = k / 2$，则有：

$ [hat(i), hat(j)] = 1/4 [i, j] = 1/2 k = hat(k) $

$ [hat(j), hat(k)] = 1/4 [j, k] = 1/2 i = hat(i) $

$ [hat(k), hat(i)] = 1/4 [k, i] = 1/2 j = hat(j) $

也就是说，$frak(s u)(2)$ 的李代数同样与 $(RR^3, times)$ 同构。而 @eq:lie-algebra-isomorphism-of-so-3-and-r-3 告诉我们 $(RR^3, times)$ 与 $frak(s o)(3)$ 也是同构的。那么不难得出：

$ (frak(s u)(2), [dot, dot]) tilde.equiv RR^3 tilde.equiv (frak(s o)(3), [dot, dot]) $

同构映射如下：

$ hat(i) = i / 2 in frak(s u)(2) |-> vec(1, 0, 0) in RR^3 $

$ hat(j) = j / 2 in frak(s u)(2) |-> vec(0, 1, 0) in RR^3 $

$ hat(k) = k / 2 in frak(s u)(2) |-> vec(0, 0, 1) in RR^3 $

$frak(s u)(2)$ 与 $frak(s o)(3)$ 群的李代数同构，意味着 $S U(2)$ 与 $S O(3)$ 群在任意一点处附近的结构是一致的，这也是为什么我们可以使用单位四元数来表示旋转。不过正如之前所说，李代数同构不能保证李群同构，两个李群的全局结构有可能会不一样。在之后的章节里我们会证明 $S U(2)$ 与 $S O(3)$ 这两个群的确不一样。

=== $S U(2)$ 上的指数映射

取一个四元数 $w in frak(s u)(2)$。根据指数映射的定义，$q(t) = exp(t w)$ 需要满足：

$ (dif q(t)) / (dif t) = q(t) w $

使用四元数的向量表示，记 $q = a + mathbf(u)$。由于 $w$ 是纯虚四元数，其向量表示只有向量部分而没有实部。分开讨论实部和虚部：

$ (dif a(t)) / (dif t) = -mathbf(u)(t) dot mathbf(w) $

$ (dif mathbf(u)(t)) / (dif t) = a(t) mathbf(w) $

若 $q(0) = 1$，即 $a(0) = 1$、$mathbf(u)(0) = mathbf(0)$，那么不难看出对于任意时刻 $t$，$mathbf(u)(t) parallel mathbf(w)$。最后不难得出上述方程的解为：

$ a(t) = cos(|mathbf(w)|t), mathbf(u)(t) = mathbf(w) / (|mathbf(w)|) sin(|mathbf(w)|t) $

换句话说，四元数 $w in frak(s u)(2)$ 的指数为：

$ exp(t w) = cos(|w|t) + w/(|w|) sin(|w|t) $

如果令 $w = theta hat(w)$，其中 $theta = |w|$、$|hat(w)| = 1$，那么指数映射也可以写成：

$ exp(theta hat(w)) = cos(theta) + hat(w) sin(theta) $

这与复数的指数非常像——$i theta$ 的指数 $e^(i theta) = cos(theta) + i sin(theta)$，只不过这里虚部的方向永远指向指数的方向。类似地，对于一个单位四元数 $q = a + mathbf(u)$，不难求出它的对数：

$ log(q) = log(a + mathbf(u)) = mathbf(u) / (|mathbf(u)|) arctan((|mathbf(u)|) / a) $

自此，我们可以建立从 $S O(3)$ 到 $frak(s o)(3)$、再到 $RR^3$、再到 $frak(s u)(2)$ 和 $S U(2)$ 这之间的一系列映射。

#figure(
  diagram(
    node((0, 0), $S O(3)$),
    edge((2, 0), "-|>", $log_(S O(3))$, bend: 30deg),
    edge((2, 0), (0, 0), "-|>", $exp_(S O(3))$, bend: 30deg),
    node((2, 0), $(frak(s o)(3), [dot, dot]_(frak(s o)(3)))$),
    edge((3, 2), "-|>", $(dot)^or$, bend: 30deg),
    edge((3, 2), (2, 0), "-|>", $[dot]_times$, bend: 30deg),
    node((3, 2), $(RR^3, times)$),
    edge((2, 4), "-|>", $mathbf(i) = i/2, mathbf(j) = j/2, mathbf(k) = k/2$, bend: 30deg),
    edge((2, 4), (3, 2), "-|>", $i = 2 mathbf(i), j = 2 mathbf(j), k = 2 mathbf(k)$, bend: 30deg),
    node((2, 4), $(frak(s u)(2), [dot, dot]_(frak(s u)(2)))$),
    edge((0, 4), "-|>", $exp_(S U(2))$, bend: 30deg),
    edge((0, 4), (2, 4), "-|>", $log_(S U(2))$, bend: 30deg),
    node((0, 4), $S U(2)$),
  ),
  caption: [$S O(3)$、$frak(s o)(3)$、$(RR^3, times)$、$frak(s u)(2)$ 与 $S U(2)$ 之间的映射关系。]
) <fig:map-of-all-representations-of-spatial-rotation>

除了欧拉角以外，工程中常用的另外三种表示空间旋转的方法——旋转矩阵、轴角法、四元数——都可以在 @fig:map-of-all-representations-of-spatial-rotation 上找到对应的位置。旋转矩阵就是 $S O(3)$ 群，轴角法所使用的三维向量就是最右侧的 $(RR^3, times)$，而四元数则是最右下角的 $S U(2)$ 群。轴角表示法就像是一座桥梁，将两个看似无关的群——三维旋转群 $S O(3)$ 与单位四元数群 $S U(2)$——联系在了一起。

一个值得注意的点是 $(RR^3, times)$ 到 $(frak(s u)(2), [dot, dot])$ 之间的换算关系。由于 $RR^3$ 上的李代数是标准的向量叉乘，而 $frak(s u)(2)$ 如果使用纯虚四元数的标准表示的话，李括号会和叉乘算出的结果相差一个倍数 $2$。因此，一个绕着轴 $hat(mathbf(omega))$ 旋转弧度 $theta$ 的旋转使用轴角法表示就是 $theta hat(mathbf(omega))$（假设 $hat(mathbf(omega))$ 为单位向量），但是对应到李代数 $frak(s u)(2) subset HH$ 时就变成了 $theta hat(mathbf(omega)) \/ 2$。再做一遍四元数指数，得到

$ q(theta hat(mathbf(omega))) = cos theta/2 + hat(mathbf(omega)) sin theta/2 $

这也是四元数中 $cos$ 和 $sin$ 后面 $theta/2$ 的由来。我最早学习空间旋转的四元数表示时就疑惑过为什么四元数不像复数 $cos theta + i sin theta$ 那样直接把角度 $theta$ 放在三角函数里，而相信读到这里的你已经知道答案了：这里的倍数 $2$ 就是 $frak(s u)(2)$ 的李括号与 $(RR^3, times)$ 的李括号相差的倍数 $2$。

== $S U(2)$ 对 $S O(3)$ 的双覆盖

当然，这里的倍数 $2$ 也带来了另一个数学性质。不妨考虑 $RR^3$ 上的向量 $theta hat(mathbf(omega))$ 和 $(theta + 2 pi) hat(mathbf(omega))$。显然，由于二者之间差了一整圈，两个向量应当表示同一个旋转。但是，由于在转换成四元数的这一步除了一个 $2$，二者的四元数表示并不一样：

$ q((theta + 2 pi) hat(mathbf(omega))) = cos (theta / 2 + pi) + hat(mathbf(omega)) sin(theta / 2 + pi) = - cos theta/2 - hat(mathbf(omega)) sin theta/2 = -q(theta hat(mathbf(omega))) $

更一般地，可以证明：$S U(2)$ 这个三维球面上的两个对径点 $q$ 和 $-q$ 均表示同一个 $S O(3)$ 上的旋转。因此 @fig:map-of-all-representations-of-spatial-rotation 上的这一连串映射其实不是一个单射：$S U(2)$ 群将 $S O(3)$ 群覆盖了两遍。使用商群记号也可以写成：

$ S O(3) tilde.equiv S U(2) \/ {1, -1} $

#figure(
  cetz-canvas({
    import cetz.draw: *
    let surface-edge = rgb("#64748b")
    let su2-fill = rgb("#93c5fd").transparentize(58%)
    let so3-fill = rgb("#fbbf24").transparentize(62%)
    let grid-color = rgb("#94a3b8").transparentize(18%)
    let map-color = rgb("#a855f7")
    let su2-center = (3.0, 3.0)
    let so3-center = (9.2, 3.0)
    let radius = 2.2
    let q-point = (3.85, 4.15)
    let minus-q-point = (2.15, 1.85)
    let rotation-point = (10.05, 4.15)
    // Intersection angles between the horizontal ellipse (2.2, 0.58) and
    // the two halves of the vertical ellipse (0.72, 2.2).
    let horizontal-outline-cut-angle = 108.474deg
    let horizontal-dashed-cut-angle = 180deg - horizontal-outline-cut-angle

    // A two-dimensional sphere stands in for the geometry of S^3.
    circle(
      su2-center,
      radius: radius,
      fill: su2-fill,
      stroke: (paint: surface-edge, thickness: 1.2pt),
    )
    arc(
      su2-center,
      start: 0deg,
      stop: 180deg,
      anchor: "origin",
      radius: (radius, 0.58),
      stroke: (paint: grid-color, thickness: 0.7pt, dash: "dashed"),
    )
    arc(
      su2-center,
      start: 180deg,
      stop: 360deg,
      anchor: "origin",
      radius: (radius, 0.58),
      stroke: (paint: grid-color, thickness: 0.8pt),
    )
    arc(
      su2-center,
      start: -90deg,
      stop: 90deg,
      anchor: "origin",
      radius: (0.72, radius),
      stroke: (paint: grid-color, thickness: 0.7pt, dash: "dashed"),
    )
    arc(
      su2-center,
      start: 90deg,
      stop: 270deg,
      anchor: "origin",
      radius: (0.72, radius),
      stroke: (paint: grid-color, thickness: 0.8pt),
    )

    // The hemisphere representing SO(3)
    merge-path(
      fill: so3-fill,
      stroke: (paint: surface-edge, thickness: 1.2pt),
      close: true,
      {
        arc(
          so3-center,
          start: -90deg,
          stop: 90deg,
          anchor: "origin",
          radius: radius,
        )
        arc(
          so3-center,
          start: 90deg,
          stop: 270deg,
          anchor: "origin",
          radius: (0.72, radius),
        )
      },
    )
    arc(
      so3-center,
      start: -90deg,
      stop: 90deg,
      anchor: "origin",
      radius: (0.72, radius),
      stroke: (paint: grid-color, thickness: 0.7pt, dash: "dashed"),
    )
    arc(
      so3-center,
      start: 0deg,
      stop: horizontal-dashed-cut-angle,
      anchor: "origin",
      radius: (radius, 0.58),
      stroke: (paint: grid-color, thickness: 0.7pt, dash: "dashed"),
    )
    arc(
      so3-center,
      start: 360deg - horizontal-outline-cut-angle,
      stop: 360deg,
      anchor: "origin",
      radius: (radius, 0.58),
      stroke: (paint: grid-color, thickness: 0.8pt),
    )

    // Both antipodes map to the same point of SO(3).
    bezier(
      q-point,
      rotation-point,
      (5.45, 5.25),
      (8.25, 5.2),
      mark: (end: ">"),
      stroke: (paint: map-color, thickness: 1.25pt),
    )
    bezier(
      minus-q-point,
      rotation-point,
      (4.5, 0.65),
      (8.05, 1.5),
      mark: (end: ">"),
      stroke: (paint: map-color, thickness: 1.25pt),
    )

    circle(q-point, radius: 0.105, fill: map-color, stroke: none)
    circle(minus-q-point, radius: 0.105, fill: map-color, stroke: none)
    circle(rotation-point, radius: 0.105, fill: map-color, stroke: none)

    content((3.0, 5.65), $S U(2) tilde.equiv S^3$)
    content((9.2, 5.65), $S O(3)$)
    content(
      (q-point.at(0), q-point.at(1) - 0.2),
      text(size: 10pt, fill: map-color)[$q = cos (theta / 2) + hat(mathbf(omega)) sin (theta / 2)$],
      anchor: "north",
    )
    content(
      (minus-q-point.at(0), minus-q-point.at(1) + 0.2),
      text(size: 10pt, fill: map-color)[$-q = -cos (theta / 2) - hat(mathbf(omega)) sin (theta / 2)$],
      anchor: "south",
    )
    content(
      (rotation-point.at(0) + 0.2, rotation-point.at(1)),
      text(fill: map-color, size: 10pt)[$exp([theta hat(mathbf(omega))]_times)$],
      anchor: "west",
    )
  }),
  caption: [左侧的二维球面是 $S U(2) tilde.equiv S^3$ 的三维球面的示意性降维表示。右侧半球表示商空间 $S O(3) tilde.equiv S^3 / lr({ plus.minus 1 })$；对径点 $q$ 与 $-q$ 被识别为同一个旋转 $exp([theta hat(mathbf(omega))]_times)$，因此该覆盖映射是一个二对一映射。]
) <fig:su2-double-cover-so3>

双覆盖性质导致了 $S U(2)$ 和 $S O(3)$ 流形有很不一样的拓扑性质。之前说过了，$S U(2)$ 同胚于三维球面 $S^3$，而 $S O(3)$ 将球面的对径点视作同一个点，因此它的拓扑结构是三维*实射影平面*拓扑 $RR PP^3$。

$S U(2)$ 是单连通的，也就是说任何其上的闭合路径都可以连续地缩成一个点；而 $S O(3)$ 则不然，一条横穿整个半球、从对径点绕回自身的路径无法在 $S O(3)$ 上缩成一个点，因此 $S O(3)$ 不是单连通的。如果三维实射影平面拓扑不太好想象的话，也可以想象一下二维实射影平面 $RR PP^2$，也就是把一个圆盘的所有对径点全都连起来形成的拓扑结构。这个圆盘上的一条直径无法通过连续变换缩成一个点。

$S U(2)$ 对 $S O(3)$ 的双覆盖与量子力学中的 $1/2$ 自旋也有一定关系。不过这些讨论就已经超出本篇文章的范围了，以后有机会再写。
