---
title: 狭义相对论光线追踪 原理解析 2
layout: blog
tags: ["physics", "special-relativity", "computer-graphics"]
---

约定：以下类已经实现

- `Vec3`：存储了一个三维向量。
    - 重载运算符定义了`+`, `-`, `*`, `/`等运算
    - `dot(u, v)`点乘
    - `cross(u, v)`叉乘
- `LVec4`：存储了一个闵氏时空的四维向量。
    - 重载运算符定义了`+`, `-`, `*`, `/`等运算
    - `dot(u, v)`点乘
    - `v.getXYZ()`获取四维向量的三维空间分量

## 存储一个惯性系

如何将一个惯性参考系的信息存储下来？

首先，我们可以先选定一个参考系，称为*世界参考系*。这样其他一切惯性参考系都可以用它们和世界参考系之间的相对速度$\vec u$来表示了。

但是注意，只记录一个速度向量$\vec u$是不够的，因为惯性系之间不只有相对速度，还有可能有平移、旋转之类的相对变换。

这里我们只考虑相对速度$\vec u$和平移$\mathbf p$这两个因素，暂时不考虑旋转~~，主要是因为我懒得推旋转参考系的公式~~。也就是这样的一个类：

```cpp
class Transformation {
public:
    Transformation(const Vec3 &velocity, const LVec4 origin);
private:
    Vec3 velocity;
    LVec4 origin;
    // Vec3为三维向量，LVec4为闵氏时空中的四维向量
};
```

我们定义平移向量$\mathbf p$为**当前参考系的原点（即$(0, 0, 0, 0)$点）点在世界参考系中的测量结果**。注意：世界参考系的原点在当前参考系的测量结果不一定是$-\mathbf p$，可以想一下原因。

显然，世界参考系就是平移$\mathbf p$和速度$\vec u$都为零向量的参考系。

参考系类还需要实现这两个方法，用来做事件的参考系变换：

```cpp
class Transformation {
public:
    // ...
    LVec4 toLocal(const LVec4 &world) const;
    LVec4 toWorld(const LVec4 &local) const;
private:
    // ...
};
```

具体的公式可以参考[上一篇博客]({% link blog/_posts/2022-10-14-relativistic-renderer-0.md %})。

## 存储一条光线

“光线”是一种用来描述光传播的抽象模型，它在狭义相对论中同样适用。

一束光在时空图中就是一条斜率为光速的射线：

![spacetime-diagram](/img/ray-spacetime-diagram-wikipedia.svg)

*图源：[Wikipedia](https://en.wikipedia.org/wiki/Spacetime_diagram)*

为了唯一确定一条这样的射线，我们需要光的**光源$\mathbf r$**和光线**方向$\vec d$**。其中$\vec d$一定是一个单位向量。

现在的`Ray`类是这样的：

```cpp
class Ray {
public:
    Ray(const LVec4 &origin, const Vec3 &direction);
private:
    LVec4 origin;
    Vec3 direction;
};
```

我们定义一个函数`atDistance`，表示在世界参考系看来，到光源的空间距离为$l$的事件。就是这样的：

```cpp
LVec4 atDistance(float dist) const {
    return LVec4(origin.t + dist, origin.getXYZ() + dist * direction);
}
```

在走了一段距离之后，世界参考系下坐标的时间和空间都会增加。

![spacetime-diagram](/img/ray-spacetime-diagram-0.png)

~~众所周知geogebra啥都能画~~

接下来，`Transformation`类里还要加上这两个函数，用来对光线进行参考系变换：

```cpp
class Transformation {
public:
    // ...
    Ray toLocal(const Ray &ray) const;
    Ray toWorld(const Ray &ray) const;
private:
    // ...
};
```

光线的参考系变换也很简单，只需要对光源$\mathbf r$做事件的参考系变换，方向$\vec d$做速度的参考系变换即可。

## 物体

定义这样的一个抽象类，来表示所有的物体：

```cpp
class VisibleObject {
public:
    VisibleObject(const Transformation &tr);

    struct IntersectResult {
        LVec4 intersection;
        float distance;
    };
    virtual std::optional<IntersectResult> intersect(const Ray &ray) const = 0;

private:
    Transformation transformation;
};
```

`VisibleObject`类中使用`transformation`记录了一个匀速运动的物体所在的参考系。

`intersect`函数是这个类的核心。它的任务是计算一条**物体参考系里的光线**和该物体的**交点**。返回值`std::optional<IntersectResult>`在有交点的时候返回该交点的信息（包括交点的时空坐标，以及交点到光源的空间距离）；如果没有交点，那么返回一个空引用。

> `std::optional`是C++17的新特性，可以用来表示一个“有值或者没有值”的对象。更多信息可以看[cppreference](https://en.cppreference.com/w/cpp/utility/optional)。

另一个值得注意的点是：由于光线追踪的过程是**回溯**光的路径，所以每次求出的交点应该在光路的**反方向**上，`distance`值应当为负数。

![forward-tracing](/img/forward-ray-tracing-0.jpg)

> 实际上由于光路可逆原则，将光线的方向全部反向之后，每次求光路正方向上的交点，理论上也是可行的。
>
> **但是**，如果你真的打算这么写，那么就要尤其注意光线的参考系变换。因为这样的话，`Ray`类里记录的方向向量$\vec d$和光的速度向量**是相反的**，光线的`toLocal`和`toWorld`里对应项也需要变符号。
>
> ~~之前被这个bug困扰了一个晚上，在这里写下来以警示后人~~

### 球体

为了展示`intersection`函数，这里举一个简单的例子：球体。不妨假设球体的球心在原点$(0, 0, 0)$

假设有一个在**物体参考系**里的光线`ray`（不是世界参考系，所以不用考虑参考系变换）。光线从原点$\vec r$出发，向前走了距离$l$，走到的坐标是：

$$\vec r_1=\vec r + l\vec d$$

如果$\vec r_1$是光线和球的交点，那么$\vec r_1$到球心（即原点）的距离一定等于球的半径，即：

$$||\vec r_1||=||\vec r + l\vec d||=R$$

![ray-sphere-intersection](/img/ray-sphere-intersection-0.png)

将向量模长写成向量点乘自己，也就是：

$$(\vec r + l\vec d)\cdot(\vec r + l\vec d)=R^2$$

展开这个式子：

$$(\vec r + l\vec d)\cdot(\vec r+l\vec d) = \vec r\cdot\vec r + 2l\vec r\cdot\vec d + l^2\vec d\cdot\vec d = R^2$$

$$\vec d^2l^2+2(\vec r\cdot\vec d)l+(\vec r^2-R^2)=0$$

由于$\vec d$是单位向量，$\vec d^2=1$，代入原式得到：

$$l^2+2(\vec r\cdot\vec d)l+(\vec r^2-R^2)=0$$

我们得到了一个关于$l$的一元二次方程，它的每个根就代表了光线和球的一个交点到光源的距离（这个距离可能是负数，此时表示交点在光线的反方向，而这正是我们想要的）。只需要解出这个方程，然后再判断两个根$l_1, l_2$是否是负数，以及它们之间的大小关系，即可找到光线和球的最近交点。

得到光源到交点的空间距离$l$之后，再做一次`ray.atDistance(l)`即可得到交点的具体坐标。

代码：

```cpp
std::optional<IntersectionResult> SphereObject::intersect(const Ray &ray) const {
    Vec3 r0 = ray.getOrigin().getXYZ();  // 光源的空间坐标
    float b = 2 * dot(r0, ray.getDirection());
    float c = dot(r0, r0) - radius * radius;
    float delta = b * b - 4 * c;         // 二次方程判别式
    
    float l = (-b + sqrt(delta)) / 2;    // 优先考虑较大的根
    if(l > 0) {
        // 如果较大的根超出范围，那么考虑另一个根
        l = (-b - sqrt(delta)) / 2;
    }
    if(l > 0) {
        return std::nullopt;             // 返回一个空引用
    }
    return IntersectionResult(ray.atDistance(l), l);  // 返回答案
}
```
