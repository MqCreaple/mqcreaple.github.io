---
title: battlecode开发日志
layout: blog
tags: ["computer"]
---

*2023.1.27补：比赛结果*

![battlecode-rank](/img/battlecode-rank.png)

最近几天由于打竞赛打到自闭了（我太菜了），想整点其他的事情做一做，在学校信息社的推荐下打算玩一下MIT办的[battlecode](https://battlecode.org/)比赛。

battlecode是一个竞技性比赛。在一张固定大小的地图上，两方各有很多不同功能机器人，而最终的目的是操作机器人占领尽可能多的天空岛（sky island）。只不过玩家不能直接操控，而是要为场上的机器人写代码，让程序自动运行。

简要的说明一下规则：
- 机器人有如下几类
    - 总部（headquarter）：不能移动，可以存储资源，也可以消耗矿物来搭建其它类型的机器人
    - 运输器（carrier）：可以用来在指定矿点挖矿，也可以用来搬运锚点（anchor）
    - 发射器（launcher）：可以用来打人
    - 减速器（temporal destabilizer）：可以在一定范围内增加所有机器人的行动冷却时间
    - 加速器（temporal booster）：可以在一定范围内减少盟友机器人的行动冷却时间
    - 信号增幅器（amplifier）：用来传递信息，可以移动
- 每个格子可能是如下几种之一：
    - 默认：机器人可以通过，无任何特殊效果
    - 天空岛（sky island）：机器人可以通过，可以在上方放置锚点将其标记为“占领”，也可以在被对方占领的岛上驻守更多机器人来将其取消标记
    - 矿井（well）：机器人可以通过，内部包含无限的特定资源，运输器可以在该格及其周边8个格子挖矿
    - 风（current）：吹向一个固定方向，每回合在风里的机器人会强制向该方向移动一格
    - 云（cloud）：在云内的机器人不会被其他机器人检测到，但是仍然可以被攻击或者被施加加速/减速效果
    - 障碍物：机器人不可通过
- 机器人的可视范围非常有限，但是机器人可以知道自己的x、y坐标以及地图大小
- 机器人之间不会自动共享信息，但是可以通过写入/读取*共享内存*来传递信息
    - 共享内存为64个16位整数，即一共有128byte
    - 所有机器人都可以从共享内存中读取信息，但是只有在总部（headquarter）和信号增幅器（amplifier）附近可以写入内存
- 机器人每回合内不能做过多计算。battlecode中直接使用java的bytecode数量来衡量计算量（可以理解为代码编译成的汇编代码的行数）。如果一个回合的计算超出限制，该机器人的进程会被强制结束，并在下回合内从断点处恢复。

可能稍微说的有点多了。当然这还不是全部的规则，更详细的规则可以到[官方文档](https://releases.battlecode.org/specs/battlecode23/2.0.3/specs.md.html)中查看。

## 基本战略

我们最初的想法其实很简单：让每个机器人各司其职

1. 运输器每次随机选取一个矿点，走到矿点附近挖矿，挖完后回到总部。如果看到总部制作了锚点，那么就带上锚点前往天空岛并放置。
2. 发射器每次随机分配一个地点，在该地点附近移动，如果看到可以攻击的目标就攻击
3. 信号增幅器在地图上随机移动

这个代码看起来并不难实现，但还是有些技术细节需要确认：

## 共享内存的格式

由于地图的大小不会超过60x60，地图上一个点的坐标只用6位x坐标+6位y坐标=12位二进制即可表示。

最初我们的规划是这样的：每一个16位数存储一个坐标，并且用2个二进制位来标识该坐标上方的特殊区域类型

```
TTXX XXXX XYYY YYYY
```

其中左边是高位，右边是低位。`T`表示具体信息，`X`表示x坐标，`Y`表示y坐标。

`T`的含义取决于该地的类型，比如矿井的`T`表示里面的矿的类型，天空岛的`T`表示该天空岛被哪方占领。

后来被改成了这个样子：

```
CCTT XXXX XXYY YYYY
```

将x坐标和y坐标的存储从7二进制位缩减成了6二进制位。前面的`C`暂时没有分配用途。

而共享内存里总共64个数被分割成了不同的区块
1. 下标0到7：记录每个矿井的坐标
2. 下标8到11：记录每个我方总部的坐标
3. 下标12到47：记录每个天空岛的坐标。如果天空岛的大小不止一格，则记录任意一个点的坐标
4. 下标48到51：记录每个敌方总部的坐标
5. 下标52到57：记录战场位置（需要着重派兵的位置）
6. 下标58到62：暂无用途
7. 下标63：记录共享内存的状态（是否已经初始化等等）

每个可移动的机器人不仅有各自的职业，还需要时刻探索地图并将有用的信息记录到共享内存里

> 问题：那如果机器人发现了一个之前没有探到的位置，但距离信号增幅器太远而无法写入共享内存，怎么办？
>
> 答：如果机器人无法写入内存村，那么它可以先将所有探到的位置记录在自己的内存中（每个机器人有不超过5M的本地内存），等走到增幅器附近再写入。

> 问题：如果关于某个位置的信息过时了怎么办？比如，如果某座岛在第500回合的时候被我方占领，而观察到这个信息的机器人再第700回合才到了增幅器附近，而此时这个岛已经不被我们占领了。
>
> 答：这确实是一个好问题，其实直到比赛最后我们队才意识到信息是有可能过时的。后来我们试图在16位数的`C`位置记录某个信息的时间戳，但由于`C`只有2位，只能记录一个非常模糊的时间，并且后来我们没有时间写完代码了，这个计划被迫放弃。

## 改进

### 战斗

最初我们的策略是，给每个发射器随机分配一个任务：
1. 20%概率，在家附近防守
2. 35%概率，在天空岛附近防守
3. 35%概率，前往敌方基地，堵住敌方基地的大门
4. 10%概率，随机移动并探索地图

这个策略把我们拉到了排行榜1400分左右，但还是容易轻易地被对手干爆。一大原因是它过于依赖随机性。

后来我们学习了那些和我们对局并在兵力上战胜我们的其他队伍的策略，发现他们的发射器大多都是有组织地行动，一次来很多，而不是一个一个地派过来。[TZ](https://ttzytt.com/)受此启发，在发射器的代码中加入了自动检测战场的部分。
- 如果一个机器人发现周围的敌方机器人数量超过3，则会将它所在的地方标记为战场
- 发射器会优先前往战场，再执行自己被分配到的任务
- 当总战场的数量超过4，总部就会进入战备状态，将生成发射器的比例调高

### 寻路算法

在最开始我们用了一个非常朴素的算法：
1. 尝试向目标方向走一格
2. 如果不能走，则向左（或向右）旋转45°，尝试向该方向走一格。反复执行该操作直到可以走
3. 如果行动力没有消耗完，则回到1，否则退出

这个方法可以越过一段平直的墙，但是无法越过两面90度夹角的墙。

后来我们组的[TZ](https://ttzytt.com/)大佬试图使用A\*算法来寻路，但是比较不幸地，写挂了。我们也想尝试用Cooperative A\*算法，但是因为各个机器人之间共享信息非常不方便，我们组也没有想到比较好的解决方法，这个计划也被搁置了。

## 遇到的一系列问题

*以下问题按照产生的时间从早到晚排序*

> 存储矿点坐标的时候只有特定种类的矿会被存下来

这个问题源于整数的类型转换。

由于battlecode提供的内存相关的API都使用`int`，而我们的代码里记录内存使用的是`short`。当我把short的最高位设成1的时候，它就会成为一个负数，而转化成int之后仍然是个负数，它就会因为超出$0$到$2^16-1$的范围而无法被存入共享内存中。

由于Adamantium矿的类型标记是`01`，而Mana矿的类型标记是`10`，Mana矿的最高二进制位是1，所以只有Adamantium的坐标被存入了共享内存，而Mana则没有。

> 每次随机出来的数都等于0

这个代码的问题出在类似这样的一个位置。这行代码本来想生成从0到某个常数的随机数：

```java
return (int) rnd.nextFloat() * CONSTANT;
```

不知道你们有没有一眼看出问题呢？

这里运算符的计算顺序是这样的：

<div class="mermaid">
graph TD
A([*]) --> B([int])
A --> C[CONSTANT]
B --> D[rnd.nextFloat]
</div>

也就是说，生成的浮点数会先被转化成整数，再进行乘法。而`rnd.nextFloat()`生成的浮点数永远在$[0, 1)$区间内，所以先转化成整数时就会永远变成0。

修复这个bug可以这样写：

```java
return (int) (rnd.nextFloat() * CONSTANT);
```

或者因为它生成的随机数是整数，其实更好的方法是使用取模运算：

```java
return rnd.nextInt() % CONSTANT;
```
