// title: 微分几何5：李群和李代数
// summary: 在流形上定义的群结构。
// tags: mathematics, differential-geometry, lie-algebra
// category: tech

#import "../../template.typ": article, mathbf, three-js-figure, plotly-figure, theorem, definition, proof, example, corollary, assumption, lemma, cetz-canvas
#import "@preview/cetz:0.3.4"

#show: article.with(
  title: "微分几何5：李群和李代数",
  lang: "zh",
)

本文中用到的部分记号：

#figure(
  table(
    columns: 2,
    [*记号*], [*含义*],
    [$RR^n$], [$n$ 维实欧几里得空间],
    [$CC^n$], [$n$ 维复向量空间],
    [$S^n$], [$n$ 维超球面 $= { r in RR^(n+1) | ||r||_2=1 }$],
    [$RR^(n times m)$], [$n times m$ 实矩阵空间],
    [$CC^(n times m)$], [$n times m$ 复矩阵空间],
    [$G L(n)$ / $G L(n, RR)$], [一般线性群 $= {M in RR^(n times n) | det(M) != 0}$],
    [$G L(n, CC)$], [一般复线性群 $= {M in CC^(n times n) | det(M) != 0}$],
    [$S L(n)$ / $S L(n, RR)$], [特殊线性群 $= {M in RR^(n times n) | det(M) = 1}$],
    [$O(n)$], [正交群 $= {M in G L(n) | M^top = M^(-1)}$],
    [$S O(n)$], [特殊正交群 $= O(n) inter S L(n)$],
    [$U(n)$], [酉群 $= {M in G L(n, CC) | M^dagger = M^(-1)}$],
    [$S U(n)$], [特殊酉群 $= U(n) inter S L(n, CC)$]
  )
)

= 什么是李群 <sec:lie-group>

前两篇文章中，我们通过在微分流形上添加度规张量从而得到了黎曼流形。而今天我们要讨论的*李群（Lie Group）*则是在微分流形的基础上添加了另一种数学结构。不难从李群的名称中猜出来，我们要额外添加的结构就是群（Group）。如果你忘记了群是什么，不妨重新翻开抽象代数课本的第一页：

#definition[
  如果一个集合 $G$ 和集合上的二元运算 $dot : G times G -> G$ 满足

  1. 封闭性 $ forall a, b in G, a dot b in G $
  2. 结合律 $ forall a, b, c in G, a dot (b dot c) = (a dot b) dot c $
  3. 单位元 $ exists e in G, forall a in G, a dot e = e dot a = a $
  4. 逆元 $ forall a in G, exists a^(-1) in G, a dot a^(-1) = a^(-1) dot a = e $

  则称该集合与运算 $(G, dot)$ 为一个*群（Group）*。
] <def:group>

而李群的定义也很简单。如果 $G$ 同时是一个微分流形和一个群，那么 $G$ 就是一个李群。不过有一点需要注意，李群还额外要求了乘法运算和逆运算必须同时也是光滑映射。

#definition[
  若 $G$ 是一个光滑流形，$(G, dot)$ 是一个群，且函数 $m : G times G -> G, (g, h) mapsto g dot h$ 和 $i : G -> G, g mapsto g^(-1)$ 均为光滑映射，则称 $G$ 是一个*李群*。
] <def:lie-group>

有时你也会看到李群的另一种定义方式：

#theorem[
  对于光滑流形 $G$ 和群 $(G, dot)$，以下两个条件等价：

  1. $m : G times G -> G$ 和 $i : G -> G$ 光滑。
  2. $L : G times G -> G, (g, h) mapsto g^(-1) h$ 光滑。
]

#proof[
  由条件1推条件2是显然的，只需要将 $i$ 与 $id_G$ 函数组合成映射 $(g, h) mapsto (g^(-1), h)$。将该映射与群运算映射 $m$ 复合即得到映射 $L$。由于这几个函数都是光滑的，其复合后的函数也是光滑的。

  由条件2推条件1的证明如下：设 $L(g, h) = g^(-1) h$ 光滑，则取 $h = e$ 可证明映射 $g mapsto g^(-1)$ 光滑，进而得到 $(g, h) mapsto (g^(-1), h)$ 光滑。再在 $L$ 上复合该映射后即得到群运算映射，进而证明群运算光滑。
]

不过你可能会问，为什么我们要在流形上再加上一个群呢？这是因为许多连续群上的元素都会形成特殊的流形结构，而微分几何则给了我们描述这种流形结构所需的数学语言。举个例子，由所有单位复数构成的集合 ${z in CC | |z| = 1}$ 在复数乘法运算下构成一个群，而这个群同时也是一个与单位圆 $S^1$ 微分同胚的微分流形。这个群就是一个李群。

#figure(
  plotly-figure("/blog/zh/2026-09-25/unit-circle.js", body: [_（交互式图表，仅在网页版显示。）_]),
  caption: [单位圆在复平面上的乘法。拖动 $a$ 和 $b$；点 $a b$ 自动落在两角之和对应的位置。]
) <fig:unit-circle>

而一个稍微复杂一点的例子是 $S O(3)$ 群。这个群包含了所有 $3 times 3$ 行列式为 $1$ 的正交矩阵，也就是三维空间中的旋转矩阵。不难看出 $S O(3)$ 在矩阵乘法下构成了一个群。并且，直观上来想，$S O(3)$ 群继承了 $RR^(n times n)$ 的拓扑——$S O(3)$ 群上有开集和邻域这些概念（可以直观想象一个旋转矩阵附近非常相近的旋转）。一个不太显然的事实是：每个点都有一个开邻域微分同胚于 $RR^3$ 的开子集，也就是说 $S O(3)$ 是一个具有群结构的三维流形。

@fig:so3-neighborhood 展示了一种将 $S O(3)$ 流形映射到其对应的旋转向量并绘制在一个半径为 $pi$ 的球上的方法。每个球内的点对应了一个旋转矩阵，可以通过右侧魔方的三维旋转直观看出。

#figure(
  three-js-figure("/blog/zh/2026-09-25/so3-neighborhood.js", body: [
    _（交互式三维场景，仅在网页版显示。）_
  ]),
  caption: [$S O(3)$ 在单位元附近的坐标。左侧半径为 $pi$ 的球表示旋转向量 $omega$；拖动点上的三根小箭头会改变 $omega_x, omega_y, omega_z$，右侧魔方按 $R(omega) = exp([omega]_times)$ 旋转。球面上的两个对径点是同一个点。]
) <fig:so3-neighborhood>

根据李群的定义不难推出，左乘一个特定群元素 $g$ 的映射 $L_g : G -> G, h mapsto g h$ 是一个光滑映射。同时注意到， $L_g$ 的逆映射 $L_g^(-1)$ 其实就是左乘上 $g^(-1)$，即 $L_g^(-1) = L_(g^(-1))$，而 $L_(g^(-1))$ 同样是一个左乘映射，因此 $L_(g^(-1))$ 光滑。综合上述两个结论，*$L_g$ 是一个 $G$ 到自身的微分同胚*。类似地，右乘映射 $R_g : G -> G, h mapsto h g$ 也是一个 $G$ 到自身的微分同胚。

类似地，由于 $i$ 的逆映射就是自身，因此*逆元映射 $i$ 也是一个 $G$ 到自身微分同胚*。

#corollary[
  对于李群 $(G, dot)$，左乘映射 $L_g : h mapsto g h$、右乘映射 $R_g : h mapsto h g$ 和逆元映射 $i : h mapsto h^(-1)$ 均为 $G$ 到自身的微分同胚。
] <cor:lie-group-diffeomorphisms>

== 李群的各种关系

既然李群就是在流形上加上了一个群，那么自然我们也可以把同态、同构、子群这些概念给照搬到李群上。

#definition[
  若 $G, H$ 为李群，且存在映射 $phi : G -> H$ 同时是群同态和光滑映射，则称 $phi : G -> H$ 为一个*李群同态（Lie Group Homomorphism）*。
] <def:lie-homomorphism>

#definition[
  若 $G, H$ 为李群，且映射 $phi : G -> H$ 同时是群同构和微分同胚，则称 $phi$ 为 $G$ 和 $H$ 之间的一个*李群同构（Lie Group Isomorphism）*。李群 $G$ 和 $H$ 则被认为是*同构*的。
] <def:lie-isomorphism>

#definition[
  若李群 $G, H$ 满足 $H$ 是 $G$ 的子群且存在光滑嵌入 $iota : H arrow.r.hook G$，则称 $H$ 为 $G$ 的*嵌入李子群（Embedded Lie Subgroup）*。
] <def:lie-subgroup>

不难证明如果 $G$ 的一个子群 $H$ 同时有一个光滑嵌入 $iota : H arrow.r.hook G$，那么 $H$ 一定是一个李群。因此，@def:lie-subgroup 中的 $H$ 不一定需要是一个李群，只需要 $H$ 是$G$ 的子群、具有 $G$ 的子空间拓扑以及嵌入 $iota$ 光滑即可。

不妨从几个简单的例子开始看起。$(RR, +)$ 是一个群的同时也是一个一维流形，因此 $(RR, +)$ 是一个李群。这个李群与 $(RR_(> 0), times)$ 是同构的，因为二者之间可以通过 $exp : x mapsto e^x$ 建立映射关系。

再举一个例子。$(RR, +)$ 可以通过映射 $phi : x mapsto e^(2 pi i x)$ 映射到复平面上的单位圆 $S^1 subset CC$ 上。这个映射建立了 $(RR, +)$ 到 $(S^1, times)$ 的李群同态。但由于这个映射不是单射，因此两个李群不是同构的。

== 李子群

之前我们看到过，微分几何的视角下流形上每个点的局部都是相同的平直欧氏空间。而李群则不一样：由于李群给流形上增加了一个群结构，不同位置的点的地位就变得不一样了——在微分几何的视角下 $G$ 的单位元 $e$ 和其他所有点都没有任何区别，但是一旦在 $G$ 上有了一个群运算 $dot$，单位元 $e$ 就变成了整个群 $G$ 上独一无二的一个点。这种元素地位对称性被打破的特点将会给李群带来一个在一般流形上看不到的性质。

#theorem[
  对于李群 $(G, dot)$，设其单位元为 $e in G$。若 $W subset.eq G$ 为单位元 $e$ 的一个邻域（即存在包含 $e$ 的开集 $U_e$ 满足 $e in U_e subset.eq W subset.eq G$），则有 $W$ 的生成群 $chevron(W)$ 是 $G$ 的一个开子集。
] <thm:generated-group-of-identity-neighbourhood-is-open>

#proof[
  设开集 $U_e$ 满足 $e in U_e subset.eq W subset.eq G$，$p$ 为 $chevron(W)$ 中的任意一点。由于 $G$ 是李群，函数 $L_p (g) = p g$ 为微分同胚（@cor:lie-group-diffeomorphisms），因此开集 $U_e$ 在 $L_p$ 映射下的像 $p U_e$ 也是一个开集。
  
  注意到 $e in U_e$ 是李群的单位元，因此 $p = p e in p U_e$，$p U_e$ 是一个包含点 $p$ 的开集。另一方面，由于 $p in chevron(W), U_e subset.eq W subset.eq chevron(W)$，且 $chevron(W)$ 作为一个群显然需要在群运算下保持封闭，因此 $p U_e subset.eq chevron(W)$。我们证明了任意 $chevron(W)$ 内的点 $p$ 都有一个完全包含在 $chevron(W)$ 中的开集 $p U_e$，因此 $chevron(W) = union_(p in chevron(W)) p U_e$ 一定是一个开集。
]

由于流形上的所有开集天然都是这个流形的嵌入子流形（这条性质我们还没有严谨证明过，详细过程可以参考 Introduction to Smooth Manifolds @lee2013introduction），再结合 @def:lie-subgroup，$chevron(W)$ 一定是 $G$ 的一个嵌入李子群。这告诉我们只要我们随便选择一个 $e$ 的邻域 $W$，就可以以此生成一个 $G$ 的李子群。

#theorem[
  在 @thm:generated-group-of-identity-neighbourhood-is-open 的基础上，若 $W$ 路径连通，则 $W$ 的生成群 $chevron(W)$ 也路径连通。
] <thm:generated-group-of-identity-connected-neighbourhood-is-connected>

#proof[
  任取一点 $p in chevron(W)$。原命题等价于证明对于这个任取的 $p$ 我们总能找到一条连续路径连接单位元 $e$ 和 $p$。
  
  根据生成群的性质，$p$ 一定能分解成有限个 $W$ 中元素或者 $W$ 中元素逆元的乘积：

  $ p = w_1^(epsilon_1) w_2^(epsilon_2) dots.c w_n^(epsilon_n), w_i in W, epsilon_i in {plus.minus 1} $

  我们不妨从左往右一项项看。显然，由于 $e, w_1 in W$，存在一条连续的路径 $delta_1 : [0, 1] -> W$ 连接单位元 $e$ 和 $w_1$（即 $delta_1 (0) = e, delta_1 (1) = w_1$）。又由于映射 $i : h mapsto h^(-1)$ 是 $G$ 上的微分同胚，路径 $delta_1$ 经过 $i$ 映射后得到的路径 $(i compose delta_1) : [0, 1] -> chevron(W)$ 仍然是连续的，且这条路径现在连接了 $e$ 和 $w_1^(-1)$。换句话说，不论 $epsilon_1$ 是 $+1$ 还是 $-1$，我们一定可以构造一条路径连接 $e$ 和 $w_1^(epsilon_1)$：

  $ gamma_1 : [0, 1] -> chevron(W) = cases(delta_1 &\, & epsilon_1 = +1, i compose delta_1 &\, & epsilon_1 = -1 ) $

  如果我们再将 $w_2^(epsilon_2)$ 添加进来呢？同样我们可以构造一条 $chevron(W)$ 上的连续路径连接 $e$ 和 $w_2^(epsilon_2)$，记作 $gamma_2$。由于 $chevron(W)$ 是 $G$ 的李子群，左乘 $w_1^(epsilon_1)$ 的运算 $L_(w_1^(epsilon_1))$ 是一个连续映射，因此将其复合到路径 $gamma_2$ 上之后得到的新路径 $L_(w_1^(epsilon_1)) compose gamma_2$ 是一条 $chevron(W)$ 上连接 $w_1^(epsilon_1)$ 到 $w_1^(epsilon_1) w_2^(epsilon_2)$ 的连续路径。将 $gamma_1$ 与 $L_(w_1^(epsilon_1)) compose gamma_2$ 首尾相接即可得到一条连接单位元到 $w_1^(epsilon_1) w_2^(epsilon_2)$ 的路径。

  以此类推，我们可以反复构造连接相邻两个点的连续路径并首尾拼接。由于 $n$ 有限，我们一定可以构造一条有限长的路径连接 $e$ 和最终的点 $p = w_1^(epsilon_1) w_2^(epsilon_2) dots.c w_n^(epsilon_n)$。
]

这个性质相当有意思。这意味着只要我们知道李群单位元附近的一小块区域 $W$，就可以通过群运算不断扩大这块区域，开疆拓土，最终获得一片非常大的连通区域。不过这片区域最大能够到达多大呢？这就要看下面这条定理了。

在这之前我们先引入一条引理：

#lemma[
  李群 $G$ 的嵌入李子群 $H$ 一定是闭集。
] <lem:embedded-lie-subgroup-is-closed>

这条引理的证明过程比较繁琐，需要用到较多拓扑学知识#strike[而我拓扑学学得并不好......]。我在这里简要概括一下证明过程：

#proof[
  （注：以下证明过程仅代表大致步骤）
  1. 首先通过#link("/zh/posts/2026-08-22/diff-geometry/", "前面的这篇文章")中提到的嵌入坐标卡来证明 $H$ 是局部紧的（即任意 $h in H$ 都有一个开邻域 $U$ 满足 $overline(U)$ 是紧的）。
  2. 通过 $m$ 和 $i$ 映射的连续性证明 $H$ 的闭包 $overline(H)$ 也是一个 $G$ 的子群。
  3. 最后只需证明 $forall x in overline(H), x in H$ 即可。
    1. 取一个单位元 $e$ 的开邻域 $V$ 和一个 $e$ 在 $H$ 上的紧邻域 $K$ 满足 $V inter H subset.eq K$。由于 $G$ 是一个豪斯多夫流形且 $iota : H arrow.r.hook G$ 保留了集合的紧性，$K$ 一定是闭的。
    2. 对于任何 $x in overline(H)$，由于集合 $x V^(-1)$ 是一个开集，一定找到一个距离 $x$ 足够近的 $h in H$ 使得 $x$ 的开邻域 $W$ 通过左乘 $h^(-1)$ 会被映射到 $V$ 的某个子集上（即选取 $W$ 使得 $h^(-1) W subset.eq V$）。
    3. 此时再取一个 $W inter H$ 上的序列 ${x_n}_(n=1)^infinity$ 使得其极限为 $x$，那么 $h^(-1) x_n in h^(-1) W subset.eq V inter H subset.eq K$，且序列 ${h^(-1) x_n}$ 的极限为 $h^(-1) x$。据此我们证明 $h^(-1) x in overline(V inter H) subset.eq overline(K) = K subset.eq H$，又由于 $H$ 对群运算封闭，两侧同时左乘 $h$ 后得到 $h (h^(-1) x) = x in H$。
]

结合我们在 @thm:generated-group-of-identity-neighbourhood-is-open 中证明过的结论，单位元邻域 $W$ 的生成群一定是开集。那么 $chevron(W)$ 一定是一个既开又闭的集合。而什么样的集合是既开又闭、同时还是路径连通的呢？不难看出这样的集合一定是 $G$ 包含单位元的最大路径连通子集。而如果 $G$ 本身就是连通的，那么只有一种可能——$chevron(W)$ 就是 $G$ 本身。@thm:identity-connected-neighbourhood-generates-maximum-connected-subset 证明了这一点。

#theorem[
  假设 @thm:generated-group-of-identity-connected-neighbourhood-is-connected 的前置条件成立，则 $chevron(W)$ 是 $G$ 包含 $e$ 的最大路径连通子集；如果在此基础上 $G$ 本身是路径连通的，那么 $chevron(W) = G$。
] <thm:identity-connected-neighbourhood-generates-maximum-connected-subset>

#proof[
  由 @thm:generated-group-of-identity-neighbourhood-is-open，$chevron(W)$ 是开集；由 @lem:embedded-lie-subgroup-is-closed，$chevron(W)$ 作为嵌入李子群是闭集。因此，$chevron(W)$ 既开又闭。再根据连通性的定义，$chevron(W)$ 与 $complement_G chevron(W)$ 一定不连通，自然也不是路径连通的。因此，不存在任何路径连接 $e$ 和任何 $complement_G chevron(W)$ 上的点。

  再由 @thm:generated-group-of-identity-connected-neighbourhood-is-connected，$chevron(W)$ 路径连通。假设集合 $U$ 路径连通且 $e in U$，则不存在路径连接 $U$ 和 $complement_G chevron(W)$，因此 $U inter complement_G chevron(W) = emptyset$，从而 $U subset.eq chevron(W)$。
  
  因此，$chevron(W)$ 是 $G$ 上包含 $e$ 的最大路径连通子集。如果 $G$ 本身路径连通，则 $G$ 包含 $e$ 的最大路径连通子集就是 $G$ 本身，此时 $chevron(W) = G$。
]

这是一个非常强而有力的结论。要知道，我们研究的很多李群本身就是连通的，比如 $S O(3)$ 三维旋转群。我们不需要知道 $S O(3)$ 的全局几何性质，而只用知道单位元 $I_3 in S O(3)$ 附近的一小块开集就能够通过生成群来将其生成到整个 $S O(3)$ 流形上。这个性质直接引出了章节 @sec:lie-algebra 要讲的*李代数*。

不过在此之前我们还需要处理李群 $G$ 本身不连通的情况。

== 不连通的李群

@thm:identity-connected-neighbourhood-generates-maximum-connected-subset 证明了单位元的一个路径连通邻域 $W$ 可以生成出一整片 $G$ 的最大路径连通子集，而在 $G$ 连通时，这片最大连通子集就是 $G$ 本身。那么如果 $G$ 本身不连通怎么办？这样我们不就无法生成整个 $G$ 了吗？

别忘了，_群_是一个高度对称的结构。如果我们从单位元的邻域出发生成了一片 $G$ 的连通子集，那么一个合理的假设便是，$G$ 其余的连通子集与我们生成的这一片连通子集是对称的。更严谨地说：

#theorem[
  若 $H$ 为 $G$ 包含 $e$ 的最大路径连通子集，则

  1. $H$ 是一个正规子群。任意 $g in G, h in H$ 都有 $g h g^(-1) in H$。
  2. 任意 $G$ 的最大路径连通子集（不一定包含 $e$）都与 $H$ 微分同胚。
] <thm:maximum-connected-subgroup-is-normal-and-isomorphic>

#proof[
  首先不难证明 $H$ 是 $G$ 上的开集和子群，因此问题的全部前述条件都成立。

  对于第一部分：由于 $H$ 路径连通，对于任意 $h in H$，一定存在连接 $e$ 和 $h$ 的连续路径 $gamma : [0, 1] -> H, gamma(0) = e, gamma(1) = h$。将左乘映射 $L_g$ 作用在 $gamma$ 上，得到的路径 $L_g compose gamma$ 连接 $g$ 和 $g h$ 仍然是连续的。再将右乘映射 $R_(g^(-1))$ 作用在这个路径上，得到的路径 $R_(g^(-1)) compose L_g compose gamma$ 连接 $g g^(-1) = e$ 和 $g h g^(-1)$，并且同样是一个连续路径。又由于 $H$ 是包含 $e$ 的最大路径连通子集，因此 $g h g^(-1) in H$，$H$ 正规。

  对于第二部分：假设 $U$ 是 $G$ 的另一个最大路径连通子集，则任取 $u in U$，定义微分同胚 $phi : H -> U, x mapsto u x$。不难证明该映射为双射且逆映射为 $phi^(-1) : U -> H, x mapsto u^(-1) x$。同时，不难证明这个映射是光滑映射，且逆映射 $phi^(-1)$ 同样是光滑映射。因此两个集合微分同胚。
]

这个定理告诉我们，$G$ 上所有的连通分支都和从 $e$ 出发的这个连通分支 $H$ 是一模一样的，并且由于 $H$ 是 $G$ 的正规子群，我们可以对 $G$ 和 $H$ 做商，得到的群 $G\/H$ 就是“把每个连通分支当成一个元素构成的群”。

#figure(
  cetz-canvas({
    import cetz.draw: *
    let component-stroke = 0.9pt
    let point-radius = 0.08

    // All four connected components together form G.
    rect(
      (-2.35, -2.35),
      (7.35, 7.75),
      stroke: (thickness: 0.9pt, dash: "dashed"),
    )
    content((2.5, 7.98), [$G$])

    // Four connected components of G.
    circle((0, 0), radius: 2, stroke: component-stroke)
    circle((5, 0), radius: 2, stroke: component-stroke)
    circle((0, 5), radius: 2, stroke: component-stroke)
    circle((5, 5), radius: 2, stroke: component-stroke)

    // The identity component H and its distinguished point e.
    content((0, 2.3), [$H$])
    circle((0, 0), radius: point-radius, fill: black, stroke: none)
    content((0, -0.34), [$e$])

    // An irregular neighborhood W of e inside H.
    line(
      (-0.85, -0.55),
      (-0.42, -0.86),
      (0.36, -0.72),
      (0.82, -0.25),
      (0.72, 0.38),
      (0.16, 0.78),
      (-0.55, 0.58),
      (-0.86, 0.12),
      close: true,
      fill: rgb("#4dabf7").transparentize(68%),
      stroke: rgb("#4dabf7"),
    )
    content((1.06, 0.44), text(fill: rgb("#4dabf7"))[$W$])

    // Eight equally spaced arrows show that <W> expands to all of H.
    line((0.88, 0.00), (1.70, 0.00), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((0.62, 0.62), (1.20, 1.20), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((0.00, 0.88), (0.00, 1.70), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((-0.62, 0.62), (-1.20, 1.20), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((-0.88, 0.00), (-1.70, 0.00), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((-0.62, -0.62), (-1.20, -1.20), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((0.00, -0.88), (0.00, -1.70), mark: (end: ">"), stroke: rgb("#1971c2"))
    line((0.62, -0.62), (1.20, -1.20), mark: (end: ">"), stroke: rgb("#1971c2"))

    // Another connected component and a representative point g.
    circle((5.66, 5.34), radius: point-radius, fill: black, stroke: none)
    content((5.91, 5.56), [$g$])
    content((5, 7.3), [$g H$])
  }),
  caption: [商群 $G\/H$ 把 $G$ 的每个连通分支压缩为一个元素。包含单位元的连通分支是 $H$；另一个连通分支是其左陪集 $g H$。],
)

这种不连通的李群的例子也不少，比如 $G L(n, RR)$ 就包含了两个不连通的部分：${A in RR^(n times n) | det(A) > 0}$ 和 ${A in RR^(n times n) | det(A) < 0}$。显然不存在一个路径连接这两个部分，因为 $det$ 是一个连续函数，如果这样的路径存在的话一定会跨越 $det A = 0$ 的某个矩阵 $A$，而 $det A = 0$ 不在 $G L(n)$ 中。如果我们从单位元 $I_n$ 的邻域出发生成一个群 $H$，那么这个群只能覆盖 $det A > 0$ 的部分；而如果我们接下来 $G L(n)$ 关于 $H$ 做商，则会得到一个简单二元群 $ZZ \/ 2 ZZ$。

对于我们关心的大部分李群，用单位元邻域的生成群做商之后得到的商群通常都是一个非常简单的结构（比如 $G L(n)$ 和 $O(n)$ 都会得到 $ZZ \/ 2 ZZ$）。因此，我们可以认为关于李群最重要的特征都已经包含在了 $e$ 的这个邻域里。

= 李代数——切空间上的代数 <sec:lie-algebra>

之前的推理告诉我们，李群 $G$ 上只要取一小块单位元附近的开集，做生成群，就可以获得包含了 $G$ 重要特征的子群。如果我们把这个开集取得越来越小，最终取到无限小，那么直观上来想，它就变成了 $e$ 点上的切空间。而前几章的微分几何早已教给我们许多数学工具来描述流形上一个点附近无限小的空间。

单位元 $e$ 的切空间就被定义为李群 $G$ 的*李代数*。

#definition[
  李群 $G$ 的*李代数（Lie Algebra）*为 $G$ 单位元 $e$ 的切空间 $T_e G$。记作 $frak(g) = T_e G$。

  注：李代数的严谨定义需要在向量空间 $T_e G$ 的基础上加上李括号 $[dot, dot] : T_e G times T_e G -> T_e G$。不过出于简化起见，这篇文章里暂且将李代数这样定义。
]

不过，切空间 $T_e G$ 毕竟是 $e$ 点局部的一个空间，里面的元素不能直接对应到弯曲流形 $G$ 上。因此，我们还需要一个映射将 $frak(g) = T_e G$ 中的元素映射到 $G$ 上。可以使用类似之前在黎曼流形上定义测地线的方法（不过注意李群通常不会自带一个规范的黎曼度规，而测地线和我们接下来要定义的概念也不见得相同）：如果能够通过某种方法将 $v in T_e G$ “移动”到空间的其他位置，我们就可以沿着向量 $v$ 的方向一直往前走了。不过好在李群里每个元素 $g in G$ 对应的左乘运算 $L_g$ 天生就是一个 $G$ 到自身的光滑映射，而光滑映射的微分就是切空间之间的映射。我们不妨使用这个映射来构造一个全局向量场。

#definition[
  对于任何李代数中的元素 $v in T_e G$，可以构造向量场 $V : frak(X)(G)$，满足对于任意 $g in G$：

  $ V_g := (dif L_g)_e v in T_g G $

  这个向量场被称作 $v$ 的*左不变向量场*。每个向量 $v$ 都对应着唯一的一个左不变向量场。
] <def:left-invariant-vector-field>

#theorem[
  $v in frak(g)$ 的左不变向量场 $V$ 满足：对于任意 $g in G$，

  $ (dif L_g)_h V_h = V_(g dot h) $

  换句话说，向量场 $V$ 在映射 $L_g$ 下的推前向量场 $(L_g)_* V$ 仍然是自身。
]

#proof[
  根据 @def:left-invariant-vector-field，有 $V_h = (dif L_h)_e v$，$V_(g dot h) = (dif L_(g dot h))_e v$。代回原式左侧：

  $
    (dif L_g)_h V_h &= (dif L_g)_h (dif L_h)_e v \
    &= (dif L_g compose L_h)_e v \
    &= (dif L_(g dot h))_e v \
    &= V_(g dot h)
  $
]

从 $e$ 出发，沿着左不变向量场 $V$ 的方向走，我们就得到了一条路径。

#definition[
  对于一般的流形 $M$ 和 $M$ 上的向量场 $X : frak(X)(M)$，如果路径 $gamma : C^infinity ([0, 1], M)$ 满足 $forall t in [0, 1], dot(gamma)(t) = X(gamma(t))$，则称 $gamma$ 为 $X$ 的一条*积分路径*。
]

李代数中的元素 $v in frak(g)$ 对应一个唯一的左不变向量场 $V$，而这个向量场从 $e$ 出发的积分路径就记作 $exp(t v)$，其中 $t in I subset.eq RR$ 就是路径的参数。可以证明对于李群，左不变向量场 $V$ 是完备的，$exp(t v)$ 中的 $t$ 可以取任意实数。

#theorem[
  向量 $v in frak(g)$ 生成的左不变向量场 $V$ 是完备的。即：过 $G$ 上任意一点 $a in G$ 都有一条定义域为全体实数 $RR$ 的积分路径 $gamma : RR -> G$。
]

#proof[
  对于 $V$ 的积分路径 $gamma : I -> G$，不妨设 $0 in I$。可以用左乘映射 $L_(gamma(0)^(-1))$ 将 $gamma$ 的起点移动到单位元 $e$ 上。由于 $L_(gamma(0)^(-1))$ 连续，且左不变向量场 $V$ 在映射 $L_(gamma(0)^(-1))$ 下的推前仍然是自身，因此只需要证明 $V$ 从 $gamma(0) = e$ 出发的这一条积分路径对全体实数 $RR$ 有定义即可证明整个向量场 $V$ 是完备的。

  由于 $V$ 光滑，根据微分方程解的存在性定理，方程 $dot(gamma)(t) = V(gamma(t))$ 在 $t=0$ 的邻域上一定存在唯一解。不妨设该邻域包含开区间 $(-epsilon, epsilon)$。使用左乘映射 $L_(gamma(t))$ 可以证明，对于任意 $gamma$ 定义域上的 $t in I$，该微分方程同样在 $(t - epsilon, t + epsilon)$ 区间上有解。而任意长度为 $L > 0$ 的区间都可以被不超过 $ceil(L / epsilon) + 1$ 个形如 $(t - epsilon, t + epsilon)$ 的区间覆盖，因此曲线 $gamma(t)$ 的定义域一定包含整个实数轴 $RR$。
]

对于向量 $v in frak(g)$ 和实数 $k$，不难看出，$k v$ 生成的左不变向量场的每个向量都会是 $v$ 对应向量场 $V$ 的 $k$ 倍，因此 $exp(t (k v))$ 可以看作是曲线 $exp(t v)$ 在时间轴上压缩了 $k$ 倍，即 $exp(t (k v)) = exp((t k) v)$。也就是说，我们的记号是合理的——$exp$ 函数实际上只需要输入一个向量作为参数，给 $v$ 乘上一个常数等价于重新参数化这条路径，反过来改变时间参数 $t$ 也等价于改变向量 $v$ 的长度。

当固定 $t = 1$ 的同时变化向量 $v$，就得到了函数 $exp : frak(g) -> G, v mapsto exp(v)$。这个映射就被称作*指数映射（Exponential Map）*。

#definition[
  对于李群 $G$、李代数 $frak(g)$、以及任意向量 $v in frak(g)$，定义 $v$ 的左不变向量场 $V$ 从单位元 $e$ 出发的积分路径为 $exp(t v)$。
] <def:lie-exponential>

通过下面的例子，你就会看到为什么这个映射叫指数映射。

== 矩阵的指数

我相信读到这里的读者都有一定的微分方程与线性代数的知识，或许已经见过一阶线性微分方程组#strike[并且被它折磨过]了。如果你没有见过，我们在这里也简要回顾一下：对于一个关于时间 $t$ 的向量函数 $mathbf(x) : I subset.eq RR -> RR^n, t mapsto x(t)$，下面这个微分方程

$ (dif mathbf(x)) / (dif t) = A mathbf(x) $ <eq:first-order-linear-system>

是一个一阶微分方程组。其中 $A in RR^(n times n)$ 是一个矩阵。

一元常微分方程 $(dif x) / (dif t) = a x$ 的解是 $x = x_0 e^(a t)$。类似地，上面这个多元常微分方程的解也可以写成类似指数函数的形式。定义

$ overline(exp)(A) = I + A + A^2 / 2! + A^3 / 3! + dots.c = sum_(k = 0)^infinity A^k / k! $ <eq:matrix-exponential>

为了与 @def:lie-exponential 中定义的指数映射做区分，这里使用带上划线的 $overline(exp)$ 来表示这个无穷级数。我们暂且将这个函数称作*矩阵指数*。可以证明，@eq:first-order-linear-system 的解就是：

$ mathbf(x)(t) = overline(exp)(t A) mathbf(x)_0 $

其中 $mathbf(x)_0 = mathbf(x)(0)$ 是系统的初始状态。验证这个解也很简单，只需代入 @eq:matrix-exponential 的定义再对 $t$ 求导即可。

矩阵指数有很多优秀的性质。比如，$overline(exp)(t A)$ 关于 $t$ 的导数同样与一元指数函数的导数有相同形式的表达式：

$ (dif overline(exp)(t A)) / (dif t) = A overline(exp)(t A) = overline(exp)(t A) A $ <eq:derivative-of-matrix-exponential>

这点不难用 $M mapsto A M$ 和 $M mapsto M A$ 映射的连续性结合 @eq:matrix-exponential 来证明，在此不多赘述。反过来，根据微分方程解的唯一性，也可以证明只有唯一的一个函数 $X(t)$ 满足 $dot(X)(t) = A X$（或者 $dot(X)(t) = X A$）和初始条件 $X(0) = I_n$，因此 @eq:derivative-of-matrix-exponential 也可以作为矩阵指数 $overline(exp)$ 的定义式。

回忆一下一阶线性系统该怎么求解。假设 $A$ 可以对角化，那么对矩阵 $A$ 做特征值分解，得到 $Q Lambda Q^(-1)$，就可以将这个多元线性系统 $dot(mathbf(x)) = A mathbf(x)$ 拆成多个一元线性系统：

$ (dif mathbf(x)) / (dif t) = Q Lambda Q^(-1) mathbf(x) $

$ Q^(-1) (dif mathbf(x)) / (dif t) = (dif Q^(-1) mathbf(x)) / (dif t) = Lambda Q^(-1) mathbf(x) $

令 $mathbf(u) = Q^(-1) mathbf(x)$。则原式变成了关于 $mathbf(u)$ 的一个线性系统：

$ (dif mathbf(u)) / (dif t) = Lambda mathbf(u) $ <eq:linear-system-transformed>

由于 $Lambda$ 为对角阵，上式中的各个分量 $u_i$ 可以拆开，写成一个单独的一元微分方程 $dot(u)_i = lambda_i u_i$。而这个方程的求解想必大家已经非常熟悉了：

$ u_i = u_(i 0) e^(lambda_i t) $

$ mathbf(u) = mat(e^(lambda_1 t),,,;,e^(lambda_2 t),,;,,dots.down,;,,,e^(lambda_n t)) mathbf(u_0) = overline(exp)(t Lambda)mathbf(u)_0 $ <eq:exponential-of-diagonal-matrix>

其中 @eq:exponential-of-diagonal-matrix 第二个等号来自于 @eq:matrix-exponential 中给出的定义。

记 $mathbf(x)_0 = Q mathbf(u)_0$，则有：

$ mathbf(x) = Q mathbf(u) = Q overline(exp)(t Lambda) Q^(-1) mathbf(x)_0 $

不难验证此处的 $mathbf(x)_0 = mathbf(x)(t=0)$。换句话说，$overline(exp)(t A) = Q overline(exp)(t Lambda) Q^(-1)$。通过以上推理不难证明：

#theorem[
  若 $A$ 可以对角化，则任何 $A$ 的特征向量都同时是 $overline(exp)(A)$ 的特征向量。更具体地，$A mathbf(v)_i = lambda_i mathbf(v)_i$，则有 $overline(exp)(A) mathbf(v)_i = e^(lambda_i) mathbf(v)_i$。
] <thm:eigenvalues-of-exponential-matrix>

#theorem[
  若 $A$ 可以对角化，则 $det(overline(exp)(A)) = e^(tr(A))$
] <thm:det-of-exponential-eq-exponential-of-trace>

#theorem[
  若 $A$ 可以对角化，则 $overline(exp)(-A) = overline(exp)(A)^(-1)$
] <thm:exponential-of-negative-eq-inverse-of-exponential>

其中 @thm:det-of-exponential-eq-exponential-of-trace 和 @thm:exponential-of-negative-eq-inverse-of-exponential 可以推广到一般矩阵上，只不过需要将特征值分解中间的对角矩阵换成 Jordan 标准型。根据上述结论，以下定理读者自证不难：

1. 矩阵指数的行列式一定大于$0$。因此，$overline(exp)(A) in G L(n, RR)$。
2. $overline(exp)(0) = I_n$，其中 $0 in RR^(n times n)$ 为零矩阵，即所有元素全部为$0$的矩阵，$I_n$ 为 $n$ 阶单位矩阵。

== 矩阵指数与李群的指数映射

可能你已经从我们使用的记号中猜到了：@eq:derivative-of-matrix-exponential 与之前在李群上定义的矩阵映射 $exp : frak(g l)(n, RR) -> G L(n, RR)$ 其实是一样的！

从直观上来想，李群的指数映射表示从单位元出发反复施加某个特定方向的变换所得到的路径，而 @eq:derivative-of-matrix-exponential 告诉我们，矩阵的指数同样可以看作是从单位矩阵 $I_n$ 出发、反复施加同一个矩阵变换所得到的路径。只不过这只能作为一个粗略理解，我们还需要用严谨的数学语言来表述和证明这个定理。更具体地说，我们需要先说明

1. $frak(g l)(n, RR)$ 里的元素可以写成矩阵的形式。
2. 在某点 $X in G L(n, RR)$ 沿着 $A in frak(g l)(n, RR)$ 生成的左不变向量场向前走，所得到的速度向量正好是 $X A$。这样我们能够用 $overline(exp)$ 的定义式（@eq:derivative-of-matrix-exponential）来说明 $exp = overline(exp)$。

回忆一下，微分流形上一个点 $p$ 附近的切向量 $[gamma] in T_p M$ 是该点所有速度相同的路径的集合。将这个定义里的流形 $M$ 换成 $G L(n, RR)$，由于 $G L(n, RR) subset RR^(n times n)$，每个点都天然有一个 $RR^(n times n)$ 上的坐标，因此一条 $G L(n, RR)$ 上的路径的每个点上的速度向量（也就是切向量）也天然是一个 $RR^(n times n)$ 的矩阵。“切向量是矩阵”听起来可能有点怪，不过这也证明了第一点：$frak(g l)(n, RR)$ 确实可以看作是一个矩阵空间。

接下来我们只需要推导这个左不变向量场上每个向量的表达式就可以了。

对于任何一个 $G L(n, RR)$ 上的矩阵 $A in G L(n, RR)$，其左乘映射为 $L_A : B mapsto A B$。任取一条 $G L(n, RR)$ 上的光滑路径 $Gamma : C^(infinity) ([0, 1], G L(n, RR))$，其中路径上的每个点 $Gamma(t)$ 都是一个矩阵。根据导数的性质，有：

$ (dif (L_A compose Gamma)(t)) / (dif t) = (dif A Gamma(t)) / (dif t) = A (dif Gamma(t)) / (dif t) $

根据流形上微分的定义，$dif/(dif t)(L_A compose Gamma) |_t = (dif L_A)_(Gamma(t)) dot(Gamma)(t)$，再结合上式，我们就可以说，对于任意 $M in G L(n, RR)$：

$ (dif L_A)_M : T_M G L(n, RR) subset.eq RR^(n times n) -> T_(A M) G L(n, RR) $

的表达式就等于在输入切向量上左乘矩阵 $A$，即 $forall M in G L(n, RR), (dif L_A)_M = L_A$。值得注意的是，$(dif L_A)_M$ 只与左乘的矩阵 $A$ 有关，与求导位置 $M$ 无关。

有了这个性质之后就不难看出，任取 $B in frak(g l)(n, RR)$，$B$ 生成的左不变向量场在任何一点 $A in G L(n, RR)$ 上的取值就是 $(dif L_A)_(I_n) B = A B$。那么，如果路径 $X : C^infinity ([0, 1], G L(n, RR))$ 是 $B$ 的左不变向量场的积分路径，那么就有：

$ X(t) = exp(t B) <=> (dif X(t)) / (dif t) = (dif L_(X(t)))_(I_n) B = X(t) B, X(0) = I_n $

根据 @eq:derivative-of-matrix-exponential，这里的 $X$ 就是矩阵 $B$ 的矩阵指数 $overline(exp)(t B)$。换句话说，李群的指数映射 $exp$ 可以看作是矩阵指数 $overline(exp)$ 在一般李群上的推广。

上述推导不仅适用于 $G L(n, RR)$，任何 $G L(n, RR)$ 的李子群也适用。比如机器人学和控制学中常用的三维旋转群 $S O(3)$，其李代数 $frak(s o)(3) subset RR^(3 times 3)$ 就是由所有三阶反对称矩阵构成的。

== 指数映射的性质

指数映射将李群单位元上的切空间映射到了李群本身。可以证明，指数映射 $exp$ 的值域能够覆盖单位元附近的一块开邻域。不过指数映射并不能保证覆盖整个李群 $G$，也不保证一定是单射。

@thm:identity-connected-neighbourhood-generates-maximum-connected-subset 可能会让你猜测，如果李群 $G$ 是连通的，那么 $exp$ 就是满射。但很可惜，这个猜想也是错的。比如，一个反例是 $S L(2, RR)$ 上的元素 $mat(-2, 0; 0, -1/2)$。这个元素能够拆成下面两个矩阵指数的乘积：

$ mat(-2, 0; 0, -1/2) = mat(-1, 0; 0, -1)mat(2, 0; 0, 1/2) = exp(mat(0, pi; -pi, 0)) exp(mat(ln 2, 0; 0, -ln 2)) $

但它不能写成任何单个实矩阵的指数：实矩阵的所有非实特征值必须成对出现，每一对的实部相等、虚部相反。而 $mat(-2, 0; 0, -1/2)$ 的特征值分别为 $-2$ 和 $-1/2$，取复对数之后得到 $ln 2 + (2 k + 1) pi i$ 和 $- ln 2 + (2 k + 1) pi i$，实部不同。因此这个矩阵不能被写成任何一个实矩阵的指数。

不过 @thm:identity-connected-neighbourhood-generates-maximum-connected-subset 确实保证了一件事：由于 $exp$ 的值域覆盖了 $e$ 附近的一块开集，所有 $G$ 中 $e$ 对应的连通分支上的元素都可以被展开成有限个 $frak(g)$ 中元素的指数的连乘。上面的例子也说明了这一点。

这篇文章已经有点长了，就先写到这里了。之后有时间的话再写写李代数上的运算、李括号、以及 Campbell-Baker-Hausdorff 公式这些内容。

#bibliography("reference.bib")
