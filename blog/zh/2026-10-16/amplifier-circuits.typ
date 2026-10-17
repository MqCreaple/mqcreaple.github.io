// title: 放大器电路的分析与控制
// summary: 从物理电路抽象出一般性原理，并使用拉普拉斯变换做分析。
// tags: engineering, electrical-engineering, amplifier
// category: tech

#import "../../template.typ": article, diagram, nonumber, theorem, definition, shadertoy-figure, cetz-canvas
#import "@preview/cetz:0.5.2"
#import "@preview/zap:0.6.0"
#import "@preview/fletcher:0.5.8": edge, node, shapes

#show: article.with(
  title: "放大器电路的分析与控制",
  lang: "zh",
)

我们的实验物理课正好讲到了放大器电路、传递函数以及控制论相关的知识，而课程编排则有些一言难尽。我希望通过这篇文章重新整理一下我对放大器电路的理解，以及拉普拉斯变换这些数学工具是怎么描述一个电路系统的。码字不易，请多多支持。

这篇文章假定了读者有一定的电路和信号处理知识：

- 了解线性元件（电阻、电容、电感）的阻抗计算。
- 能够分析简单电路的频率响应。
- 了解运算放大器的基本原理。
- 了解傅里叶变换和拉普拉斯变换的基本性质。

本文的内容主要集中在回答“为何”以及“如何”使用拉普拉斯变换来分析放大器电路上。

= 从电路到方块图 <sec:block-diagram>

下面这个电路是一个使用运算放大器制作的简易放大电路：

#figure(
  image("simple-amplifier.svg"),
  caption: [一个简单的负反馈放大电路。]
) <fig:simple-amplifier>

学过放大器分析的朋友们不难看出，这个电路是一个同相放大电路，放大倍数是 $(R_1 + R_2) / R_1$。使用虚短-虚断法足以分析这种简单电路——只需要假设点2和点3的电压始终相等，且流入2、3引脚的电流为 $0$，就可以将 $R_1$ 和 $R_2$ 看作一个分压电路，算得 $V_"out" = (R_1 + R_2) / R_1 V_"in"$。

那么对于更复杂的电路，比如下面这个振荡电路呢？

#figure(
  image("wien-bridge-oscillator.svg"),
  caption: [文氏电桥振荡器。]
) <fig:wien-bridge-oscillator>

这种涉及多种线性元件的电路就不像放大器那样好分析了。如果在电路图上计算每个点的电压并列出微分方程，求解过程将会十分麻烦。另一方面，这样的图示也让我们很难分析噪声、非理想特性等可能影响系统表现的因素。

基于种种考虑，我们将抛弃掉“电路图”这种基于物理连接方式的绘图方式，转而使用一种更抽象、更一般化的图示。

#figure(
  diagram(
    node-stroke: 0.6pt,
    {
      node((0.2, 1), $A$, shape: shapes.triangle.with(dir: right))
      edge("-|>")
      node((1.8, 1), $beta$, shape: shapes.rect)
      edge((1.8, 1), (2.5, 1), (2.5, 2), (-0.7, 2), (-0.7, 1), "-|>", label: $-$, label-pos: 100%, label-size: 8pt)
      node((-0.7, 1), $Sigma$, inset: 2pt)
      edge("-|>", (0, 1))
      node((-1.5, 1), $V_"in"$, stroke: none)
      edge("-|>", (-0.7, 1), label: $+$, label-pos: 100%, label-size: 8pt)
      node((1, 0.5), $V_"out"$, stroke: none)
      edge((0.2, 1), (1, 1), (1, 0.5), "-|>")
      node((2.7, 1), $V_-$, stroke: none)
    }
  ),
  caption: [简单放大电路（@fig:simple-amplifier）的方块图表示。]
) <fig:system-diagram-of-simple-amplifier>

在这种表示方法下，每条线代表一个*信号*而非一条物理上的电线连接，每个节点则代表一个*算符*（或者叫一个*系统*）。*信号*可以理解为关于时间的函数 $f(t)$，而*算符*则是将一个信号变成另一个信号的某种操作。节点所表示的算符可以与时间无关，比如求和（$h(t) = f(t) + g(t)$）、求积（$h(t) = f(t)g(t)$）等；也可以与时间相关，比如延迟（$g(t) = f(t - tau)$）、求导（$g(t) = dif / (dif t) f(t)$）、滤波（$(a + b dif / (dif t)) g(t) = f(t)$）等。

在这张图上，$Sigma$ 模块表示将输入的两个信号求和或者做差。此处一边标了加号、一边标了减号，因此图中的 $Sigma$ 对两个信号做差。指向右侧的三角形通常用来表示线性增益，比如这里的 $A$ 节点表示将输入信号放大 $A$ 倍，其中 $A$ 是放大器的开环增益。@fig:system-diagram-of-simple-amplifier 中的 $Sigma$ 和 $A$ 节点共同表示了一个理想运算放大器在电路中的功能。这里我们不一定需要取 $A -> infinity$ 的极限情况，将 $A$ 当作有限值来分析也是可以的。

此处的 $beta$ 表示了从运放输出电压 $V_"out"$ 到运放反相输入端电压 $V_-$ 的函数。对于一个同相放大器（如果不考虑信号延迟、寄生参数以及其他高频效应的话），这里的 $beta$ 就是一个线性增益。如果换成其他元件（比如将其中一个电阻换成电容可以制作微分器或积分器），那么 $beta$ 也可以变成一个作用在信号上的算符。

对于放大器这个简单的例子，$A$ 和 $beta$ 都是线性增益，那么计算就很简单了：

$
  V_"out" = A(V_"in" - V_-) \
  V_- = beta V_"out"
$

解得

$ V_"out" = A / (1 + A beta) V_"in" $

若 $A$ 非常大（真实运放的开环增益约为 $10^4-10^5$ 数量级），那么 $V_"out" approx A / (A beta) V_"in" = 1 / beta V_"in"$，此时闭环放大系数与 $A$ 无关 @ti2009interfacing。

接下来，我们将引入几条关键的假设，并使用拉普拉斯变换来将上述分析拓展到更一般的电路上。

= 线性电路分析

== 线性时不变系统假设 <sec:lti-assumption>

注：以下统一使用方括号来表示算子作用在某个函数/信号上，圆括号表示函数在某个输入上的取值。如果方括号内的表达式包含 $t$，那么算符作用的函数以 $t$ 为自变量，若不包含 $t$ 则认为方括号内本身的表达式是一个函数。比如：$hat(P)[f]$ 和 $hat(P)[f(t)]$ 均表示将 $hat(P)$ 作用在信号 $f(t)$ 上。

为了分析方便，我们假设所有相关函数（比如之前出现的 $A$ 和 $beta$）均为线性时不变算符。

#definition[
  算符 $hat(P)$ 满足以下两个条件时即为*线性时不变（Linear Time-Invariant, LTI）算符*。

  1. 线性性：取广义实数 $0 <= a < b <= infinity$，对于任意 $w: [a, b] -> RR, f: [a, b] times RR_(>= 0) -> RR$：
    $ hat(P)[integral_a^b w(u) f(u, t) dif u] = integral_a^b w(u) hat(P)[f(u, t)] dif u  $ <eq:operator-linearity>
  2. 时不变性：对于任意 $f: RR_(>= 0) -> RR, Delta t in RR$：
    $ T_(Delta t)[hat(P)[f]] = hat(P)[T_(Delta t)[f]] $ <eq:operator-time-invariance>
    其中 $T_(Delta t)$ 是时间平移算符，满足 $T_(Delta t) [f](t) = f(t + Delta t)$。也可以写成：
    $ hat(P)[f(t + Delta t)](tau) = hat(P)[f(t)](tau + Delta t) $
] <def:linear-time-invariance>

工作在非线性区域的器件，比如二极管、三极管、饱和区的运算放大器等，都不满足线性时不变条件。因此，接下来的分析也不适用于触发器这种依赖运放非线性区域的电路。更严格地说，我们的分析几乎只适用于由电阻、电容、电感组成的闭环负反馈电路。

#figure(
  image("inverting-schmitt-trigger.svg"),
  caption: [反相施密特触发器不属于线性电路：这个电路使用正反馈将输出电压抬升至运放供电电压或者降低至0V，令运放饱和，因此不能使用线性传递函数来分析这个电路。]
)

== 拉普拉斯变换

相信大家已经对拉普拉斯变换不陌生了，这里再简要回顾一下。

#definition[
  对于一个时变信号 $f(t)$，其*拉普拉斯变换（Laplace Transform）*为：

  $ overline(f)(s) = cal(L)[f](s) = integral_0^infinity f(t) e^(-s t) dif t $
] <def:laplace-transform>

以下记号会混合使用上划线和 $cal(L)$ 算子来表示拉普拉斯变换。

拉普拉斯变换有很多优秀的数学性质，不多赘述。我们用到的最重要的一条性质就是拉普拉斯变换的线性性：

$ cal(L)[a f + b g] = a cal(L)[f] + b cal(L)[g] $ <eq:laplace-linearity-discrete>

这个性质也适用于函数的连续积分（假设函数的数学性质足够好的话）：

$ cal(L)[integral_a^b w(u) f(t, u) dif u ] = integral_a^b w(u) cal(L)[f(t, u)] dif u $ <eq:laplace-linearity-continuous>

@eq:laplace-linearity-continuous 再经过一步简单的推导即可得到拉普拉斯变换的卷积性质：

$ cal(L)[f * g] =  cal(L)[integral_0^t f(tau)g(t-tau) dif tau] = cal(L)[f] dot cal(L)[g] $

当拉普拉斯变换的收敛域包含虚轴时，将 $overline(f)(s)$ 中的 $s$ 替换成 $i omega$，即可得到对应信号的傅里叶变换。需要注意的是，这里使用的是单边拉普拉斯变换，它只依赖于 $t >= 0$ 的部分。比如，$sin(omega t)$ 的拉普拉斯变换是：

$ cal(L)[sin(omega t)](s) = omega / (s^2 + omega^2) $

直接将上式的 $s$ 替换成 $i omega$ 得到的不是 $sin(omega t)$ 的傅里叶变换，而是 $sin(omega t) u(t)$ 的傅里叶变换，其中 $u(t)$ 是单位阶梯函数。

$ u(t) = cases(1\,& t >= 0, 0\,& t < 0) $

== 传递函数

@sec:lti-assumption 假设了我们研究的系统均为线性时不变系统，而拉普拉斯变换天然擅长处理线性时不变的系统。

#definition[
  对于一个线性时不变算符 $hat(P)$，取狄拉克 $delta(t)$ 函数作为算符的输入，对输出 $hat(P)[delta]$（即算符 $hat(P)$ 的*脉冲响应（Impulse Response）*）做拉普拉斯变换，得到的函数就叫做算符 $hat(P)$ 的*传递函数（Transfer Function）*：

  $ overline(P)(s) = cal(L)[hat(P)[delta]](s) $
] <def:impulse-response-and-transfer-function>

由于任何一个信号都可以写成一系列狄拉克 $delta$ 函数的加权积分：

$ f(t) = integral_0^infinity f(tau) delta(t - tau) dif tau $

对 $f$ 作用算符 $hat(P)$。根据 $hat(P)$ 的线性时不变性（@def:linear-time-invariance），得到：

$ hat(P)[f](t) = integral_0^infinity f(tau) hat(P)[delta](t - tau) dif tau $

对上式使用拉普拉斯变换的卷积公式，并结合 $cal(L)[delta](s) = 1$，得到：

$ cal(L)[hat(P)[f]](s) = cal(L)[hat(P)[delta]](s) dot cal(L)[f](s) = overline(P)(s) overline(f)(s) $

换句话说，在时域上非常复杂的算符，只要它是线性时不变的，就可以找到一个函数 $overline(P)(s)$，使得它在拉普拉斯变换后的 $s$ 空间里对应一个简单的乘法操作。用方块图表示就是：

#figure(
  diagram(
    node-stroke: 0.6pt,
    {
      edge((-0.5, 0), (1, 0), "-|>", label: $overline(f)(s)$)
      node((1, 0), $hat(P)$, shape: shapes.rect)
      edge("-|>", (2.5, 0), label: $overline(P)(s) overline(f)(s)$)
    }
  ),
  caption: [传递函数图示。]
) <fig:transfer-function>

通过传递函数，我们可以将复杂的微分、积分等操作变成相对简单一些的代数操作。比如，你可能已经熟悉了以下算符对应的传递函数：

#figure(
  table(
    columns: 2,
    [*算符*], [*传递函数*],
    nonumber[$ dif / (dif t) $], nonumber[$ s $],
    nonumber[$ dif^n / (dif^n t) $], nonumber[$ s^n $],
    nonumber[$ integral_0^t dif tau $], nonumber[$ 1/s $],
    nonumber[$ T_(Delta t) $], nonumber[$ e^(-s Delta t) $],
  ),
  caption: [常见线性时不变算符的拉普拉斯传递函数。]
)

通过传递函数的视角，很多复杂的电路都可以大大简化。例如下面这个 RC 电路：

#figure(
  image("rc-circuit.svg"),
  caption: [RC 低通滤波电路。]
)

由于有

$ V_"out" = V_"in" - I R = V_"in" - R C (dif V_"out") / (dif t) $

设所有状态初始值均为 $0$，对两边做拉普拉斯变换得到：

$ overline(V_"out") = overline(V_"in") - R C (s overline(V_"out")) $

解得：

$ overline(V_"out") = 1 / (1 + s R C) overline(V_"in") $

此处的传递函数为 $1 / (1 + s R C)$。注意到它和使用复阻抗算出的频率响应函数 $g = 1 / (1 + i omega R C)$ 形式几乎相同，这体现了拉普拉斯变换和傅里叶变换之间的紧密联系。

== 传递函数视角下的放大器

我们再次回到 @fig:system-diagram-of-simple-amplifier 所示的放大器。借助拉普拉斯变换和传递函数，我们也可以用同样的方法分析 @fig:simple-amplifier 之外的许多电路。

先从一个简单的例子开始分析：

#figure(
  image("rc-feedback.svg"),
  caption: [一个使用 RC 电路作为负反馈的运算放大器电路。]
)

这个电路虽然使用了电容，但是在拉普拉斯变换的视角下与 @fig:simple-amplifier 其实没有区别。二者都可以使用 @fig:system-diagram-of-simple-amplifier 中的方块图来表示。只不过在这里，$overline(beta)(s) = 1 / (1 + s R C)$，因此闭环放大器的传递函数是：

$
  overline(V_"out") / overline(V_"in")
  &= (overline(A)(s)) / (1 + overline(A)(s) overline(beta)(s)) \
  &= A / (1 + A / (1 + s R C)) = (A(1 + s R C)) / (1 + A + s R C)
$ <eq:closed-loop-gain-of-rc-feedback>

此时如果再取 $A -> infinity$ 的极限，就会得到：

$ overline(V_"out") / overline(V_"in") approx (A(1 + s R C)) / A = 1 + s R C $

$ overline(V_"out") approx overline(V_"in") + R C (s overline(V_"in")) $

$ V_"out" approx V_"in" + R C (dif V_"in") / (dif t) $

这个电路的输出会在输入信号上叠加上输入信号随时间的导数乘上倍数 $R C$。同样的结果也可以通过虚短虚断法来列微分方程得到。

使用 @eq:closed-loop-gain-of-rc-feedback 分析电路行为还有一个好处：可以直观地看出这个近似在什么情况下会失效。将 $s$ 替换为 $i omega$，得到电路的频率响应函数。不难看出，当 $omega R C$ 与 $A$ 的数量级接近时，就不能再取 $A -> infinity$。假设电路的 $R C$ 时间常数为 $50 "ms"$，开环放大倍数 $A = 10^5$，那么当频率达到约 $A / (2 pi R C) = 320 "kHz"$ 时，这个近似会明显失效。

再考虑下面这个反相放大电路：

#figure(
  image("rc-feedback-2.svg"),
  caption: [一个反相放大电路，其中 $V_"in"$ 到 $V_"out"$ 路径由两个电阻和两个电容分压。]
) <fig:rc-feedback-2>

不妨记

$ tau_1 = R_1 C_1, tau_2 = R_2 C_2, tau_(12) = R_1 C_2, tau_(21) = R_2 C_1 $

计算这样一个系统的传递函数也很简单，方法与使用复阻抗计算分压相同。由于这里使用的是拉普拉斯变换，$C$ 的“阻抗”是 $1 / (s C)$，而不是 $1 / (i omega C)$。可以分别计算 $R_1$ 与 $C_1$ 并联、$R_2$ 与 $C_2$ 串联后的阻抗：

$ Z_1 = (1 / (R_1) + s C_1)^(-1) = (R_1) / (1 + s tau_1) $

$ Z_2 = R_2 + 1 / (s C_2) $

则有

$
  overline(V_-) &= (Z_1) / (Z_1 + Z_2) overline(V_"in") + Z_2 / (Z_1 + Z_2) overline(V_"out") \
  &= (s tau_(12) overline(V_"in") + (1 + s tau_1)(1 + s tau_2) overline(V_"out")) / ((1 + s tau_1)(1 + s tau_2) + s tau_(12))
$

又由于 $V_"out" = A (V_+ - V_-) = -A V_-$，有：

$
  (1 + (A(1 + s tau_1)(1 + s tau_2)) / ((1 + s tau_1)(1 + s tau_2) + s tau_(12))) overline(V_"out") = -(A s tau_(12)) / ((1 + s tau_1)(1 + s tau_2) + s tau_(12)) overline(V_"in")
$

$ overline(V_"out") = -(A s tau_(12)) / ((1 + A)(1 + s tau_1)(1 + s tau_2) + s tau_(12)) overline(V_"in") $

这里传递函数的分母带有 $s^2$ 项，是二阶的，因此可以表示一些更复杂的传递过程。类似地，取 $A -> infinity$ 的极限，得到：

$ overline(V_"out") / overline(V_"in") approx -(s tau_(12)) / ((1 + s tau_1)(1 + s tau_2)) = tau_(12) / (tau_1 - tau_2) (1 / (1 + s tau_1) - 1 / (1 + s tau_2)) $ <eq:transfer-function-of-rc-feedback-2>

注意到 $1 / (1 + s tau)$ 的拉普拉斯逆变换为 $1/tau e^(- t / tau)$。这意味着这个系统的脉冲响应是两个下降速率不同的指数函数相减。

将 $s$ 替换成 $i omega$，观察这个系统的频率响应，可以看出它具有带通滤波器的特性：

$ overline(V_"out") / overline(V_"in") approx -(i omega tau_(12)) / (1 - omega^2 tau_1 tau_2 + i omega (tau_1 + tau_2)) $

#figure(
  image("rc-feedback-2-bode.svg"),
  caption: [@fig:rc-feedback-2 电路的波特图（假设 $A -> infinity$），选取参数 $R_1 = 15 "kΩ", C_1 = 3.3 "nF", R_2 = 1.5 "kΩ", C_2 = 100 "nF"$。]
)

类似地，这个系统只有在 $omega tau_1$ 和 $omega tau_2$ 均远小于 $A$ 时才能使用 $A -> infinity$ 的近似。如果频率过高，传递函数就不再是 @eq:transfer-function-of-rc-feedback-2 这么简单的形式。不过这个电路里的 $R C$ 都比较小，而且真实运算放大器在高频下的放大倍数会降低，因此在 $omega max(tau_1, tau_2)$ 接近 $A$ 之前，这个近似就会失效。

= 系统的稳定性分析

再次观察拉普拉斯变换的数学表达式：

$ overline(f)(s) = integral_0^infinity f(t) e^(-s t) dif t $

如果 $f(t)$ 是一个有界函数，即 $forall t >= 0, |f(t)| <= M$，那么当 $Re(s) > 0$ 时有：

$ lr(|overline(f)(s)|) <= integral_0^infinity |f(t)| lr(|e^(-s t)|) dif t = M integral_0^infinity e^(-Re(s) t) dif t = M / (Re(s)) $

也就是说，有界函数的拉普拉斯变换在 $Re(s) > 0$ 时至多按 $O(Re(s)^(-1))$ 的速度衰减。如果某个信号的拉普拉斯变换无法满足任何这样的上界，就可以推断该信号无界，系统也会因此不稳定。

对于系统的“稳定性”，我们给出如下定义：

#definition[
  如果一个系统 $hat(P)$ 对于任意有界输入 $f(t)$，其输出 $hat(P)[f](t)$ 也都是有界函数，那么这个系统就叫*有界输入有界输出（Bounded-Input, Bounded-Output, BIBO）稳定*的。
] <def:bibo-stability>

一个 BIBO 稳定系统的传递函数不一定满足上述 $M / Re(s)$ 上界。例如，恒等映射 $hat(id)[f] = f$ 的脉冲响应是 $delta$ 函数，传递函数为 $overline(id)(s) = 1$。显然不存在实数 $M$ 使 $M / Re(s)$ 在整个右半平面内都大于 $1$，但这并不妨碍 $id$ 是 BIBO 稳定的。

对于一般的线性时不变系统 $hat(P)$，可以证明：

#theorem[
  如果算符 $hat(P)$ 是线性时不变的，且 $hat(P)$ 的脉冲响应 $hat(P)[delta]$ *绝对可积（Absolutely Integrable）*：

  $ integral_0^infinity |hat(P)[delta](t)| dif t = ||hat(P)[delta]||_1 in RR $

  则系统 $hat(P)$ 是 BIBO 稳定的。
  
  反之，如果系统 $hat(P)$ 是 BIBO 稳定的，那么脉冲响应函数 $hat(P)[delta]$ 也绝对可积。
] <thm:absolute-integrability-equiv-bibo>

证明从略。读者可以借助 @def:bibo-stability 自行验证。

我们可以给 @thm:absolute-integrability-equiv-bibo 中的积分式再乘以 $e^(-s t)$。这里要求 $Re(s) > 0$：

$ lr(|integral_0^infinity |hat(P)[delta](t)| e^(-s t) dif t|) = integral_0^infinity |hat(P)[delta](t)| e^(-Re(s) t) dif t <= integral_0^infinity |hat(P)[delta](t)| dif t in RR $

也就是说，如果系统 $hat(P)$ 是 BIBO 稳定的，那么 $hat(P)[delta]$ 的拉普拉斯变换在包含虚数轴及其右侧半平面的区域（记作 $CC_(Re >= 0) = {s in CC | Re(s) >= 0}$）上都需要*绝对收敛*。

注意：这里不仅要求 $integral_0^infinity hat(P)[delta](t) e^(-s t) dif t$ 本身收敛，还要求绝对值 $|hat(P)[delta](t)|$ 的拉普拉斯变换积分收敛。绝对收敛条件排除了 $dif / (dif t)$ 这一类算符：$cal(L)[dif / (dif t)delta(t)] = s$ 在整个复平面上都收敛，但 $cal(L)[lr(|dif / (dif t) delta(t)|)]$ 并不收敛，因此不满足绝对收敛条件。上面的讨论也说明 $dif / (dif t)$ 不是 BIBO 稳定的算符。我们可以构造一个振幅固定但频率逐渐升高的函数，如 $f(t) = sin(t^2)$，此时 $dif / (dif t) f(t)$ 无界。

如果传递函数 $overline(P)(s)$ 是一个有理函数（即可以写成两个多项式函数 $N(s)$ 与 $D(s)$ 之比的函数），那么判断 $overline(P)(s)$ 是否稳定只需要检查这两个条件：

1. $lim_(|s| -> infinity) overline(P)(s)$ 存在且有限，即分子 $N(s)$ 的多项式阶数不能超过分母 $D(s)$ 的阶数。
2. 分母 $D(s)$ 所有根的实部均严格小于 0。

== 一些复变函数知识

接下来我们着重讨论一下传递函数为*有理函数*时的情形。记 $overline(P)(s)$ 为：

$ overline(P)(s) = (N(s)) / (D(s)) = (P_0(s - z_1)^(alpha_1)(s - z_2)^(alpha_2)(s - z_3)^(alpha_3) dots.c (s - z_m)^(alpha_m)) / ((s - p_1)^(beta_1)(s - p_2)^(beta_2)(s - p_3)^(beta_3) dots.c (s - p_n)^(beta_n)) $ <eq:rational-function>

其中 $N(s), D(s)$ 为多项式函数。$N(s)$ 的零点为 ${z_1, z_2, z_3, dots.c, z_m}$，这些点同时也是 $overline(P)(s)$ 的*零点（Zeros）*；$D(s)$ 的零点为 ${p_1, p_2, p_3, dots.c, p_n}$，$overline(P)(s)$ 在这些点上无定义，因此它们被称为 $overline(P)(s)$ 的*极点（Poles）*。零点 $z_i$ 对应的指数 $alpha_i$ 称作零点的*重数（Multiplicity）*，极点 $p_i$ 对应的指数 $beta_i$ 称作极点的*阶数（Order）*。以下为了称呼方便，可能会混用重数和阶数这两个名称。

一个常用的可视化复变函数的方法是将整个复平面染上色，复数的模长决定颜色的亮度，幅角决定颜色的色相。比如，$0$ 对应着纯黑色，$1$ 在 $0$ 正右方因此对应红色，而无穷远点则对应白色。对于函数 $f(z)$，我们在每个点 $z$ 上染上 $f(z)$ 所对应的颜色，这样就可以清晰地看出函数的零点和极点了——黑色点对应的是零点，白色点对应的是极点。

通过观察零点或极点附近颜色的出现顺序，可以判断零点的重数或极点的阶数，如下所示。

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 f(vec2 z) {
      // Expression of the complex function to visualise
      return z;
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 5.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-8192.*c_grid*c_grid), exp(-32768.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [函数 $f(z) = z$ 的着色表示。图上只有一个零点位于 $z = 0$ 处，零点附近的颜色按逆时针顺序为“红-黄-绿-蓝-紫”。]
)

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 f(vec2 z) {
      // Expression of the complex function to visualise
      return cx_div(cx_pow(z, 3.) - vec2(1., 0.), cx_mul(z, z) + 2.0 * z + vec2(5., 0.));
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 5.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-8192.*c_grid*c_grid), exp(-32768.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [函数 $f(z) = (z^3 - 1) \/ (z^2 + 2z + 5)$ 的着色表示。图上有三个零点，对应图中的黑色点，分别位于 $z_1 = 1, z_2 = -1/2 + sqrt(3) / 2 i, z_3 = -1/2 - sqrt(3) / 2 i$。两个极点对应图中的白色点，分别位于 $p_1 = -1 + 2i, p_2 = -1 - 2i$。零点处按逆时针顺序绕一圈看到的颜色是“红-黄-绿-蓝-紫”，而极点处逆时针绕一圈看到的颜色是“紫-蓝-绿-黄-红”。]
)

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 f(vec2 z) {
      // Expression of the complex function to visualise
      return cx_div(cx_pow(z + vec2(1., 0.), 2.), cx_pow(z - vec2(2., 0.), 3.));
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 5.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-8192.*c_grid*c_grid), exp(-32768.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [函数 $f(z) = (z + 1)^2 \/ (z - 2)^3$ 的着色表示。零点 $z = -1$ 的重数为 2，因此逆时针绕零点附近一圈可以看到“红-黄-绿-蓝-紫”按顺序出现了两遍；极点 $p = 2$ 的重数为 3，因此逆时针绕极点一圈可以看到“紫-蓝-绿-黄-红”按顺序出现了三遍。]
)

如果我们考虑一条逆时针绕零点 $z$ 的闭合路径 $gamma : [0, 1] -> CC, gamma(0) = gamma(1)$，其中 $z$ 的重数为 1，并计算路径上每个点的复对数 $ln(f(gamma(t)))$。

$ ln(r e^(i theta)) = ln(r) + i(theta + 2 k pi), k in NN $

那么绕行一周回到 $gamma(0)$ 后，复数的模长不变；由于我们经过了“红-黄-绿-蓝-紫”一整圈颜色，幅角累计增加了 $2pi$。复对数 $ln(z)$ 是多值函数，为使路径经过 $ln$ 映射后仍然连续，应当认为绕行一周后的终点是 $ln(f(gamma(0))) + 2 pi i$，而不是 $ln(f(gamma(0)))$。将“绕零点一周后 $ln(f(gamma(t)))$ 的变化”写成路径积分就是：

$ integral.cont_gamma (f'(z)) / (f(z)) dif z = integral.cont_gamma (ln(f(z)))' dif z = ln(f(gamma(1))) - ln(f(gamma(0))) = 2 pi i $

假如零点的重数不止 1，而是 $m$，那么这个环路积分就会得到 $2 pi i m$。类似地，因为极点附近的颜色是反过来转的，每逆时针绕极点一圈，幅角会变化 $-2 pi n$，因此路径积分为 $-2 pi i n$。

假设一条闭合路径包含了不止一个零点和极点，那么积分 $integral.cont_gamma (f'(z)) / (f(z)) dif z$ 的值就是所有零点重数之和减去所有极点阶数之和。这就是*柯西幅角原理（Cauchy's Argument Principle）*。

#theorem[
  （柯西幅角原理）设闭合路径 $gamma$ 内包含的零点总重数为 $N$，极点总阶数为 $P$，则有

  $ integral.cont_gamma (f'(z)) / (f(z)) dif z = 2 pi i (N - P) $
] <thm:cauchy-argument-principle>

柯西幅角原理是一个很强大的数学工具，可以让我们直接通过观察某条闭合路径上的积分来计算一块区域里的零点和极点数量。由于分析传递函数稳定性时需要检查所有极点的实部是否均小于 0，柯西幅角原理对于我们分析这些系统的稳定性非常有帮助。

== 极点分析示例

考虑一个带有延迟的电压跟随器：

#figure(
  image("voltage-follower-with-delay.svg"),
  caption: [一个带有延迟线的电压跟随器。这里假定运放是一个倍数为 $A$ 的无延迟放大器；延迟线是一条理想延迟线，只将信号向后平移，不对信号做任何扭曲、变形等操作。]
)

这个系统的结构同样可以使用 @fig:system-diagram-of-simple-amplifier 表示，只不过这里的 $beta = T_(-Delta t)$ 是一个时间平移操作。整个系统的传递函数是：

$ overline(A) / (1 + overline(A) overline(beta)) = A / (1 + A e^(-s Delta t)) $

如果我们取 $A -> infinity$ 的极限，得到 $e^(s Delta t)$，那么这个函数的确在整个复平面上都没有极点。但如果 $A$ 是有限值，情况就不一定了：

$
1 + A e^(-s Delta t) = 0 \
s = 1 / (Delta t) (ln A + (2 k + 1) pi i), k in NN
$

极点的实部为 $(ln A) / (Delta t)$，考虑到真实电路中 $A$ 很大同时 $Delta t$ 很小，这个极点会在正半平面非常靠右的位置。我们可以从拉普拉斯变换的角度来解读这个极点：在我们输入一个单位脉冲 $V_in (t) = delta(t)$ 之后，系统输出的电压 $V_"out" (t)$ 的拉普拉斯变换就是系统的传递函数：

$ cal(L)[lr(V_"out"|)_(V_"in" (t) = delta(t))](s) = A / (1 + A e^(-s Delta t)) $

由于极点 $s = 1 / (Delta t) (ln A + (2 k + 1) pi i)$ 的实部为 $ln A \/ Delta t$，这意味着拉普拉斯变换只在 $Re(s) > ln A \/ Delta t$ 时才会收敛。

$ integral_0^infinity V_"out" e^(-s t) dif t in RR <=> Re(s) > (ln A) / (Delta t) $

这意味着，$V_"out" (t)$ 的振幅包络会按 $exp((ln A) / (Delta t)t)$ 增长。同时，观察极点的虚部可以看出其振荡角频率应当形如 $omega = 1/(Delta t) (2k + 1) pi$。

如果不追求完全严谨，也可以这样简明直观地理解：延迟线将信号延迟了一个固定的时长 $Delta t$，而这个时长对于不同频率的振荡来说对应着不同的相位差。如果输出信号的某个频率分量经过延迟线之后恰好延迟了 $k$ 个整数周期加上半个周期（即相位总体滞后了 $(2k + 1) pi$），那么就会将原本电路的负反馈变成正反馈，导致振幅不断增大。用这种方法能够较快判断出一个系统自激振荡的频率是多少，但是不能分析出来振荡的增幅会有多快。

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_exp(vec2 a) {
      float er = exp(a.x);
      return vec2(er * cos(a.y), er * sin(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 f(vec2 z) {
      // Expression of the complex function to visualise
      float A = 2.0;
      float dt = 1.0;
      return cx_div(vec2(A, 0.0), vec2(1.0, 0.0) + A * cx_exp(-z * dt));
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 24.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-2048.*c_grid*c_grid), exp(-8192.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [理想运放和理想延迟线构成的电压跟随器的传递函数 $A / (1 + A e^(-s Delta t))$，取 $A = 2, Delta t = 1$，纵向范围缩放至 $[-12, 12]$。]
)

实际的放大器电路中，延迟无法避免；而我们也不想一连上放大器就看到高频自激振荡。因此，实际放大器通常都会带有一个低通滤波环节。如果你去查一些常用运算放大器的数据手册（比如 LM358 @ti2024lm358），大部分运放的开环增益都会随着频率升高而降低，通常到 $1 "MHz"$ 附近时已经没有多少可用增益。

为了探究添加低通滤波会给上面这个电路带来什么样的影响，我们可以尝试将运放的传递函数建模成一个时间常数为 $tau_0$ 的低通滤波：

$ overline(V_"out") / overline(V_"in") = (A / (1 + s tau_0)) / (1 + A / (1 + s tau_0) e^(-s Delta t)) = A / (1 + s tau_0 + A e^(-s Delta t)) $

求解方程 $1 + s tau_0 + A e^(-s Delta t) = 0$ 的代数解略微有点繁琐，这里就不详细说明了。下面这张图展示了加入低通滤波后的传递函数；可以看到，通过调整滤波时间常数，传递函数的极点可以全部移动到负半平面，从而使系统稳定。

#figure(
  shadertoy-figure[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_exp(vec2 a) {
      float er = exp(a.x);
      return vec2(er * cos(a.y), er * sin(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 f(vec2 z) {
      // Expression of the complex function to visualise
      float A = 2.0;
      float dt = 1.0;
      float tau0 = 1.0 + sin(iTime);
      return cx_div(vec2(A, 0.0), vec2(1.0, 0.0) + z * tau0 + A * cx_exp(-z * dt));
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 24.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-2048.*c_grid*c_grid), exp(-8192.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [加入低通滤波后的运放和延迟线构成的电压跟随器的传递函数 $A / (1 + s tau_0 + A e^(-s Delta t))$，取 $A = 2, Delta t = 1$，$tau_0$ 在 $0$ 与 $2$ 之间反复变化。纵向范围缩放至 $[-12, 12]$。]
)

可以看出，运算放大器在高频时放大倍数降低的特性并不是一个工程上的缺陷。恰恰相反，这个特性是保证运算放大器正常工作所必需的。

== 奈奎斯特判据

回到 @fig:system-diagram-of-simple-amplifier 所表示的放大器电路上。这个电路的传递函数是：

$ overline(V_"out") / overline(V_"in") = overline(A) / (1 + overline(A) overline(beta)) $

这里的分母和分子的多项式阶数是由 $overline(A)$ 和 $overline(A) overline(beta)$ 这两项决定的，因此只需要看 $beta$ 的最高次项即可判断系统是否稳定，这个操作相对比较简单。除此之外，只需要检查传递函数的极点（也就是分母 $(1 + overline(A) overline(beta))$ 的零点）是否均在 $Re(s) < 0$ 的半平面上即可。

记这个电路的*开环增益（Open-Loop Gain）*为：

$ overline(F)(s) = overline(A)(s) overline(beta)(s) $

#figure(
  table(
    columns: 2,
    diagram(
      node-stroke: 0.6pt,
      {
        node((-0.7, 1), $V_"in"$, stroke: none)
        edge("-|>")
        node((0.2, 1), $A$, shape: shapes.triangle.with(dir: right))
        edge("-|>")
        node((1.8, 1), $beta$, shape: shapes.rect)
        edge("-|>")
        node((2.7, 1), $V_"out"$, stroke: none)
      }
    ),
    diagram(
      node-stroke: 0.6pt,
      {
        node((0.2, 1), $A$, shape: shapes.triangle.with(dir: right))
        edge("-|>")
        node((1.8, 1), $beta$, shape: shapes.rect)
        edge((1.8, 1), (2.5, 1), (2.5, 2), (-0.7, 2), (-0.7, 1), "-|>", label: $-$, label-pos: 100%, label-size: 8pt)
        node((-0.7, 1), $Sigma$, inset: 2pt)
        edge("-|>", (0, 1))
        node((-1.5, 1), $V_"in"$, stroke: none)
        edge("-|>", (-0.7, 1), label: $+$, label-pos: 100%, label-size: 8pt)
        node((1, 0.5), $V_"out"$, stroke: none)
        edge((0.2, 1), (1, 1), (1, 0.5), "-|>")
        node((2.7, 1), $V_-$, stroke: none)
      }
    ),
    [(a)], [(b)]
  ),
  caption: [(a) 开环系统，传递函数为 $overline(F) = overline(beta) overline(A)$。(b) 闭环系统，传递函数为 $overline(A) \/ (1 + overline(F)) = overline(A) \/ (1 + overline(A) overline(beta))$。]
) <tab:open-and-closed-loop-gain>

我们再额外假设 $overline(F)(s)$ 是一个有理函数（注意这个假设并不永远合理，通常只适用于无延迟的系统）。那么，根据柯西幅角原理（@thm:cauchy-argument-principle），只需要找一个包围整个右半平面的大圈，就可以计算 $1 + overline(F)(s)$ 的零点数与极点数之差。*奈奎斯特曲线（Nyquist Contour）*就是这样一个圈，由两部分组成：

1. 整个虚数轴，即 $r -> infinity$ 时连接 $-r i$ 到 $r i$ 的直线。
2. 一个半径为无穷大的右半圆弧，即 $r -> infinity$ 时的曲线 $r e^(i t), t in [-pi/2, pi/2]$。

#figure(
  cetz-canvas({
    import cetz.draw: *

    let red = rgb("#d62728")
    let grid-gray = rgb("#d4d4d4")

    grid(
      (-3.2, -3.2),
      (3.2, 3.2),
      step: 0.5,
      stroke: (paint: grid-gray, thickness: 0.3pt),
    )

    line(
      (-3.3, 0),
      (3.55, 0),
      stroke: (paint: black, thickness: 0.8pt),
      mark: (end: ">"),
    )
    line(
      (0, -3.3),
      (0, 3.45),
      stroke: (paint: black, thickness: 0.8pt),
      mark: (end: ">"),
    )
    content((3.64, 0), [$Re$], anchor: "west")
    content((0, 3.56), [$Im$], anchor: "south")

    arc(
      (0, 0),
      start: -90deg,
      stop: 90deg,
      radius: 2.6,
      anchor: "origin",
      stroke: (paint: red, thickness: 1.1pt),
    )
    line(
      (0, -2.6),
      (0, 2.6),
      stroke: (paint: red, thickness: 1.1pt),
    )

    for angle in (-75deg, -50deg, -25deg, 0deg, 25deg, 50deg, 75deg) {
      let direction = (calc.cos(angle), calc.sin(angle))
      line(
        (direction.at(0) * 2.6, direction.at(1) * 2.6),
        (direction.at(0) * 2.95, direction.at(1) * 2.95),
        stroke: red,
        mark: (end: ">"),
      )
    }

    content(
      (2.25, 2.15),
      text(fill: red, size: 9pt)[$r -> infinity$],
      anchor: "west",
    )
  }),
  caption: [奈奎斯特路径的示意图。当 $r$ 趋向无穷大时，红色路径趋近于奈奎斯特路径。],
)

函数 $1 + overline(F)(s)$ 将奈奎斯特曲线映射到了复平面上的一条闭合路径。根据之前的推理，映射过后的路径总共绕原点多少圈，$1 + overline(F)(s)$ 在正半平面里的零点数减去极点数就是多少。由于 $overline(F)(s)$ 和 $1 + overline(F)(s)$ 之间只相差了常数 $1$，这个判定也可以使用奈奎斯特曲线经过 $overline(F)(s)$ 映射后绕点 $-1$ 的圈数来算。

注意到，将整条虚数轴通过 $overline(F)(s)$ 映射后的曲线就是我们在分析系统频率响应时见过的*奈奎斯特图（Nyquist Plot）*——增益对应着传递函数的复数模长，输出与输入的幅角之差对应着传递函数的幅角。实际上，分析频率响应时见到的这个奈奎斯特图只是完整的奈奎斯特图的一半，另一半则是奈奎斯特曲线第二部分的无穷大半圆经过 $overline(F)(s)$ 映射后的曲线。

举个例子，考虑一个理想微分器与两个全通环节串联而成的线性系统：

$ overline(F)(s) = (s((s + 1)^2 + 1)((s - 1)^2 + 4)) / (((s - 1)^2 + 1)((s + 1)^2 + 4)) $

直接观察这个系统的表达式，可以看出这个系统有 5 个零点和 4 个极点。我们希望知道这个系统在闭环控制中是否稳定。根据之前的推理，闭环传递函数 $overline(A) / (1 + overline(F)(s))$ 右半平面的极点就是函数 $1 + overline(F)(s)$ 右半平面的零点。我们现在只知道 $overline(F)(s)$ 的表达式，如果要求解 $1 + overline(F)(s)$ 的零点还需要解一个五次方程，在数学上不好处理。

但是别忘了，$1 + overline(F)(s)$ 右半平面的零点数减去极点数可以根据 $overline(F)(s)$ 的奈奎斯特图绕点 $-1$ 的圈数算出来，而在 $overline(F)(s)$ 上加上 $1$ 不会改变函数的极点分布——因为函数的分母仍然不变，而极点是由分母的零点决定的。因此，仅根据 @fig:pole-zero-and-nyquist 中的信息就可以得出 $1 + overline(F)(s)$ 在右半平面上的零点数量。

#figure(
  table(
    columns: 2,
    align: center,
    cetz-canvas(length: 1.168cm, {
      import cetz.draw: *

      let grid-gray = rgb("#d4d4d4")
      let zeros = ((0, 0), (-1, 1), (-1, -1), (1, 2), (1, -2))
      let poles = ((1, 1), (1, -1), (-1, 2), (-1, -2))

      grid(
        (-2.4, -2.4),
        (2.4, 2.4),
        step: 0.5,
        stroke: (paint: grid-gray, thickness: 0.3pt),
      )

      line(
        (-2.5, 0),
        (2.5, 0),
        stroke: (paint: black, thickness: 0.8pt),
        mark: (end: ">"),
      )
      line(
        (0, -2.5),
        (0, 2.5),
        stroke: (paint: black, thickness: 0.8pt),
        mark: (end: ">"),
      )
      content((2.6, 0), [$Re$], anchor: "west")
      content((0, 2.6), [$Im$], anchor: "south")

      for z in zeros {
        circle(z, radius: 0.055, stroke: (paint: black, thickness: 0.9pt))
      }
      for p in poles {
        line(
          (p.at(0) - 0.055, p.at(1) - 0.055),
          (p.at(0) + 0.055, p.at(1) + 0.055),
          stroke: (paint: black, thickness: 0.9pt),
        )
        line(
          (p.at(0) - 0.055, p.at(1) + 0.055),
          (p.at(0) + 0.055, p.at(1) - 0.055),
          stroke: (paint: black, thickness: 0.9pt),
        )
      }
    }),
    cetz-canvas(length: 0.46cm, {
      import cetz.draw: *

      let red = rgb("#d62728")
      let green = rgb("#2a9d3a")
      let blue = rgb("#1f6feb")
      let grid-gray = rgb("#d4d4d4")

      let cadd(a, b) = (a.at(0) + b.at(0), a.at(1) + b.at(1))
      let cmul(a, b) = (
        a.at(0) * b.at(0) - a.at(1) * b.at(1),
        a.at(0) * b.at(1) + a.at(1) * b.at(0),
      )
      let cdiv(a, b) = {
        let denom = b.at(0) * b.at(0) + b.at(1) * b.at(1)
        (
          (a.at(0) * b.at(0) + a.at(1) * b.at(1)) / denom,
          (a.at(1) * b.at(0) - a.at(0) * b.at(1)) / denom,
        )
      }
      let eval-f(s) = {
        let sp = cadd(s, (1, 0))
        let sm = cadd(s, (-1, 0))
        let first = cdiv(
          cadd(cmul(sp, sp), (1, 0)),
          cadd(cmul(sm, sm), (1, 0)),
        )
        let second = cdiv(
          cadd(cmul(sm, sm), (4, 0)),
          cadd(cmul(sp, sp), (4, 0)),
        )
        cmul(s, cmul(first, second))
      }

      grid(
        (-6.5, -6.5),
        (6.5, 6.5),
        step: 2,
        stroke: (paint: grid-gray, thickness: 0.3pt),
      )

      line(
        (-6.5, 0),
        (6.5, 0),
        stroke: (paint: black, thickness: 0.8pt),
        mark: (end: ">"),
      )
      line(
        (0, -6.5),
        (0, 6.5),
        stroke: (paint: black, thickness: 0.8pt),
        mark: (end: ">"),
      )
      content((6.6, 0), [$Re$], anchor: "west")
      content((0, 6.6), [$Im$], anchor: "south")

      let radius = 5
      let green-points = range(0, 181).map(k => {
        let theta = (-90 + k) * 1deg
        eval-f((radius * calc.cos(theta), radius * calc.sin(theta)))
      })
      line(
        ..green-points,
        stroke: (paint: green, thickness: 1.1pt),
      )

      let red-points = range(0, 201).map(k => {
        let omega = -radius + 2 * radius * k / 200
        eval-f((0, omega))
      })
      line(
        ..red-points,
        stroke: (paint: red, thickness: 1.1pt),
      )
      circle((-1, 0), radius: 0.13, fill: blue, stroke: none)
    }),
    [(a)], [(b)],
  ),
  caption: [
    系统 $overline(F)(s)$ 的 (a) 零极点图与 (b) 奈奎斯特图。(a) 图中圆圈表示零点，叉表示极点；(b) 图中红色曲线是虚轴的像，绿色曲线是大半径右半圆弧的像。蓝点标出 $(-1, 0)$，曲线绕该点的缠绕圈数为 $0$（逆时针为正）。
  ],
) <fig:pole-zero-and-nyquist>

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 F(vec2 s) {
      vec2 sp = s + vec2(1.0, 0.0);
      vec2 sm = s - vec2(1.0, 0.0);
      vec2 numerator = cx_mul(
          cx_mul(sp, sp) + vec2(1.0, 0.0),
          cx_mul(sm, sm) + vec2(4.0, 0.0)
      );
      vec2 denominator = cx_mul(
          cx_mul(sm, sm) + vec2(1.0, 0.0),
          cx_mul(sp, sp) + vec2(4.0, 0.0)
      );
      return cx_mul(s, cx_div(numerator, denominator));
  }

  vec2 f(vec2 z) {
      return F(z);
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 5.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-8192.*c_grid*c_grid), exp(-32768.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  caption: [开环传递函数 $overline(F)(s)$ 的着色表示。]
) <fig:example-system-open-loop>

由于 $overline(F)(s)$ 在复平面右侧有两个极点，$1 + overline(F)(s)$ 也一定有两个极点。又由于奈奎斯特图上曲线绕点 $-1$ 的圈数为 $0$，$1 + overline(F)(s)$ 在复平面右半边的零点数减去极点数也等于 $0$。二者结合，可以算出 $1 + overline(F)(s)$ 在复平面右侧的零点数为 2，因此闭环传递函数 $1 / (1 + overline(F)(s))$ 在右半平面也有两个极点。与 @fig:example-system-closed-loop 核对后可以确认，这个系统不稳定。

#figure(
  shadertoy-figure(classes: ("shadertoy-pause",))[
  ```glsl
  #define PI 3.141592653589

  vec2 cx_mul(vec2 a, vec2 b) {
      return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
  }
  vec2 cx_div(vec2 a, vec2 b) {
      return vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)));
  }
  #define cx_modulus(a) length(a)
  #define cx_abs(a) length(a)
  #define cx_conj(a) vec2(a.x, -a.y)
  #define cx_arg(a) atan(a.y, a.x)
  vec2 cx_sin(vec2 a) {
      return vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y));
  }
  vec2 cx_cos(vec2 a) {
      return vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y));
  }
  vec2 cx_pow(vec2 a, float n) {
      float angle = atan(a.y, a.x);
      float r = length(a);
      float real = pow(r, n) * cos(n*angle);
      float im = pow(r, n) * sin(n*angle);
      return vec2(real, im);
  }

  vec3 hsl2rgb( in vec3 c ) {
      vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }


  vec2 F(vec2 s) {
      vec2 sp = s + vec2(1.0, 0.0);
      vec2 sm = s - vec2(1.0, 0.0);
      vec2 numerator = cx_mul(
          cx_mul(sp, sp) + vec2(1.0, 0.0),
          cx_mul(sm, sm) + vec2(4.0, 0.0)
      );
      vec2 denominator = cx_mul(
          cx_mul(sm, sm) + vec2(1.0, 0.0),
          cx_mul(sp, sp) + vec2(4.0, 0.0)
      );
      return cx_mul(s, cx_div(numerator, denominator));
  }

  vec2 f(vec2 z) {
      return cx_div(vec2(1.0, 0.0), vec2(1.0, 0.0) + F(z));
  }

  float sigmoid(float x) {
      return 1.0 / (1.0 + exp(-x));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y * 5.0;
      vec2 z = f(uv);

      float c = sigmoid(log(length(z)));
      vec3 hsl = vec3(cx_arg(z)/(PI*2.0), sqrt(c), 0.5*(1.0+c));
      vec3 rgb = hsl2rgb(hsl);
      vec2 c_grid_2 = abs((fract(uv/5.0+0.5)-0.5)*5.0);
      vec2 f_grid_2 = abs(fract(uv+0.5)-0.5);
      float c_grid = min(c_grid_2.x, c_grid_2.y);
      float f_grid = min(f_grid_2.x, f_grid_2.y);
      float grid = max(exp(-8192.*c_grid*c_grid), exp(-32768.*f_grid*f_grid));
      fragColor = vec4(rgb * (1.-0.5*grid), 1.0);
  }
  ```
  ],
  kind: raw,
  caption: [闭环传递函数 $1 / (1 + overline(F)(s))$ 的着色表示。]
) <fig:example-system-closed-loop>

#bibliography("reference.bib")
