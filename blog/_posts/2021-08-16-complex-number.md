---
title: 对于复数的另一种理解
layout: blog
tags: ["math"]
---

## 应付考试

虚数$i$是一个人为定义的数字，满足$i^2=-1$

复数就是一个实数加上一个虚数，即$z=a+bi$

复数的运算有交换律，结合律，分配律：

$$z_1+z_2=(a_1+b_1i)+(a_2+b_2i)=(a_1+a_2)+(b_1+b_2)i$$

$$z_1z_2=(a_1+b_1i)(a_2+b_2i)=a_1a_2+(a_1b_2+a_2b_1)i+b_1b_2i^2=(a_1a_2-b_1b_2)+(a_1b_2+a_2b_1)i$$

复数的模长$\mid z\mid=\sqrt{a^2+b^2}$，辐角$\arg(z)=\arctan\dfrac{b}{a}$

复数的共轭$z^*=a-bi$

## 平面？向量？

观察复数的加法运算律，不难发现，这其实就是对应项相加。实数与实数相加，虚数与虚数相加，就得到了最终结果

是不是感到了一丝丝的熟悉？没错，**平面向量**的加法也是对应项相加！

$$z_1+z_2=(a_1+b_1i)+(a_2+b_2i)=(a_1+a_2)+(b_1+b_2)i$$

$$\vec{v}+\vec{w}=(v_1\hat\imath+v_2\hat\jmath)+(w_1\hat\imath+w_2\hat\jmath)=(v_1+w_1)\hat\imath+(v_2+w_2)\hat\jmath$$

我们完全可以声称：任何复数$z$，都可以对应到一个向量$\vec{v}$上，复数的加减法和向量的加减法完全一致

之前我们想要表示一个向量需要两个数，现在引入复数之后，使用一个复数即可

通常我们将横轴作为实数轴，纵轴作为虚数轴，那么任何复数$a+bi$都可以对应到一个向量$\begin{bmatrix}a\\ b\end{bmatrix}$上

![complex-0](/img/complex-0.jpg)

现在我们把复数的加减法整明白了，可是，复数乘法呢？

## 矩阵？
复数的乘法能够对应到向量中的哪个运算吗？

点乘？显然不是，复数乘法的结果仍然是复数，而点乘的结果是实数

叉乘？更不可能了，叉乘只在三维空间中有定义

排除掉这两种可能性之后，我们只剩下了：**矩阵乘法**

可是不对啊！刚刚明明说了，复数对应着向量，为什么又会有矩阵呢？

让我们再仔细看看复数的乘法：

$$\Large{z_1\cdot z_2}$$

对于这个式子，我们固然可以将它单纯地看作两个数字相乘，但是也可以像看待矩阵乘法那样，将第一个乘子$z_1$看作是某种操作符，将其对$z_2$作用，得到一个结果

$$f(z)=z_1\cdot z$$

这样的话，$z_1\cdot z_2$就可以看作是$z_1$对应的某个矩阵$M$和$z_2$对应的向量$\vec{v}$的乘积了

接下来，我们需要根据复数运算结果反推出$z_1$所对应的矩阵

假设$z_1=a+bi$，$z_2=c+di$，那么根据上面的运算律，有$z_1z_2=(ac-bd)+(ad+bc)i$，换句话说就是：

$$\text{某个矩阵}M\cdot\begin{bmatrix}c\\ d\end{bmatrix}=\begin{bmatrix}ac-bd\\ ad+bc\end{bmatrix}$$

待定系数计算得到：

$$M=\begin{bmatrix}a&-b\\ b&a\end{bmatrix}$$

这也就是$z_1=a+bi$对应的矩阵了

$$a+bi \leftrightarrow \begin{bmatrix}a&-b\\ b&a\end{bmatrix}$$

我们不难发现，不仅复数乘法可以使用矩阵计算，甚至复数的加减法也可以用矩阵来计算：找到两个复数对应的矩阵，对其求和，接着再转换回复数

这个时候我们就可以从另一个方面思考复数的共轭：对于一个复数$z=a+bi$，它的共轭$z^*=a-bi$，这两个复数对应的矩阵分别为：

$$z\leftrightarrow \begin{bmatrix}a&-b\\ b&a\end{bmatrix} \qquad z^*\leftrightarrow \begin{bmatrix}a&b\\ -b&a\end{bmatrix}$$

$z$与$z^*$对应的矩阵互为转置矩阵！我们有了另一条对应关系：

$$\text{复数共轭}\leftrightarrow\text{矩阵转置}$$

这样，根据矩阵转置的性质，我们也可以推出共轭复数的一些性质（这些性质也可以直接从共轭的定义推出）：

$$(M^T)^T=M\leftrightarrow (z^*)^*=z$$

$$M^T+N^T=(M+N)^T\leftrightarrow z_1^*+z_2^*=(z_1+z_2)^*$$

$$kM^T=(kM)^T\leftrightarrow kz_1^*=(kz_1)^*$$

$$M^TN^T=(MN)^T\leftrightarrow z_1^*z_2^*=(z_1z_2)^*$$

行列式？
翻一下之前的复数基本知识，现在我们已经能够表示复数的加减乘除了，复数的共轭也不是问题，还有什么没有被矩阵表示的吗？嗯，对了，复数的模！

如果我们计算复数$a+bi$对应矩阵的行列式：

$$\det\left(\begin{bmatrix}a&-b\\ b&a\end{bmatrix}\right)=a^2+b^2$$

这个数字，就是复数模长$\mid z\mid=\sqrt{a^2+b^2}$的平方。我们再一次增加了一个对应关系：

$$\text{复数模长}\leftrightarrow\text{矩阵行列式}$$

由此我们还能推出更多复数运算律：

$$k\det M=\det(kM)\leftrightarrow k\mid z\mid=\mid kz\mid$$

$$\det M=\det(M^T)\leftrightarrow \mid z\mid=\mid z^*\mid$$

$$\det(M^{-1})=(\det M)^{-1}\leftrightarrow \mid z^{-1}\mid=\mid z\mid^{-1}$$

总结一下，现在我们已经为复数赋予了两层含义：

1. 向量：$$\begin{bmatrix}a\\ b\end{bmatrix}$$ 能够表示复数的加减法
2. 矩阵：$$\begin{bmatrix}a&-b\\ b&a\end{bmatrix}$$ 能够表示复数的加减乘除和共轭

其中平面向量拥有2个自由度，与复数的自由度相同，但没办法表示复数的全部运算；矩阵拥有4个自由度，是复数的2倍，能够表示复数的所有运算

在最后，我们使用复平面和线性变换的可视化工具，我们还可以给复数赋予另一个含义：

## 复平面？旋转？

之前我们一直使用直角坐标系进行运算，还没有尝试过极坐标系下有什么新发现

定义复数$z$的模长$\mid z\mid=r$，辐角$\arg(z)=\theta$，那么：

$$z=r\cos\theta+ir\sin\theta$$

对应的矩阵为：

$$\begin{bmatrix}r\cos\theta& -r\sin\theta\\ r\sin\theta& r\cos\theta\end{bmatrix}$$

这个矩阵可以拆分成：

$$\begin{bmatrix}r&0\\ 0&r\end{bmatrix}\begin{bmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{bmatrix}$$

前一部分$$\begin{bmatrix}r&0\\ 0&r\end{bmatrix}$$表示将向量伸长$r$倍，后一部分$$\begin{bmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{bmatrix}$$表示将向量逆时针旋转$\theta$角度

也就是说，复数的乘法，可以看作是复平面上的“伸长+旋转”操作

比如下面的变换，就是整个复平面乘上$\sqrt3+i$的结果

<iframe width="1200" height="675" max-width="100%" max-height="100%" src="https://www.youtube.com/embed/cA3n6NknBzw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

根据以上推断，我们可以得到如下结论：

$$\mid z_1z_2\mid = \mid z_1\mid\mid z_2\mid$$

$$\arg(z_1z_2)=\arg(z_1)+\arg(z_2)$$

这也就是“模长相乘，辐角相加”这一口诀的来源。甚至我们还可以大胆猜测，$z$应当是$r$乘上某个数的$\theta$次方

$$z=rx^\theta$$

有了泰勒公式之后，便可以得到，此处的$x$等于$e^i$，即：

$$z=re^{i\theta}$$

这个公式也被称为复数的**指数表示**，使用指数表示，我们有：

$$z_1z_2=r_1e^{i\theta_1}\cdot r_2e^{i\theta_2}=(r_1r_2)e^{i(\theta_1+\theta_2)}$$

但是，指数表示只能用于计算乘除法，加减法的计算还需要矩阵和向量

注意到$e$上方的指数并不是个实数，而是个纯虚数$i\theta$，我们还可以将这个运算进行推广，从而得到任何复数的任何复数次幂，鉴于篇幅有限，就不赘述了

## 总结一下

复数的三个理解方式，以及其各自的应用：

1. 向量形式：用来表示向量的加减法
1. 矩阵形式：啥都能干
1. 指数形式：用来表示平面的旋转

复数的计算规则简单，存储空间小，同时它可以做到许多向量和坐标系做不到的功能，因此在许多地方都有应用