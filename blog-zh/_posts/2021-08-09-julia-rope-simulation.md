---
title: Julia对绳索振动的模拟
layout: blog
tags: ["julia", "simulation"]
---


## 仿真结果+代码

且看老夫打一遍 松果——弹抖——闪电鞭！

这是慢打：

![julia-1](/img/julia-1.gif)

这是快打：

![julia-2](/img/julia-2.gif)

![松果弹抖闪电鞭](/img/mabaoguo.gif)

然后是代码：

```julia
# Vector2D.jl
module Vector2D
import Base:+,-,*,/
import Base:length, LinRange
export Vec2D, length, un, +, -, *, /, LinRange

struct Vec2D
    x::Float64
    y::Float64
end
Vec2D() = Vec2D(0, 0)

length(a::Vec2D)::Float64 = √(a.x^2 + a.y^2)
un(a::Vec2D) = Vec2D(a.x / √(a.x^2+a.y^2), a.y / √(a.x^2+a.y^2))
+(a::Vec2D, b::Vec2D) = Vec2D(a.x+b.x, a.y+b.y)
-(a::Vec2D, b::Vec2D) = Vec2D(a.x-b.x, a.y-b.y)
*(a::Vec2D, b::Float64) = Vec2D(a.x*b, a.y*b)
/(a::Vec2D, b::Float64) = Vec2D(a.x/b, a.y/b)
LinRange(l::Vec2D, r::Vec2D, n::Integer) = Vec2D.(LinRange(l.x, r.x, n), LinRange(l.y, r.y, n))
end
```

```julia
# simu.jl
push!(LOAD_PATH,".")
using Plots
using Printf
using Vector2D

left = Vec2D(-1, 0)   # left end
right = Vec2D(1, 0)   # right end

m = 0.05              # total mass
k = 10.               # stiffness factor
n = 90                # number of mass points on a string
r = Vector(LinRange(left, right, n))   # position of each mass point
v = repeat([Vec2D()], n)               # velocity of each mass point
t  = 0.                # current time
dt = 0.002             # time duration for every loop
originLength = length(r[2]-r[1])

@gif for rep ∈ 1:10000
    global λ, k, n, r, v, originLength, t, dt
    deltaR = [
        r[i+1] - r[i]
        for i in 1:length(r)-1
    ]

    ## calculate force on each point ##
    F = repeat([Vec2D()], n)
    for i ∈ 1:length(r)
        if i == 1 || i == length(r)
            continue
        else
            F[i] = un(deltaR[i]) * (length(deltaR[i])-originLength) * k -
                    un(deltaR[i-1]) * (length(deltaR[i-1])-originLength) * k
        end
    end
    if rep <= 50
        F[n÷2] = F[n÷2] + Vec2D(0, 0.02)
    end

    ## update time dt ##
    v = v + (F./(m/n)).*dt
    r = r + v.*dt
    t = t + dt

    ## plot ##
    plot(
        map((v) -> v.x, r),
        map((v) -> v.y, r),
        label="time=" * @sprintf("%.3f", t),
        ylims=(-0.14, 0.14)
    )
end every 25
```

前排提醒：代码运行大约需要1分钟，请耐心等待。。。

## 方法
1. 将绳索看作由弹簧依次连接的$n$个质点
1. 使用数组`r[]`记录每个质点的位置，数组`v[]`记录每个质点的速度
1. 定义变量`dt`，代表一个微小时间间隔
1. 每一次循环，计算每个质点的受力`F[]`，其中端点增加一个特判
1. 接着依次更新`v`和`r`，最后画出来即可

## 失败案例集锦

![fail-1](/img/julia-fail-1.gif)

![fail-2](/img/julia-fail-2.gif)

![fail-3](/img/julia-fail-3.gif)
