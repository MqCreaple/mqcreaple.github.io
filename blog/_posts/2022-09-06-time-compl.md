---
title: 【整活】所有算法都是O(1)的
layout: blog
tags: ["algorithm", "time-complexity", "jokes"]
---

*注：本文全部内容为**一本正经的胡说八道**，请勿相信*

## 示范：快速排序算法

**第一步：复制粘贴一份代码**

```cpp
void qsort(int *a, int l,int r)
{
    int pivot = a[(l+r)/2];
    int i = l, j = r;
    do {
        while(a[i] < pivot) i++;
        while(a[j] > pivot) j--;
        if(i<=j) {
            swap(a[i], a[j]);
            i++;
            j--;
        }
    } while(i <= j);
    if(l < j) qsort(a, l, j);
    if(i < r) qsort(a, i, r);
}
int main() {
    const int N = 100001;
    int n;
    int a[N];
    cin >> n;
    for(int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a, 0, n-1);            // sort the array
    for(int i = 0; i < n; i++) {
        cout << a[i] << " ";
    }
}
```

然后我们很失望，因为这个算法是$O(N\log N)$的。

**第二步：观察数据范围**

![time-compl-0](/img/time-compl-0.png)

我们发现，$N$不超过$10^5$，接下来就有办法了。

**第三步：补齐数组**

在我们的代码里面更改下面几处：

```diff
int main() {
    const int N = 100001;
    int n;
    int a[N];
    cin >> n;
    for(int i = 0; i < n; i++) {
        cin >> a[i];
    }
+   for(int i = n; i < N; i++) {
+       a[i] = INT32_MAX;       // fill the rest of array with INT32_MAX
+   }
-   sort(a, 0, n-1);            // sort the array
+   sort(a, 0, N-1);            // sort the whole array
    for(int i = 0; i < n; i++) {
        cout << a[i] << " ";
    }
}
```

然后你就惊奇地发现，不管你输入的数组是多大，这个算法都会排序$1$到$N$之间的所有数，它所需要的执行时间都是一样的。换句话说：**这个算法是$O(1)$的**。

**第四步：为自己献上热烈的掌声**

至此，你成功地将一个$O(N\log N)$的算法变成了$O(1)$的算法。

## 练习

1. $O(1)$计算快速幂
2. $O(1)$解决图的最短路问题
3. $O(1)$解决A+B problem
