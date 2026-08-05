// title: 狭义相对论光线追踪 原理解析 1
// summary: 从洛伦兹变换出发到四维矢量与闵可夫斯基空间，推导任意方向的洛伦兹变换、狭义相对论光相差。
// tags: physics, special-relativity, computer-graphics
// category: tech

#import "../../template.typ": article, mathbf

#show: article.with(
  title: "狭义相对论光线追踪 原理解析 1",
  lang: "zh",
)

前置知识：狭义相对论。

先温习一遍课本里的洛伦兹变换（Lorentz transformation）：如果参考系$S'$相对于$S$的速度为$u$，沿着$x$轴正方向，那么事件 $(t, x, y, z)$ 在$S'$参考系中测量的结果是：

$ cases(t' = gamma (t - u/c^2 x), x' = gamma (x - u t), y' = y, z' = z) $

其中$c$为光速，并且

$ gamma = 1 / sqrt(1 - u^2 / c^2) $

= 四维矢量和闵可夫斯基空间

洛伦兹变换有一大性质：如果两个事件$mathbf(r)_1$和$mathbf(r)_2$，那么不论在哪个惯性参考系中看，这个物理量：

$ s^2 = -(c Delta t)^2 + Delta x^2 + Delta y^2 + Delta z^2 $

是永远不变的。$s$被称为*闵可夫斯基度规（Minkowski metric）*，或者*闵氏度规*。

这启发了我们，可以定义一个四维矢量来表示事件。为了保证单位一致，第一维是光速乘上时间，后三维是空间。像这样：

$ mathbf(r) = (c t, x, y, z) = (c t, arrow(r)) $

_（为了方便区分，本文中所有四维向量均用粗体表示，三维向量均用箭头表示）_

然后向量的模长公式不再是平方求和后再相加，而是：

$ ||mathbf(r)|| = sqrt(-(c t)^2 + x^2 + y^2 + z^2) $

把时间平方项的正号改成负号。这样的话，两个事件$mathbf(r)_1$和$mathbf(r)_2$之间的*距离*（或者说：闵氏度规）就是：

$ s = ||mathbf(r)_2 - mathbf(r)_1|| $

你可能会觉得为了凑出$-t^2$而强行修改向量模长定义的行为很无耻。但是，它其实是是一种和我们熟悉的空间（即：欧几里得空间/欧氏空间）完全不同的*几何*规则，也就是*闵可夫斯基几何\/闵氏几何*。毕竟，没有规定说我们的宇宙一定遵守欧氏几何这种符合人类直觉的规律。

所有满足这个奇怪的模长公式的向量构成了一个向量空间，即*闵可夫斯基空间*，或者也可以叫*闵可夫斯基时空*。在闵氏空间里，向量的第一维和后三维的地位并不相同。

闵氏空间里，向量点乘（内积）的定义也被修改了：向量$mathbf(u)$和$mathbf(v)$的点乘是：

$ mathbf(u) dot mathbf(v) = -u_t v_t + u_x v_x + u_y v_y + u_z v_z $

而洛伦兹变换就是一个4×4的矩阵：

$ Lambda = mat(gamma, -u/c gamma, 0, 0; -u/c gamma, gamma, 0, 0; 0, 0, 1, 0; 0, 0, 0, 1) $

将事件在$S$系中的测量结果$mathbf(r)$转到$S'$系测量，就相当于用矩阵$Lambda$乘上$mathbf(r)$：

$ mathbf(r)' = Lambda mathbf(r) $

= 任意方向的洛伦兹变换

刚刚的讨论里，相对速度$u$都是沿着$x$轴正方向的。但是如果$u$不是呢？

可以这样想：把一个事件$mathbf(r)$的空间分量$arrow(r)$分解成平行于速度分量$arrow(r)_parallel$和垂直于速度的分量$arrow(r)_perp$。

$ arrow(r)_parallel = (arrow(r) dot arrow(n)) arrow(n) = (arrow(r) dot arrow(u)/(||arrow(u)||)) arrow(u)/(||arrow(u)||) $

$ arrow(r)_perp = arrow(r) - arrow(r)_parallel $

其中 $ arrow(n) = arrow(u)/(||arrow(u)||) $ 是速度$arrow(u)$方向上的单位向量。

经过变换之后，垂直于速度的$arrow(r)_perp$分量不变，而$arrow(r)_parallel$会变成$gamma(arrow(r)_parallel - arrow(u) t)$。

$ arrow(r)' &= arrow(r)_perp + gamma (arrow(r)_parallel - arrow(u) t) \
  &= (arrow(r) - (arrow(r) dot arrow(n)) arrow(n)) + gamma ((arrow(r) dot arrow(n)) arrow(n) - arrow(u) t) \
  &= arrow(r) + (gamma - 1)(arrow(r) dot arrow(n)) arrow(n) - gamma arrow(u) t $

而时间变换则简单一些：

$ t' &= gamma (t - u/c^2 r_parallel) \
  &= gamma (t - arrow(u)/c^2 dot arrow(r)) $

将上面的变换公式写成矩阵，就是：

$ mat(c t'; x'; y'; z') = mat(gamma, -gamma u_x/c, -gamma u_y/c, -gamma u_z/c; -gamma u_x/c, 1 + (gamma-1) n_x^2, (gamma-1) n_x n_y, (gamma-1) n_x n_z; -gamma u_y/c, (gamma-1) n_y n_x, 1 + (gamma-1) n_y^2, (gamma-1) n_y n_z; -gamma u_z/c, (gamma-1) n_z n_x, (gamma-1) n_z n_y, 1 + (gamma-1) n_z^2) mat(c t; x; y; z) $

也就是说，速度$arrow(u)$方向任意的洛伦兹变换矩阵就是：

$ Lambda(arrow(u)) = mat(gamma, -gamma u_x/c, -gamma u_y/c, -gamma u_z/c; -gamma u_x/c, 1 + (gamma-1) n_x^2, (gamma-1) n_x n_y, (gamma-1) n_x n_z; -gamma u_y/c, (gamma-1) n_y n_x, 1 + (gamma-1) n_y^2, (gamma-1) n_y n_z; -gamma u_z/c, (gamma-1) n_z n_x, (gamma-1) n_z n_y, 1 + (gamma-1) n_z^2) $

其中

$ gamma = 1 / sqrt(1 - (||arrow(u)||^2)/c^2) $

可以检验，当$arrow(u)$的大小为$u$而方向指向$x$轴正半轴时，$Lambda(arrow(u))$和之前给出的矩阵相等。

= 速度变换

任何一个物体的运动都可以表示成闵氏时空中的一条曲线。在$S$系中，物体的速度是：

$ arrow(v) = (dif arrow(r)) / (dif t) $

而$S'$系中，同一个物体的速度是：

$ arrow(v)' = (dif arrow(r)') / (dif t') $

我们的目的就是将$arrow(v)'$表示成$arrow(v)$，$arrow(u)$，以及其他$S$系中可测量的物理量。为了用$arrow(v)$表示$arrow(v)'$，可以先用一个链式法则：

$ arrow(v)' &= (dif arrow(r)')/(dif t') \
  &= (partial arrow(r)')/(partial t) (dif t)/(dif t') + (partial arrow(r)')/(partial x) (dif x)/(dif t') + (partial arrow(r)')/(partial y) (dif y)/(dif t) + (partial arrow(r)')/(partial z) (dif z)/(dif t) \
  &= sum_(i=1)^4 (partial arrow(r)')/(partial mathbf(r)_i) (dif mathbf(r)_i)/(dif t') $

其中$mathbf(r)_i$为$mathbf(r)$的第$i$个分量。偏导数 $(partial arrow(r)')/(partial mathbf(r)_i)$ 很好求，接下来只需要求出全导数 $(dif mathbf(r)_i)/(dif t')$ 即可。

这里我们还可以用一个链式法则：

$ (dif mathbf(r)_i)/(dif t') &= ((dif t')/(dif mathbf(r)_i))^(-1) \
  &= (sum_(j=1)^4 (partial t')/(partial mathbf(r)_j) (dif mathbf(r)_j)/(dif mathbf(r)_i))^(-1) $

不难想到，

$ (dif x)/(dif t) = v_x, quad (dif y)/(dif t) = v_y, quad (dif z)/(dif t) = v_z $

$ (dif x)/(dif y) = v_x/v_y, quad (dif y)/(dif z) = v_y/v_z, quad (dif z)/(dif x) = v_z/v_x $

也就是说，任何形如 $(dif mathbf(r)_j)/(dif mathbf(r)_i)$ 的表达式，都可以表示成速度分量的比值。然后把这些东西再带回原式，就可以算出来了。

由于过程太长，我就不全打出来了。以下是答案：

$ arrow(v)' = 1/(1 - (arrow(u) dot arrow(v))/c^2) (arrow(v)/gamma - arrow(u) + 1/c^2 gamma/(gamma+1) (arrow(u) dot arrow(v)) arrow(u)) $

遗憾的是，速度变换并不是线性变换，所以没办法写成矩阵形式。

= 光相差（Relativistic Aberration）

我们可以把光线当成是运动速度为光速的物体，那么同样可以对其进行速度变换。

代入前面的速度变换公式，不难检验，若在$S$系中速度$v$大小为光速，那么经过速度变换之后，$S'$系中$v'$也是光速。这又被称为：*光速不变原则*，光速运动的物体无论在哪个参考系中都是光速运动的。

但是需要注意，在两个参考系中，光的方向会发生变化。

如果在静止的参考系里，从一个点在各个方向上均匀发出光线：

#image("rel-plot-1.png", width: 70%)

那么在一个朝右运动的参考系里，光线的方向不再均匀，而是向运动的反方向聚集：

#image("rel-plot-2.png", width: 70%)

类似地，在一个接收光线的观察者看来，如果它在以接近光速运动，会有更多光线朝着它面前打过来，而它背后的光线就会减弱。

这个光线角度在运动参考系中发生偏转的现象就被称为：狭义相对论光相差。

#quote(block: true)[
鉴于本文作者比较菜，如果您在阅读时发现了任何错误，欢迎在#link("/")[主页]评论区指出！
]
