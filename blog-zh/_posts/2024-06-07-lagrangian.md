---
title: 数值模拟之：最小作用量原理
layout: blog
tags: ["physics", "computer-science", "math-modeling"]
---

阅读本文的前置知识：

1. 了解泛函的概念和变分法的应用。不一定需要理解泛函的数学原理~~因为我也不会~~。
2. 了解拉格朗日力学的基本概念。

若没有看过上一篇关于数值模拟的博客：“[数值模拟之：弹簧质点系统]({% link blog-zh/_posts/2023-07-06-spring-mass.md %})”，强烈推荐先阅读那篇文章。

## 拉格朗日力学

现在你的眼前有一个小球飞了过去。你知道小球在$t_1$时刻和$t_2$时刻的位置，并且知道小球在每个点上的受力，那么你能计算出小球经过的轨迹吗？

这就是拉格朗日力学尝试回答的问题。[**拉格朗日力学（Lagrangian Mechanics）**](https://en.wikipedia.org/wiki/Lagrangian_mechanics)是一套与我们高中学过的[**牛顿力学（Newtonian Mechanics）**](https://en.wikipedia.org/wiki/Classical_mechanics#Newtonian_mechanics)在数学上等价的理论。与牛顿力学里用**力**来描述物体间相互作用不同，拉格朗日力学给物理系统定义了一个**拉格朗日量**$\mathcal L$，而系统演化的方式就是沿着$\mathcal L$的总和最小的路径走。即让物理量

$$S=\int_{t_1}^{t_2}\mathcal L(t, q, \dot q)\mathrm dt$$

最小化。

相信大家在高中光学中学过了[费马原理](https://en.wikipedia.org/wiki/Fermat's_principle)，即：光从A点到B点的路径是使得光线总用时最短的路径。拉格朗日力学的思想与其非常相似，只不过将*光的路径*换成了*系统广义路径*，*总用时*换成了*总拉格朗日量*。这个原理又叫做[**最小作用量原理**](https://en.wikipedia.org/wiki/Stationary-action_principle)。

![费马原理](/img/Fermat_Snellius.svg)*费马原理。图源：[Wikipedia](https://en.wikipedia.org/wiki/Fermat's_principle)*

以上为拉格朗日力学的简要介绍。当然，此文的重点不是前面介绍的拉格朗日力学的数学理论。当物理系统的拉格朗日量比较简单的时候，可以用[**欧拉-拉格朗日方程**]()写出系统的偏微分方程。但若系统的拉格朗日量复杂到难以用偏微分方程求解析解，并且不得不用最小作用量方法求解的时候，我们就需要一个基于拉格朗日力学的求解器。接下来我将详细介绍近期做的一个小项目，即：*基于最小作用量原理的物理模拟*。

## 泛函导数

设$q_i$为系统的广义坐标系，$\mathcal L(t, q, \dot q)$为系统的拉格朗日量。那么对于每一个从$(t_1, q_1)$到$(t_2, q_2)$的路径，都会有唯一一个对应的作用量泛函$S[q]$。而我们的目的就是找到一个$q(t)$函数满足以下几个条件：

1. $q(t)$连续且有界
2. $q(t_1)=q_1, q(t_2)=q_2$
3. 在所有符合上两条的$q(t)$中，$S[q]$最小

<!-- TODO: 插图 -->

如果你写过梯度下降等凸优化算法的话，你可能会发现：这几个要求和凸优化算法非常像，只不过是将被优化的自变量从一个向量变成了一个函数。那么一个自然的想法是：我们能不能用类似凸优化的方法来找到这个最优的$q(t)$？

为了使用梯度下降，我们需要先定义泛函$S[q]$关于$q$的“梯度”。而这在泛函分析中已经有[现成的定义](https://en.wikipedia.org/wiki/Functional_derivative)了。假设我们在某条路径$q(t)$上加入一个微小的变化，变成$q(t)+\delta q(t)$，则$S$会变成：

$$
\begin{align*}
S[q+\delta q] &= \int_{t_1}^{t_2}\mathcal L(t, q+\delta q, \dot q+\delta\dot q)\mathrm dt \\
&= \int_{t_1}^{t_2}\left[\mathcal L(t, q, \dot q)+\frac{\partial \mathcal L}{\partial q}\delta q(t)+\frac{\partial \mathcal L}{\partial\dot q}\delta\dot q(t)\right]\mathrm dt
\end{align*}
$$

<!-- TODO: 插图 -->

因此：

$$\delta S[q]=S[q+\delta q]-S[q]=\int_{t_1}^{t_2}\left[\frac{\partial \mathcal L}{\partial q}\delta q(t)+\frac{\partial \mathcal L}{\partial\dot q}\delta\dot q(t)\right]\mathrm dt$$

这里我们用$\delta q$来表示函数本身的变化（即变分）。$\mathrm dt$用来表示函数自变量（此处为时间$t$）的微小变化。

将$\delta\dot q(t)$替换成$\frac{\partial}{\partial t}\delta q(t)$，并使用一步分部积分，我们就能得到：

$$
\begin{align*}
\delta S[q] &=\int_{t_1}^{t_2}\left[\frac{\partial \mathcal L}{\partial q}\delta q(t)+\frac{\partial \mathcal L}{\partial\dot q}\frac{\partial \delta q(t)}{\partial t}\right]\mathrm dt \\
&= \int_{t_1}^{t_2}\frac{\partial \mathcal L}{\partial q}\delta q(t)\mathrm dt + \left[\frac{\partial \mathcal L}{\partial \dot q}\delta q(t)\right]_{t_1}^{t_2}-\int_{t_1}^{t_2}\delta q(t)\frac{\partial}{\partial t}\frac{\partial \mathcal L}{\partial\dot q}\mathrm dt
\end{align*}
$$

由于$q(t)$的左右端点被限制住了，因此$\delta q(t)$不能改变左右两个端点的取值，即$\delta q(t)$必须满足：

$$\delta q(t_1)=\delta q(t_2)=0$$

那么我们就可以直接消去上式中的第二项，而最终结果就是：

$$\delta S[q] = \int_{t_1}^{t_2}\left(\frac{\partial \mathcal L}{\partial q}-\frac{\partial}{\partial t}\frac{\partial \mathcal L}{\partial \dot q}\right)\delta q(t)\mathrm dt$$

你可能会问，这不就是把欧拉-拉格朗日方程重新推导了一遍吗？但这里我们可以将这个方程重新解读。发现没有，这个方程和标量场方向导数的方程几乎一模一样：

$$\Delta \phi(x)=\vec \nabla \phi(\vec x)\cdot \Delta\vec x$$

由于在泛函里，*点积*$\vec v\cdot\vec w$就类比成函数积分$\int_{t_1}^{t_2}f(t)g(t)\mathrm dt$。所以我们可以说，作用量$S[q]$关于路径$q$的**泛函导数**是：

<a id="equation-1"></a>

$$
\begin{equation}
\frac{\partial S}{\partial q}=\left(\frac{\partial\mathcal L}{\partial q}-\frac{\partial}{\partial t}\frac{\partial\mathcal L}{\partial\dot q}\right)
\end{equation}
$$

右边的量也是一个关于$t$的函数。因此，只要我们将$q(t)$朝着反向于$\frac{\partial S}{\partial q}$的方向去一步步更新，就可以找到最优的$q(t)$了。

~~这个推导并不严谨，因为严谨的推导我也不会~~

## 函数离散化与数值求解

当然，计算机没法计算连续的函数，因此我们需要给这个函数做离散采样。这里我们就用最简单的采样方法，取一系列时间轴上均匀分布的点，接着将$q(t)$曲线在每个取出的时间点上采样，存储成一个数组$q_i$。这个操作可以当作是把曲线$q(t)$变成了一段段折线。即：

$$q\left(t_1+\frac{k}{n}\Delta t+t_r\right)=\frac{t_r}{\Delta t}q_i+\left(1-\frac{t_r}{\Delta t}\right)q_{i+1}$$

![函数采样](/img/signal-sampling.png)

其中$n$为采样点的总数，$\Delta t=(t_2-t_1)/n$是两个采样点之间的距离，剩下的$t_r$就是不足一整个采样距离的部分。这样，我们就能用数值方法计算$q(t)$的一阶和二阶导了。

$$\dot q_i\approx \frac{q_{i+1}-q_{i-1}}{2\Delta t}$$

$$\ddot q_i\approx \frac{q_{i+1}-2q_i+q_{i-1}}{4\Delta t^2}$$

那么我们只需要写一个循环，在循环里面执行以下操作：

1. 根据$q_i$计算$\dot q_i$和$\ddot q_i$
2. 根据物理系统的拉格朗日量$\mathcal L$计算$\partial S/\partial q$
3. 使用某种凸优化方法（例如梯度下降法）更新$q_i$，使得新的路径$q_i$上的$S[q]$相较于原来更小。比如用朴素梯度下降算法（其中上标$(s)$表示迭代步数）：

$$q_i^{(s+1)}=q_i^{(s)}-\eta\frac{\partial S[q_i^{(s)}]}{\partial q}$$

**免责声明：上述的所有方法和数学推导均为100%原创，但我不确定是否有前人发明过同样的或者类似的方法。如果有任何读者了解过其他类似的使用泛函凸优化的数值模拟方法，也欢迎在主页评论区留言。**

### 案例：单摆

这样说可能不太直观。举个具体的例子：**单摆**。用$l$表示单摆长度，$m$表示摆锤的质量，$\theta$来描述摆锤在每个时刻与平衡位置形成的的角度，则单摆的拉格朗日量为

$$\mathcal L(t, \theta, \dot\theta)=\frac 12ml^2\dot\theta^2 + mgl\cos(\theta)$$

代入[公式 (1)](#equation-1)，我们得到

$$
\begin{align*}
\frac{\partial S}{\partial q} &= \frac{\partial\mathcal L}{\partial q}-\frac{\partial}{\partial t}\frac{\partial\mathcal L}{\partial\dot q} \\
& = -mgl\sin(\theta)-ml^2\ddot\theta
\end{align*}
$$

接下来我们就可以使用数值模拟方法来计算单摆的运动了。这里我们随便编几个数，比如我们规定单摆在$t=0$和$t=10$两个时刻的角度分别为：

$$
\begin{align*}
\theta(0) &= \frac{\pi}{16} \\
\theta(10) &= -\frac{\pi}{20}
\end{align*}
$$

而我们想要知道单摆有可能通过什么样的方式从$t=0$时刻的$\pi/16$角度变成$t=10$时刻的$-\pi/20$角度。

以下代码为数值求解该函数的一个实现。代码用Julia写成，凸优化部分使用了Adam算法 [2]（实践证明Adam算法比简单梯度下降更有效）。

```julia
using Plots
using ProgressBars
using Base.Threads
cd(@__DIR__)

include("helpers.jl")

const PENDULUM_MASS = 1.0  # kg
const PENDULUM_LENGTH = 1.0  # m

const g = 9.81  # m/s^2
# use the Lagrangian of a simple pendulum
Lagrange(t, q, q̇) = 0.5 * PENDULUM_MASS * PENDULUM_LENGTH^2 * q̇^2 + PENDULUM_MASS * g * PENDULUM_LENGTH * cos.(q)
Lagrange_(t, q, q̇, q̈) = -PENDULUM_MASS * PENDULUM_LENGTH * g * sin.(q) - PENDULUM_MASS * PENDULUM_LENGTH^2 * q̈

const N = 250  # the number of samples for the q(t) curve
const t1 = 0
const t2 = 10
const times = range(t1, t2, length=N)  # the time points for the q(t) curve
q = randn(N) * 0.01  # the initial values for the q(t) curve
q[begin] = π / 16
q[end] = -π / 20

# optimizing code
const LearnRate = 5e-4
const RECORD_HISTORY_PER_ITER = 1000
loss_history = []
# Adam updater
const adam_v = zeros(N)
const adam_s = zeros(N)
const β1 = 0.9
const β2 = 0.999
const ϵ = 1e-5

# optimization loop
anim = @animate for iteration in ProgressBar(1:500000)
    global times, q
    # do one step of gradient descent in this loop
    # first, calculate samples of q(t), q̇(t), q̈(t)
    q̇ = derivative(q, times)
    q̈ = derivative2(q, times)
    # calculate the loss gradient
    loss_grad = Lagrange_(times, q, q̇, q̈)
    # update the Adam parameters
    adam_v .= β1 * adam_v + (1 - β1) * loss_grad
    adam_s .= β2 * adam_s + (1 - β2) * loss_grad.^2
    # bias correction
    v_hat = adam_v / (1 - β1^iteration)
    s_hat = adam_s / (1 - β2^iteration)
    # update the q(t) curve
    @inbounds q[begin+1:end-1] -= LearnRate * v_hat[begin+1:end-1] ./ (sqrt.(s_hat[begin+1:end-1]) .+ ϵ)
    # record the loss
    if iteration % RECORD_HISTORY_PER_ITER == 0
        push!(loss_history, sqrt(integrate(loss_grad.^2, times)))
    end
    plot(times, q, label="pendulum path", legend=nothing)
end every 5000

gif(anim, "pendulum.gif", fps=10)

# plot the q curve after optimization
plot(times, q, label="q(t) optimized")
savefig("pendulum.png")

plot(times[begin+1:end-1], derivative2(q, times)[begin+1:end-1], label="q̈(t)")
savefig("pendulum-acceleration.png")

# plot the loss history
plot(loss_history, label="loss history", yaxis=:log, legend=:topleft, xlabel="iteration", ylabel="loss")
savefig("loss.png")
```

`helpers.jl`实现了数值积分和求导等功能函数。由于篇幅原因，我就不将代码写在文章里了。两份代码也可以在这里查到：[`lagrange-solver-1v.jl`](/resources/code/2024-06-07-lagrangian/lagrangian-solver-1v.jl), [`helpers.jl`](/resources/code/2024-06-07-lagrangian/helpers.jl)。

最终求得的解长这样：

![单摆稳定解](/img/lagrange-pendulum.svg)

也就是说，这个单摆先摆到接近最高点的位置，保持在该点几乎不动，然后再反方向加速到另一边，到达另一边的最高点，最后再掉回到目标角度上。大概是这样的：

![单摆动画](/img/lagrange-pendulum-anim.gif)

而下面这张图展示了求解器寻找这个最优解的过程，可以看到随着我们一步步做优化，求解器算出的解越来越接近最优解。

![单摆求解器](/img/lagrange-pendulum-solver.gif)*求解过程。该动图展示了$q(t)$从初始的随机值经过不断地梯度下降后逼近最优解的过程。*

当然，由于这个系统的稳定解不止一个，你也有可能得到只摆动一次的解，类似这样：

![单摆稳定解2](/img/lagrange-pendulum-2.svg)

![单摆动画2](/img/lagrange-pendulum-anim-2.gif)

我本来预期这个求解器能够找到一个振动角度更小，在$t=0$到$t=10$之间振动更多次的解，但可能这样的解不太稳定，导致求解器每次都会收敛到只摆动1或2次的解上。

### 案例：三体运动

这样的求解器不仅可以用来做单摆这样的单变量问题，也可以用来计算更高维的拉格朗日量。比如**多体问题**的拉格朗日量可以写成这样：

$$\mathcal L(t, x_i, y_i, \dot x_i, \dot y_i)=\sum_{i=1}^n\frac 12 m_i(\dot x_i^2+\dot y_i^2)+\sum_{i=1}^n\sum_{j=i+1}^n \frac{Gm_im_j}{\sqrt{(x_i-x_j)^2+(y_i-y_j)^2}}$$

其中前一项为星体的总动能，后一项为星体间的总重力势能。$m_i$为第$i$个星体的质量。

对代码进行少许更改即可计算这样的多体运动问题。这里我们以三体运动为例。假设起始点为：

$$
\begin{align*}
(x_1, y_1) &= (1, 0)\cdot 5\times 10^{12} \\
(x_2, y_2) &= (-\frac 12, \frac{\sqrt 3}{2})\cdot 5\times 10^{12} \\
(x_3, y_3) &= (-\frac 12, -\frac{\sqrt 3}{2})\cdot 5\times 10^{12}
\end{align*}
$$

而终止点为：

$$
\begin{align*}
(x_1, y_1) &= (-\frac 12, \frac{\sqrt 3}{2})\cdot 5\times 10^{12} \\
(x_2, y_2) &= (-\frac 12, -\frac{\sqrt 3}{2})\cdot 5\times 10^{12} \\
(x_3, y_3) &= (1, 0)\cdot 5\times 10^{12}
\end{align*}
$$

以下为求解器计算出的路径以及其计算过程：

![三体系统-路径](/img/lagrange-3-body.gif)*三体系统的路径*

![三体系统-求解](/img/lagrange-3-body-solve.gif)*求解三体系统的过程*

换一套起始和终止点，求解器仍然能计算出最优解。例如我们将终止点设置成：

$$
\begin{align*}
(x_1, y_1) &= (-\frac 12, 0)\cdot 5\times 10^{12} \\
(x_2, y_2) &= (0, 0)\cdot 5\times 10^{12} \\
(x_3, y_3) &= (\frac 12, 0)\cdot 5\times 10^{12}
\end{align*}
$$

得到的解是这样的：

![三体问题-求解2](/img/lagrange-3-body-solve-2.gif)

![三体问题-作用量2](/img/lagrange-3-body-loss2.png)*求解过程中总作用量$S$随着迭代次数的变化*

如果我们计算这个轨迹上三颗恒星的初始速度，并使用牛顿力学来计算行星接下来的位置和速度变化，我们可能得到的解不完全和目标解相同。如图所示。这可能是采样精度不够导致的计算误差，也有可能是三体系统本身的混沌导致的。

![拉格朗日/牛顿对比](/img/lagrange-newton-solver-compare.gif)

## 算法分析

该算法的时间复杂度是$O(NL)$，其中$N$为函数的采样点数，$L$为优化迭代步数，而达到稳定解的迭代步数$L$又反比于更新步长$\eta$。相比于微分方程数值求解的$O(N)$复杂度，这里实现的这个拉格朗日求解要慢得多，但考虑到两者的应用场景不同，因此不具有可比性。

初步观察这个算法只能计算较为简单的路径。更多关于这个算法的细节，比如解的稳定性、步长和误差的关系、算法在不同系统中的表现、可能的应用场景等，还需要进一步研究。后续我可能会接着写一些文章来探索这些问题。

## 参考资料

[1] Kingma, Diederik P., and Jimmy Ba. ‘Adam: A Method for Stochastic Optimization’. *arXiv [Cs.LG]*, 2017, <http://arxiv.org/abs/1412.6980>. arXiv.
