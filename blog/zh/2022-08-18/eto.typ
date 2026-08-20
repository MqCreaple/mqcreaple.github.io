// title: 埃氏筛的复杂度计算
// summary: 用同阶无穷大与积分比较法推导埃氏筛时间复杂度为 $O(N log log N)$。
// tags: algorithm, mathematics, time-complexity
// category: tech

#import "../../template.typ": article, definition, lemma, proof

#show: article.with(
  title: "埃氏筛的复杂度计算",
  lang: "zh",
)

*埃拉托斯特尼筛法（Sieve of Eratosthenes）*，简称*埃氏筛*，是一种可以在极少时间复杂度内算出 $n$ 以内的所有质数的算法。

= 算法流程

对于一个给定的整数 $n$，从2开始执行以下操作：

1. 将该数标记为质数
2. 将所有该数的倍数标记为“非质数”
3. 找到下一个不被标记为“非质数”的数，重复步骤1

算法的逻辑很简单，代码也极其简短。以 C 语言为例：

```c
int sieve(int n, int *ans) {
    int found = 0;
    bool p[n];

    memset(p, 0, n);
    for (int i = 2; i < n; i++) {
        if (p[i]) {
            continue;
        }
        ans[found++] = i;
        for (int j = 2; i * j < n; j++) {
            p[i * j] = 1;
        }
    }

    return found;
}
```

= 初步分析

那么这个算法的时间复杂度如何计算呢？

我们不妨追踪一下算法的执行过程：

- 首先从$2$开始，算法遍历了所有$1$到 $n$ 中$2$的倍数，也就是进行了 $n/2$ 步操作
- 接下来找到下一个质数：$3$。算法又遍历了$1$到 $n$ 中$3$的倍数，进行了 $n/3$ 步操作
- 再然后，跳过$4$找到下一个质数$5$，遍历了$1$到 $n$ 中$5$的倍数，进行了 $n/5$ 步操作
- ……

那么最后一共执行了多少步操作？答案是一个无穷级数之和：

$ n / 2 + n / 3 + n / 5 + n / 7 + n / 11 + dots $

将 $n$ 提出来，并将剩余项写成求和符号，就是：

$ n dot sum_(p" is prime") 1 / p $

问题来了，后面这个无穷级数怎么求？

= 何为时间复杂度？

可能大部分人会以为这是一个困难的数论问题，但是不要忘了，计算时间复杂度的时候，只需要考虑*数据趋近无穷的趋势*，而*不用考虑具体数值*。

那么如何定义“趋势”？我们不妨借鉴一下小学二年级的高数知识：

#definition[
如果两个趋近无穷的数列 $a_n$ 和 $b_n$ 满足

$ lim_(n -> infinity) a_n / b_n = c $

其中 $c$ 为一个常数且不为$0$，那么这两个数列称为*同阶无穷大*，记作 $a_n tilde b_n$。
]

根据同阶无穷大定义时间复杂度的大 $O$ 记号了：

#definition[
对于某个算法，如果它只有一个输入 $N$，那么将 $N$ 依次代入从$1$开始的所有自然数，记 $t_i$ 为输入数字 $i$ 时算法的运行时间（或者说“执行的操作数”），那么可以得到一个数列 $\{t_N\}$。

假如存在一个*简单表达式* $q_N$，使得

$ t_N tilde q_N $

那么记这个算法的时间复杂度为 $O(q_N)$。
]

思考题：根据同阶无穷大的定义，证明：

- $O(N^2 + 2N) tilde O(N^2)$

= 无穷级数

即便有了这样的定义，我们就将问题化解为了：*寻找一个简单表达式，使得它和“所有质数的倒数和”是同阶无穷大*。

在这之前，我们可以使用一个已经被证明过的结论：质数分布是 $O(N log N)$ 的。记第 $n$ 个质数为 $p_n$，则：

$ p_n tilde n ln n $

从这里还不能完全得出我们想要的结论，但我们已经可以对开头提到的无穷级数进行化简了：

$ sum_(n=1)^infinity 1/p_n tilde sum_(n=1)^infinity 1/(n ln n) $

#lemma[
若 $a_n, b_n$ 均*非负*且为同阶无穷小，即 $a_n tilde b_n$，则

$ sum_(n=1)^infinity a_n tilde sum_(n=1)^infinity b_n $
]

#proof[
根据同阶无穷小的定义，可得：

$ lim_(n -> infinity) a_n / b_n = c $

根据极限的 $epsilon-N$ 定义，对于任给的 $epsilon > 0$，总存在 $N > 0$，使得所有 $n > N$ 都有：

$ c - epsilon < a_n / b_n < c + epsilon $

因为 $n$ 可以取任何大于 $N$ 的值，再根据恒等式 $a/b < (a+c)/(b+d) < c/d$，可以将所有形如 $a_n/b_n$ 的分式合并而不影响其性质：

$ c - epsilon < (sum_(n=N)^infinity a_n) / (sum_(n=N)^infinity b_n) < c + epsilon $

换句话说，存在 $N > 0$ 使得

$ (sum_(n=N)^infinity a_n)/(sum_(n=N)^infinity b_n) $

是有限且非$0$的。

又因为 $sum_(n=1)^(N-1) a_n$ 和 $sum_(n=1)^(N-1) b_n$ 是有限的，所以

$ (sum_(n=1)^(N-1) a_n)/(sum_(n=1)^(N-1) b_n) $

是有限的。

根据恒等式 $a/b < (a+c)/(b+d) < c/d$，可以得到：

$ (sum_(n=1)^(N-1) a_n + sum_(n=N)^infinity a_n)/(sum_(n=1)^(N-1) b_n + sum_(n=N)^infinity b_n) = (sum_(n=1)^infinity a_n)/(sum_(n=1)^infinity b_n) $

一定也是有限且非$0$的。
]

经过此次化简，至少题目看起来像道代数题而不是数论题了，但无穷级数 $sum_(n=1)^infinity 1/(n ln n)$ 仍然让人没有头绪。

#lemma[
对于一个*单调函数* $f(n)$

$ sum_(n=1)^infinity f(n) tilde integral_1^infinity f(n) dif n $
]

#proof[
#image("eto-0.png", width: 70%)

$ integral_1^infinity f(n) dif n = sum_(k=1)^infinity integral_k^(k+1) f(n) dif n $

不妨假设函数 $f(n) > 0$，则 $f(n)$ 单调减。又因为 $lim_(n -> infinity) f(n) = 0$，因此：

$
& sum_(k=1)^infinity f(k) - sum_(k=1)^infinity integral_k^(k+1) f(n) dif n \
=& sum_(k=1)^infinity [f(k) - integral_k^(k+1) f(n) dif n] \
<=& sum_(k=1)^infinity [f(k) - f(k+1)] \
=& f(1) - 0 \
=& f(1)
$

也就是说 $sum_(n=1)^infinity f(n)$ 和 $integral_1^infinity f(x) dif x$ 之间至多相差常数 $f(1)$，又因为两者均不为$0$，那么两者之比一定有限且非$0$。

证毕
]

有了这个结论，我们就能直接得到：

$ sum_(n=1)^infinity 1/(n ln n) tilde integral_1^infinity dif n /(n ln n) tilde ln ln n $

回到最初的问题：

$ N dot sum_(p" is prime") 1 / p tilde N sum_(n=1)^infinity 1/(n ln n) tilde N ln ln N $

也就是说，埃氏筛的时间复杂度是 $O(N log log N)$

参考资料见 @sieveWikipedia 与 @distributionOfPrimes。

= 思考题

1. （简单）请用本文中的定理证明：
   $ sum_(n=1)^infinity 1/n tilde ln n $
2. （困难）请不用本文提到的方法证明题目1

#bibliography("reference.bib", title: "参考资料")
