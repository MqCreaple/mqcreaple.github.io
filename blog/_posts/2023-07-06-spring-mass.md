---
title: 数值模拟之：弹簧质点系统
layout: blog
tag: ["physics", "computer-science", "math-modeling"]
---

最近对数值模拟这个领域比较感兴趣，学习了一些这方面的理论。对于一些难以在理论上解决的物理问题，**数值模拟**就是用计算机方法尽量精确并快速的模拟出这个物理系统。

**弹簧质点系统**在许多计算机图形和游戏引擎中都有应用。它将一个固体材料抽象成一系列由弹簧连接的质点，通过调节弹簧的强度、阻尼系数、长度、连接方式等参数，弹簧质点系统可以用来模拟许多材质，例如软体、布料等。我写了一个简单的演示程序，大家可以通过[这个链接]({% link _app/spring-mass/index.html %})来打开。

我在大约一年前写过一篇使用弹簧质点来模拟绳子振动的程序，详情见[这里]({% link blog/_posts/2021-08-09-julia-rope-simulation.md %})。在当时我还没有系统地学习过数值模拟，那段代码也是凭经验写出来的。现在有了更强的数学工具，我们就能够分析许多之前解释不了的现象和问题了。

## 一些基础的物理

假设目前在我们的画布上一共有$n$个质点，它们的位置分别是$\vec x_1, \vec x_2, \vec x_3, \cdots, \vec x_n$，其中$\vec x_i$是一个三维向量。某些质点之间被弹簧连接，用一个$n\times n$的矩阵$C_{ij}$表示：

$$C_{ij}=\begin{cases}1, \text{mass }i\text{ and }j\text{ are conneted}\\ 0, \text{otherwise}\end{cases}$$

![spring-mass-0](/img/spring-mass-0.png)

之后对每一个质点做受力分析。根据弹簧的胡克定律，对于一根连接质点$i$和$j$的弹簧，它作用在两个质点上的力分别是：

$$\vec f_1 = -\vec f_2 = k(\Vert \vec r_{12}\Vert - l)\hat r_{12}$$

其中$\vec r_{12}=\vec x_2-\vec x_1$，$\hat r_{12}$为指向$\vec r_{12}$方向的单位向量，$k$和$l$分别是弹簧的弹性系数和原长。

假设弹簧阻尼正比于弹簧的速度，那么修正之后的表达式就是：

$$\vec f_1=-\vec f_2 = k(\Vert \vec r_{12}\Vert - l)\hat r_{12} - c\frac{\mathrm d\vec r_{12}}{\mathrm dt}$$

将上述公式展开就是：

$$\vec f_1 = -\vec f_2 = k(\Vert \vec x_2 - \vec x_1\Vert - l)\frac{\vec x_2-\vec x_1}{\Vert\vec x_2-\vec x_1\Vert}-c\left(\frac{\mathrm d\vec x_2}{\mathrm dt}-\frac{\mathrm d\vec x_1}{\mathrm dt} \right)$$

假设空间中有保守力场$\vec f_c(\vec x)$（例如重力就是$\vec f_c(\vec x)=-mg\hat j$）。每个质点除了受到外力$\vec f_c$以外，还受到它连接的弹簧给它的弹力，也就是说，质点$i$受到的合力$\vec f_i$是：

$$\vec f_i=\vec f_c(\vec x_i) + \sum_{\text{$i$ and $j$ are connected}}\left( k(\Vert \vec r_{12}\Vert - l)\hat r_{12} - c\frac{\mathrm d\vec r_{12}}{\mathrm dt} \right)$$

用我们在初中就学过的牛顿第二定律，力$\vec f_i$是加速度$\vec a_i={\mathrm d^2\vec x_i}/{\mathrm dt^2}$乘上质点的质量$m$。写出微分方程就是：

$$\frac{\mathrm d^2\vec x_i}{\mathrm dt^2}=\frac{\vec f_i}{m}=\frac 1m\left( \vec f_c(\vec x_i) + \sum_{C_{ij}=1}\left( k(\Vert \vec r_{12}\Vert - l)\hat r_{12} - c\frac{\mathrm d\vec r_{12}}{\mathrm dt}\right) \right)$$

与大多数力学系统一样，这个关于$\vec x_i$的方程是二阶微分方程。对于从$1$到$n$的所有质点都可以列出这样的微分方程，总共有$n$个方程。

## 两种视角

目前我们将每个质点当作一个单独的物体，用一个方程去描述它，这样的话我们需要解$n$个方程。但是比较糟糕的是对于每个$i\in\{1, 2, 3, \cdots, n\}$，微分方程的右侧，也就是$\vec f_i$，不仅取决于$x_i$，还取决于所有和$x_i$相连的其他质点。

为了解决这个问题，可以将这$n$个3维向量考虑成一个整体：一个$3n$维向量$\vec X$。

$$\vec X = \begin{bmatrix}\vec x_1\\\vec x_2\\\vec x_3\\\vdots\\\vec x_n\end{bmatrix}$$

$$\vec X_i=\vec x_{\lfloor i/3\rfloor, i\text{ mod }3}$$

也就是说，我们将“$n$个$\R^3$空间的点”和“1个$\R^{3n}$维空间的点”之间建立了对应关系。为了方便称呼，这个$3n$维空间就称为整个物理系统的*广义坐标空间*，大写的$\vec X$就称为物理系统的*广义坐标*。

由于向量的各个维度之间是相互独立的，对$\vec X$求导后得到的广义速度向量$\vec V$也等于$n$个质点的速度向量$\vec v_i$连接，二阶导得到的加速度$\vec A$同理。

> 广义坐标的本质就是将整个系统看做了一个整体，而非许多分开的个体。这样做有些时候能够让问题看起来更简单一点（但实际上并没有改变你解决问题的难度）。

这样做的好处就是可以将原来的$n$个微分方程右侧的所有$\vec f_i$也连接起来，写成一个广义力$\vec F$，并且这个广义力仅和位置$\vec X$、速度$\vec V$相关。我们可以写出一个向量函数$\vec F: (\R^{3n}\times \R^{3n})\to\R^{3n}$表示力和位置、速度的函数关系。那么原来的$n$个方程就可以写成一个统一的方程：

$$\frac{\mathrm d^2\vec X}{\mathrm dt^2}=\frac{\vec F(\vec X, \vec V)}{m}$$

可惜的是$\vec F(\vec X, \vec V)$这个函数通常不是线性的，即不存在$6n\times 6n$的矩阵$F$使得$F\begin{bmatrix}\vec X\\ \vec V\end{bmatrix}=\vec F$。

> 思考题：证明对于弹簧质点系统，$\vec F(\vec X, \vec V)$函数不是线性的。

当然，这样写的前提是每个质点的质量都一样。如果不一样的话就需要引入一个$3n\times 3n$的对角矩阵$M$：

$$
M=\begin{bmatrix}
m_1&&&&&&&&& \\
&m_1&&&&&&&& \\
&&m_1&&&&&&& \\
&&&m_2&&&&&& \\
&&&&m_2&&&&& \\
&&&&&m_2&&&& \\
&&&&&&\ddots&&& \\
&&&&&&&m_n&& \\
&&&&&&&&m_n& \\
&&&&&&&&&m_n \\
\end{bmatrix}
$$

将原来的方程写成：

$$\frac{\mathrm d^2\vec X}{\mathrm dt^2}=M^{-1}\vec F(\vec X, \vec V)$$

当然在真正做计算机模拟的时候，应当根据问题的需求，以及个人偏好（不是），来选择使用物理坐标或者广义坐标。例如我在我的[弹簧质点系统演示]({% link blog/_posts/2021-08-09-julia-rope-simulation.md %})中就是用的物理坐标，也就是一个存储了一堆向量的数组。这样可以方便添加和删除元素，但是可能在计算速度上会略微降低。

总之，有了微分方程之后，我们接下来就要尝试得到它的数值解。

## 微分方程的数值解

### 相空间

我们不妨先从一个简单的例子开始。比如对于下面这个一元二阶微分方程：

$$\frac{\mathrm d^2y}{\mathrm dt^2}=f(y, \frac{\mathrm dy}{\mathrm dt}, t)$$

其中方程右侧的$f$是一个给定的函数。通过一个变量代换：

$$\vec u=\begin{bmatrix}y\\\mathrm dy/\mathrm dt\end{bmatrix}$$

我们可以将这个一元二阶微分方程降一阶，变成二元一阶微分方程：

$$\begin{cases}
\frac{\mathrm du_1}{\mathrm dt}=\frac{\mathrm dy}{\mathrm dt}=u_2 \\
\frac{\mathrm du_2}{\mathrm dt}=\frac{\mathrm d^2y}{\mathrm dt^2}=f(u_1, u_2, t)
\end{cases}$$

即：

$$\frac{\mathrm d\vec u}{\mathrm dt}=\begin{bmatrix}u_2\\f(\vec u, t)\end{bmatrix}$$

向量$u$所在的$\R^2$空间就被称为这个微分方程的**相空间(phase space)**。类似的，一个$m$元$n$阶的常微分方程可以降阶成$mn$元一阶微分方程，它的相空间就是$mn$维的。

相空间的维度代表了微分方程解的自由度。例如在上面的一元二阶方程的例子中，微分方程的解需要至少两个初始条件才能唯一确定下来。例如限定了$t=0$时刻$y$的位置和速度之后微分方程就会有唯一解：

$$\begin{cases}\frac{\mathrm d^2y}{\mathrm dt^2}=f(y, y', t)\\y\vert_{t=0}=y_0\\\frac{\mathrm dy}{\mathrm dt}\vert_{t=0}=y'_0\end{cases}$$

回到我们的弹簧质点系统中。它的微分方程是这样的：

$$\frac{\mathrm d^2\vec X}{\mathrm dt^2}=M^{-1}\vec F(\vec X)$$

是二阶的，并且$\vec X$是$3n$维向量，也就是说它的相空间一共有$6n$维。

### 欧拉法

既然我们已经能将任何常微分方程降维到一阶了，那么接下来我们不妨考虑一个再简单不过的一阶微分方程：

$$\frac{\mathrm dy}{\mathrm dt}=f(y, t)$$

$$y(t_0)=y_0$$

我们该怎么尽可能精确地求出$y$在任意$t$时刻的数值呢？

你一定想到了，我们可以将时间$t$离散化处理，取一个非常小的时间间隔$\Delta t$，接着循环迭代，每次计算$y$的导数，并用公式

$$y_{t+1}=y_{t}+\frac{\mathrm dy}{\mathrm dt}\Delta t$$

来更新。这样只要$\Delta t$取得足够小，我们就可以得到任意精确的$y(t)$了。这种方法被称为**欧拉法**。

但是，事实真的是这样吗？

#### 坏条件

对于有些微分方程，初始值哪怕微小的变化都会在未来的计算结果中产生巨大的变化。比如：

$$\frac{\mathrm dy}{\mathrm dt}=2y+1$$

如果给定初始条件$y(0)=0$，那么我们知道它的解是$y=\frac12(e^{2t}-1)$。假如在初始的时候$y_0$有一个很小的误差$\epsilon$，那么就算我们可以把步长取得无限小，我们模拟出的函数会变成：

$$y'=\frac12\left((2\epsilon+1)e^{2t}-1\right)$$

我们模拟的结果和真实结果的差是：

$$\mid y-y'\mid=\epsilon e^{2t}$$

可以看到，随着时间的推移，我们的模拟结果和真实结果的差距会指数级增大。但很显然计算机是不可能存储一个无限精度的浮点数的，也就是说我们在计算机中存储的数和真实结果一定会有差异，那么这样的差异就会像蝴蝶效应一样在之后变得越来越大。这种微分方程就被称为**坏**的（没错数学家们起名就是这么简单直接）。

这种由物理系统本身决定了它无法被无限精确地模拟的现象在日常生活中也可以见到，比如*天气*就是著名的混沌系统。这种特性决定了天气预报中越靠后的天气就越不准确。

万幸的是，弹簧质点系统的微分方程不是坏条件。

> 思考：怎么证明？

#### 截断误差

对于一个良好的微分方程，如果模拟的步长$\Delta t$是无限小的话计算结果确实能够无限逼近精确解，但是如果步长不是无限小的呢？我们该如何分析由步长带来的误差？

不妨只关注一步带来的误差。根据函数$y(t)$的泰勒展开：

$$
\begin{align*}
y(t+\Delta t)-y(t) &= \frac{\mathrm dy(t)}{\mathrm dt}\Delta t+\frac1{2!}\frac{\mathrm d^2y(t)}{\mathrm dt^2}\Delta t^2+\frac1{3!}\frac{\mathrm d^3y(t)}{\mathrm dt^3}\Delta t^3+\cdots \\
&= \frac{\mathrm dy(t)}{\mathrm dt}\Delta t + O(\Delta t^2)
\end{align*}
$$

即便我们在这一步之前的$y_t$精确地等于$y(t)$，在迈完这一步之后，它至少会产生一个等阶于$\Delta t^2$的误差，即：$$\mid y_{t+1}-y(t+\Delta t)\mid\propto O(\Delta t^2)$$

这个误差被称为**截断误差**。

如果考虑从时刻$0$到时刻$t$的总体误差，随着$\Delta t$的减小，每一步的截断误差会以$O(\Delta t^2)$的速度减小。但由于从$0$到$t$所需的总步数约等于$t/\Delta t$，是一个和$O(\Delta t^{-1})$等阶的量，因此**总体误差**会比截断误差少一个$\Delta t$，即：欧拉法的总体误差是$O(\Delta t)$的。这意味着如果使用朴素的欧拉法的话，减小步长只能线性的减少某一时刻的误差。

那么有没有误差更小的方法呢？答案是有的。只要我们能够让每一步的截断误差等于$O(\Delta t^3)$甚至更小，那么就可以让整体误差更小了。

举个简单的例子。如果我们能够在$t$时刻估算出$y(t)$的二阶导，那么我们就可以将$y(t)$泰勒展开的二次项也消去，留下的误差就会小于$O(\Delta t^3)$了。

为了估算$\mathrm d^2y/\mathrm dt^2$，我们可以先向前迈两步，得到前面的两个数：

$$y'_1=y_t+\Delta t\frac{\mathrm dy}{\mathrm dt}\vert_{y=y_t}$$

$$y'_2=y'_1+\Delta t\frac{\mathrm dy}{\mathrm dt}\vert_{y=y'_1}
$$

然后利用差分计算出二阶导的估计值：

$$\frac{\mathrm d^2y(t)}{\mathrm dt^2}\approx\frac{y'_2+y_t-2y'_1}{\Delta t^2}$$

然后再真正更新的时候考虑进去这个二次项：

$$y_{t+1}=y_t+\Delta t\frac{\mathrm dy}{\mathrm dt}\vert_{y=y_t}+\frac 12(y'_2+y_t-2y'_1)$$

可以证明这个式子的截断误差和$O(\Delta t^3)$等阶。

更进一步如果预先计算出$n$个前面的点，那么就可以用拉格朗日插值法拟合出$n-1$阶多项式，再将它带入原式更新就可以最多将截断误差降到$O(\Delta t^n)$。这样通过预先计算出前面一些点，并使用泰勒多项式降阶的改进欧拉方法就被称为**龙格-库塔方法(Runge-Kutta method)**。

#### 回到物理系统

回到最初的问题。我们的弹簧质点系统（其实是任何物理系统）可以用这样的微分方程描述：

$$\frac{\mathrm d^2\vec X}{\mathrm dt^2}=M^{-1}\vec F(\vec X, \frac{\mathrm d\vec X}{\mathrm dt})$$

首先将它降阶成一阶微分方程：

$$
\begin{align*}
\frac{\mathrm d\vec X}{\mathrm dt} &= \vec V\\
\frac{\mathrm d\vec V}{\mathrm dt} &= M^{-1}\vec F(\vec X, \vec V)
\end{align*}
$$

使用欧拉法做数值模拟的伪代码如下：

```julia
x <- x0
v <- v0
dt <- 0.001            # some small number
M_inv <- inverse(M)    # precompute inverse of mass
for t in 1..n
    x <- x + v * dt
    v <- v + (M_inv * f(x, v)) * dt
    save(x, v, t * dt)  # save the position and velocity of this frame
end
```

怎么样是不是很简单？当然这只是大致思路，只需要再填充亿点细节就可以了。

### 欧拉法的稳定性分析

使用欧拉法模拟弹簧质点系统的时候，如果步长设置的太大，一旦超过某个临界值，弹簧振动就不再稳定，而是会会变得越来越大，最后炸掉。如图所示：

![spring-mass-1](/img/spring-mass-1.gif)

那么为什么会出现这种情况？步长需要取多小才不会爆炸呢？

我们不妨先从最简单的情况考虑。假设整个系统里面只有一根弹簧和两个质点，两个质点的坐标分别为$x$和$-x$，弹簧原长为$l$，弹性系数为$k$。列出微分方程，就是：

$$\frac{\mathrm d^2x}{\mathrm dt^2}=-\frac{k}{m}(2x-l)$$

换一下元，令$a=2x-l$，则原方程变成：

$$\frac{\mathrm d^2a}{\mathrm dt^2}=-\frac{2k}{m}a$$

根据一些简单的计算，两个质点会做简谐振动，振动角频率$\omega=\sqrt{\frac{2k}{m}}$，周期为$T=2\pi\sqrt{\frac{m}{2k}}$。考虑方程的相空间$\begin{bmatrix}a\\ \dot a\end{bmatrix}=\begin{bmatrix}a\\ \mathrm da/\mathrm dt\end{bmatrix}$，由于微分方程里面$\omega^2a^2+\left(\frac{\mathrm da}{\mathrm dt}\right)^2$是常数 (**\***)，所以精确解在相空间中的轨迹是一个椭圆。那么由欧拉法得到的近似解会是怎样的呢？

> **\*** 2024.3.27注：原文没有给出这个结论的证明，这里补充一下
>
> 我们取这个量$C=\omega^2a^2+\left(\frac{\mathrm da}{\mathrm dt}\right)^2$对时间的导数：
>
> $$
> \begin{align*}
> \frac{\mathrm dC}{\mathrm dt} & = \frac{\mathrm d(\omega^2a^2)}{\mathrm dt} + \frac{\mathrm d(\mathrm da/\mathrm dt)^2}{\mathrm dt} \\
> & = \omega^2\cdot 2a\cdot\frac{\mathrm da}{\mathrm dt} + 2\frac{\mathrm da}{\mathrm dt}\frac{\mathrm d^2a}{\mathrm dt^2} \\
> & = 2\frac{\mathrm da}{\mathrm dt}\left(\omega^2a + \frac{\mathrm d^2a}{\mathrm dt^2}\right) \\
> & = 2\frac{\mathrm da}{\mathrm dt}\cdot 0 \\
> & = 0
> \end{align*}
> $$
>
> 也就是说，$C$不会随着时间变化，那么它一定是一个关于时间的常值函数。

定义关于时间的函数$C_t$，表达式为：

$$C_t=\omega^2a_t^2+\dot a_t^2$$

其中$a_t$和$\dot a_t$表示用欧拉法在$t$时刻算出来的$a$和$\frac{\mathrm da}{\mathrm dt}$。使用欧拉法在$t$时刻算得的$a$和$\dot a$关于时间的变化率就是：

$$\frac{\mathrm d}{\mathrm dt}\begin{bmatrix}a\\\dot a\end{bmatrix}=\begin{bmatrix}\dot a\\-\omega^2 a\end{bmatrix}$$

根据这一步的导数，下一步的$a_{t+1}$和$\dot a_{t+1}$分别是：

$$
\begin{align*}
a_{t+1} &= a_t+\dot a_t\Delta t \\
\dot a_{t+1} &= \dot a_t-\omega^2 a_t\Delta t
\end{align*}
$$

接着计算下一步的$C_{t+1}$，我们得到：

$$
\begin{align*}
C_{t+1} &= \omega^2a_{t+1}^2+\dot a_{t+1}^2 \\
&= \omega^2(a_t+\dot a_t\Delta t)^2+(\dot a_t-\omega^2 a_t\Delta t)^2\\
&= (\omega^2a_t^2+\dot a_t^2)+(2\omega^2a_t\dot a_t-2\omega^2a_t\dot a_t)\Delta t+(\omega^2\dot a_t^2+\omega^4a_t^2)\Delta t^2 \\
&= C_t+\omega^2C_t\Delta t^2 \\
&= (1+\omega^2\Delta t^2)C_t
\end{align*}
$$

可以看出，每迭代一次$C_{t+1}$就会比$C_t$增加一点，最终$C$的值就会指数增加，弹簧的振动幅度就会越来越大，然后爆炸掉。在相空间里，通过欧拉法得到的曲线不是一个椭圆，而是一个拉伸过的等角螺旋线。

![spring-mass-2](/img/spring-mass-2.png)

也就是说，**在无阻尼的情况下，不管步长多么小，欧拉法总是会爆炸**。

那么有阻尼的情况呢？回到原来的微分方程，我们在里面加入阻尼项。为了方便计算，我们令阻尼等于$2\gamma$：

$$\frac{\mathrm d^2a}{\mathrm dt^2}=-2\gamma\frac{\mathrm da}{\mathrm dt}-\omega^2a$$

它等价于以下两个微分方程：

$$
\begin{align*}
\frac{\mathrm da}{\mathrm dt} &= \dot a \\
\frac{\mathrm d\dot a}{\mathrm dt} &= -2\gamma\dot a-\omega^2a
\end{align*}
$$

在欠阻尼的情况下（即$\gamma\lt\omega$时），这个方程的解是$x=Ae^{-\gamma t}\cos(\sqrt{\omega^2-\gamma^2}t+\varphi_0)$，其中振幅$A$和相位$\varphi_0$是待定参数。它在相空间的轨迹是一条斜向拉伸后的向内收敛的等角螺旋线。

此时取

$$C=\omega^2a^2+2\gamma a\dot a+\dot a^2$$

> 思考：为什么是这个式子？

精确解的$C(t)=(\omega^2-\gamma^2)e^{-2\gamma t}$，是随着时间指数下降的。而通过之前类似的方法可以计算出欧拉法得到的近似解的$C(t)$。这里就不写过程，只展示结论了：

$$C_{t+1}=C_t + (-2\gamma\Delta t + \omega^2\Delta t^2)(\omega^2a_t^2+2\gamma a_t\dot a_t+\dot a_t^2)$$

从这个式子可以看出，步长$\Delta t$的临界值就是$\frac{2\gamma}{\omega^2}$。当步长小于临界值时，系数$(-2\gamma\Delta t + \omega^2\Delta t^2)\lt 0$，级数$C_t$会逐渐减小；而步长大于临界值的时候$C_t$就会逐渐增大，欧拉法就爆炸了。

不同的方法可能会有不同的步长临界值（即使得误差不会无限增大的最大步长）。通常我们用步长$\Delta t$的临界值来衡量一个数值积分方法的稳定性，临界值越小表示这个方法越稳定。例如朴素欧拉法的临界值就是刚刚计算出来的$\frac{2\gamma}{\omega^2}$。以后有时间的话我可以写一篇文章对比一下不同的数值积分方法的稳定性，现在先挖个坑（（

好的那么以上就是关于数值模拟的一些基础知识的介绍。数值模拟是一个很大的学科，这篇文章里只是涵盖了一点皮毛，以后有机会的话我也会写更多这方面的文章的。
