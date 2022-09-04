---
title: Y combinator和递归
layout: blog
tag: ["lambda-calculus", "math"]
---

<link rel="stylesheet" href="/app/lambda-playground/lambda-playground.css" />
<script src="/app/lambda-playground/lambda-playground.js" onload="autoRender()"></script>

**如果你不了解λ演算，请阅读[上一篇博客]({% link blog/_posts/2022-08-27-lambda.md %})以获得最佳食用体验**

*注：本文的λ表达式中所有出现的下划线`_`，都表示“这个值我懒得算且不关心”*

## Y组合子

其实，并不是所有的λ表达式都可以化简。比如说，一个经典的构造就是：

```plaintext
((λx. (x x)) (λx. (x x)))
```

<p class="lambda-r">[ [ "λx", [ "x", "x" ] ], [ "λx", [ "x", "x" ] ] ]</p>

这个表达式很有意思。当你把后面的表达式代入前面的`x`中时，你又会得到和原来一摸一样的表达式，你永远也无法化简它。也就是，它是**不可求值**的。

而我们对这个表达式简单地变一下，就得到了另一个表达式：

```plaintext
((λx. f (x x)) (λx. f (x x)))
```

<p class="lambda-r">[ [ "λx", [ "f", [ "x", "x" ] ] ], [ "λx", [ "f", [ "x", "x" ] ] ] ]</p>

当你把后一项代入前一项时，它不仅得到了原来的表达式，而且还在外面多套上了一层函数`f`。再进行一次替换操作，函数外面又多了一层`f`，你可以一直这样无穷无尽地迭代下去。

稍稍将外面这个函数改一下，就得到了著名的**Y组合子(Y combinator)**：

```lisp
Y := λf. ((λx. f (x x)) (λx. f (x x)))
```

Y组合子的一大性质就是：

```lisp
(Y f) = (f (Y f))
```

由于它和函数的不动点$x=f(x)$长得很像，所以Y组合子也叫**不动点组合子(fixed point combinator)**。

*注：Y组合子并不是唯一的不动点组合子。比如由Alan Turing给出的Θ组合子*

```lisp
Θ := ((λx. λy. y (x x y)) (λx. λy. y (x x y)))
```

*它同样满足不动点组合子的性质：*

```lisp
(Θ f) = (f (Θ f))
```

根据不动点组合子的性质，任何不动点组合子`fix`都有：

```lisp
(fix f) = (f (fix f))
        = (f (f (fix f)))
        = (f (f (f (fix f))))
        = ...
        = (n f (fix f))
```

其中`n`为任意有限的自然数。这个式子我们在之后还会用到。如果你忘记了自然数的Church计数法，可以回到[上一篇博客]({% link blog/_posts/2022-08-27-lambda.md %})。

## 函数递归

Y组合子的一大用途，就是在λ代数中表示“递归”。

例如，你可能会这样写一个求阶乘的函数：

```plaintext
fac = λx. (if (x==0)
                (1)
                (x*(fac (x-1))))
```

（为了方便起见，这里我就不写成前缀表达式了）

> 注：`if`语句
>
> `(if b x y)`的定义是：如果`b`为真，返回`x`，否则返回`y`。
>
> 根据我们对布尔值`T`和`F`的定义：
>
> ```plaintext
> T := λa. λb. a
> F := λa. λb. b
> ```
>
> 语句`(if b x y)`可以看作是`(b x y)`的另一种写法

可惜的是，λ演算里并没有递归的语法。但是有了Y组合子，我们也可以实现类似递归的效果。

首先我们重写一下刚刚的`fac`函数：

```plaintext
fac = λf. λx. (if (x==0)
                    (1)
                    (x*(f (x-1))))
```

现在`fac`变成了接受一个函数`f`和参数`x`的函数。那么接下来：

```lisp
(Y fac 5)
```

就可以正确地返回我们想要的结果。证明如下：

```plaintext
(Y fac 5) = ((fac (Y fac)) 5)                       ; 利用(Y f)=(f (Y f))
          = (if (5==0) (1) (5*((Y fac) (5-1))))     ; 将5代入x，(Y fac)代入f
          = 5*((Y fac) 4)                           ; 展开if
          = 5*(fac (Y fac) 4)                       ; 还是(Y f)=(f (Y f))
          = 5*(if (4==0) (1) (4*((Y fac) (4-1))))   ; 继续展开
          = 5*4*((Y fac) 3)
          = ...
          = 5*4*3*2*1*((Y fac) 0)
          = 5*4*3*2*1*(fac (Y fac) 0)
          = 5*4*3*2*1*(if (0==0) (1) (0*((Y fac) (0-1))))
          = 5*4*3*2*1*1
          = 5!
```

更一般地，对于一个函数$f$：

$$f=\lambda x_1.\ \lambda x_2.\ \lambda x_3.\ \cdots\ \lambda x_n.\ [\text{BODY}]$$

而$f$的函数体中使用了递归（即：调用了自己），那么我们可以将$f$改写为$f'$使得它能够在我们的λ代数中运行：

$$f'=\lambda g.\ \lambda x_1.\ \lambda x_2.\ \cdots\ \lambda x_n.\ [\text{BODY}][f:=g]$$

后面的$[\text{BODY}][f:=g]$表示将函数体里所有出现的$f$全部替换成$g$。如果你没有理解为什么要这样做，可以仔细思考一下上面阶乘的例子。

进行求值的时候，只需要：

$$((Y\ f')\ x_1\ x_2\ x_3\ \cdots\ x_n)$$

就相当于计算了递归函数$f$代入参数$x_1$到$x_n$的值。

## 列表和懒惰求值

### 列表

你应该还记得上篇文章的思考题里出现了一个`pair`函数。它满足：

```lisp
(first (pair a b)) = a
(second (pair a b)) = b
```

一个可行的构造利用了布尔值`T`和`F`的性质：

```lisp
pair := λa. λb. λt. (t a b)              ; 其中t为一个布尔值
first := λp. (p T)
second := λp. (p F)
```

在`pair`的基础上，你还可以构造出另一个数据结构：列表`list`。

```lisp
(list3 a b c) := λNIL. (pair a (pair b (pair c NIL)))
(list4 a b c d) := λNIL. (pair a (pair b (pair c (pair d NIL))))
(list5 a b c d e) := λNIL. (pair a (pair b (pair c (paid d (pair e NIL)))))
```

其中`NIL`是一个占位符，用来标志列表结尾。

一个特殊的列表是空列表：`list0`

```lisp
list0 := λNIL. NIL
```

有了这些定义之后，我们就可以用递归的语法来定义列表的一些操作。比如：

#### 列表判空

要求：只有当传入的列表是空列表时，返回`T`，否则返回`F`

```lisp
null := λl. (l F (λx. λy. λz. F) T)
```

首先我们发现，除了空列表以外，其他列表都是`λNIL. (pair _ _)`的形式。将`pair`函数展开得到：`λNIL. λb. (b _ _)`。如果将函数`null`作用于这个非空列表，就会得到：

```lisp
(null l) = ((λl. (l F (λx. λy. λz. F) T)) (λNIL. λb. (b _ _)))
         = ((λNIL. λb. (b _ _)) F (λx. λy. λz. F) T)
         = ((λx. λy. λz. F) _ _ T)                       ; 函数接收3个参数并返回常值F
         = F
```

而空列表则会返回：

```lisp
(null list0) = ((λl. (l F (λx. λy. λz. F) T) (λNIL. NIL))
             = ((λNIL. NIL) F (λx. λy. λz. F) T)
             = (F (λx. λy. λz. F) T)
             = ((λa. λb. b) (λx. λy. λz. T) T)
             = T
```

#### 列表的第一个元素

```lisp
car := (first (l _))
```
`car`返回了列表的第一个元素，前提是列表`l`非空。

类似地，可以写出`cdr`，返回列表除了第一个元素以外的其他元素构成的列表：

```lisp
cdr := λNIL. (second (l NIL))
```

`car`和`cdr`这两个函数名可能看起来很奇怪，但这两个函数名来源于最古老的函数式编程语言：Lisp。~~这也是Lisp的函数命名经常被吐槽的原因之一~~

#### 列表长度

有了`null`函数，很多列表的操作都能用递归实现了。比如列表的长度计算：

```lisp
length := λl. (if (null l)
                    (0)
                    ((length (cdr l))+1))
```

注意到`(second l)`返回列表`l`从第二项到末尾的子列表，它的长度一定是原列表的长度减去1。

我们可以用前文所说的方法将函数转化为一个非递归函数，并用Y组合子求值。

#### 列表第`n`项

假设下标从0开始。

```lisp
nth := λl. λn. (if (null l)
                     (error "Index out of bound!")      ; 如果是空列表，报错
                     (if (n==0)
                          (car l)
                          (nth (cdr l) (n-1))))
```

这里利用`(nth l n) = (nth (cdr l) (n-1))`递归查找第`n`项。

#### 添加元素

```lisp
append := λl. λa. λNIL. (l (pair a NIL))
```

在列表末尾追加元素`a`，相当于把列表的`NIL`替换成`(pair a NIL)`。

```lisp
prepend := λl. λa. λNIL. (pair a (l NIL))
```

在列表前面添加元素`a`，相当于在原来的`l`外面套一层函数`(pair a)`。

#### 筛选元素

函数`(filter c l)`返回列表`l`中所有满足条件`c`的元素构成的新列表。

```lisp
filter = λc. λl.
         (if (null l)
               (list0)                                    ; 如果l是空列表，返回一个空列表
               (if (c (car l))
                     (prepend (filter (cdr l) c) (car l))
                     (filter (cdr l) c)))
```

~~如果你试着手打一下这一层套一层的括号，就能理解Lisp的痛了~~

例如我们有一个列表`l = [1, 2, 3, 4] = λNIL. (pair 1 (pair 2 (pair 3 (pair 4 NIL))))`，那么：

```lisp
(filter (λx. x>2) l)
```

就会返回列表：`[3, 4]`。而：

```lisp
(filter (λx. x%2==0) l)
```

就会返回列表：`[2, 4]`

### 无限长列表

既然我们定义了有限长的列表，那么是否可以定义无限长的列表？

不妨看一下这个递归函数：

```plaintext
r := λNIL. (pair 1 (r NIL))
```

它展开后会得到一个无限重复`1`的列表：

```plaintext
λNIL. (pair 1 (pair 1 (pair 1 (pair 1 (......)))))
```

稍稍更改一下，还可以得到由所有自然数构成的列表：

```plaintext
s := λn. λNIL. (pair n (s n+1 NIL))
(s 0) = λNIL. (pair 0 (pair 1 (pair 2 (pair 3 (......)))))
```

接下来我们探讨一下类似这样的列表的性质：

#### 判空

以上文中的`r=(1, 1, 1, 1, ...)`为例：

```lisp
r' = λf. λNIL. (pair 1 (f NIL))
(null r) = (null (Y r'))
         = ((Y r') F (λx. λy. λz. F) T)
         = ((λNIL. pair 1 (Y r' NIL)) F (λx. λy. λz. F) T)
         = ((λx. λy. λz. F) 1 (Y r' _) T)
         = F
```

这个结果也在意料之内，因为无限长的列表肯定不是空的。

#### 第`n`个元素

先看看`r=[1, 1, 1, 1, ...]`：

```lisp
r' = λf. λNIL. (pair 1 (f NIL))
(nth r n) = (nth (Y r') n)
          = (if (null (Y r'))
                  (_)
                  (if (n==0)
                        (car (Y r'))
                        (nth (cdr (Y r')) (n-1))))
          = (if (n==0)                                 ; 根据前文的结论，(null r) = F，跳过第一个分支
                  (car (Y r'))
                  (nth (cdr (Y r')) (n-1)))
```

> 引理：
>
> ```lisp
> (car (Y r')) = (car (r' (Y r')))
>              = (car (λNIL. pair 1 (Y r' NIL)))
>              = 1
> ```
>
> ```lisp
> (cdr (Y r')) = (cdr (r' (Y r')))
>              = (cdr (λNIl. pair 1 (Y r' NIL)))
>              = λNIL. (Y r' NIL)
>              = (Y r')
> ```
> 换句话说，列表`(Y r')`的第一个元素永远是`1`，而它从第二个元素开始的子列表就是自己

回到上面的证明：

```lisp
(nth r n) = (if (n==0)
                  (1)
                  (nth r n-1))
```

由于`n`是自然数，函数重复足够多轮数之后，一定会让`n`减少到`0`，此时函数返回`1`。也就是：

```lisp
(nth r n) = 1
```

接着我们再说`s`。使用类似的方法可以得到：

```lisp
s' = λf. λn. λNIL. (pair n (f n+1 NIL))
(car (s n)) = (car (Y s' n)) = n
(cdr (s n)) = (cdr (Y s' n)) = (s n+1)
```

根据这两个结论，可以推出来：

```lisp
(nth (s n) m) = (if (m==0)
                      (car (s n))
                      (nth (cdr (s n)) m-1))
              = (if (m==0)
                      (n)
                      (nth (s n+1) m-1))
```

根据数学归纳法，不难知道：`(nth (s n) m)`的返回值为`n+m`。特别地，`(nth (s 0) m)`就是`m`。

### 懒惰求值

当然，无限长列表的应用远不止这些。比如，斐波那契数列：

```lisp
fib = λa. λb. λNIL. (pair a (fib b a+b NIL))
(fib 1 1)       ; [1, 1, 2, 3, 5, 8, 13, ...]
```

甚至我们可以使用埃氏筛算法，写出一个装满所有质数的列表：

```lisp
sieve := λl. (prepend
               (sieve (filter (λx. x%(car l)!=0) (cdr l)))  ; 去掉(cdr l)中所有(car l)的倍数
               (car l))

(sieve (s 2))           ; [2, 3, 5, 7, 11, 13, 17, ...]
```

如果你使用过haskell或者其他支持数组懒惰求值的编程语言，应该或多或少了解过这种写法。它允许你使用有限的语言来描述一个无限长的数列！

*当然，懒惰求值只能表示出**可计算**的无限序列，例如上面说的斐波那契数列和质数数列，或者π的第n位等。这是因为，λ演算的计算能力和图灵机是等价的，任何不能用图灵机算出的数值同样也不能用λ演算算出来。*
