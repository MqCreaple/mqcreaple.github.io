---
title: 从λ演算高级函数式语言
layout: blog
tags: ["lambda-calculus", "computation", "mathematics"]
---

之前写过许多篇关于λ演算和函数式编程的文章 [*]({% link blog-zh/_posts/2022-08-27-lambda.md %}) [*]({% link blog-zh/_posts/2022-09-02-y-combinator.md %}) [*]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %}) [*]({% link blog-zh/_posts/2025-10-21-logic-and-proof.md %})。在这里，我想以Lean为例，展示一下一个简单的证明是如何一步步变成λ演算最底层的代码的。

## 从1+1=2说起

不妨看一下下面这个证明：

```plaintext
theorem one_plus_one_is_two_2 : (∃ x : Nat, x + 1 = 2)
  := by exists 1
```

我们使用`exists`策略来给出`∃ x : Nat, x + 1 = 2`的一个例子，即`x = 1`。接下来，Lean会自动为我们计算1+1的值并证明其等于2。整个证明只用一行就能写完。但是，就在这一行的背后是许多被省略掉的细节。

### Step 1：展开所有依赖项

首先，我们在这段证明中省略了自然数的定义，以及自然数加法和自然数相等的定义。为了看清这段证明背后的细节，我们不妨自己实现一个自然数类型：

```plaintext
inductive _Nat where
  | zero : _Nat
  | succ : _Nat → _Nat

def _Nat.add (a b : _Nat) : _Nat
  := match a with
    | _Nat.zero => b
    | _Nat.succ (c : _Nat) => _Nat.succ (_Nat.add c b)

def _zero : _Nat := _Nat.zero
def _one : _Nat := _Nat.succ _zero
def _two : _Nat := _Nat.succ _one
```

为了不和标准库里的函数重名，我在每个名称前加了一个下划线。自然数的实现方法在前面几篇文章中都讲过了。接下来需要写一段代码判断自然数相等。注意，由于$a=b$是一个命题，所以此处的等号（$=$）应该是输入两个自然数、输出一个命题的依赖类型，而不是一个函数：

$$\lang = \rang : \N\to\N\to\ast$$

我们可以这样定义：

```plaintext
inductive _NatEq : _Nat → _Nat → Prop where
  | rfl (x : _Nat) : (_NatEq x x)
```

这个定义很简单，只有一种情况：等式两边是同一个自然数的时候`_NatEq x x`类型有元素，也就是`_NatEq x x`类型对应的命题为真。

接下来我们还需要定义`∃`类型。[这篇文章]({% link blog-zh/_posts/2025-10-21-logic-and-proof.md %})里说过，存在谓词对应着类型理论中的Σ类型，因此我们可以这样定义：

```plaintext
inductive _Exists (α : Sort u) (p : α → Prop) : Prop where
  | intro (x : α) (h : p x) : _Exists α p
```

其中`α`是我们要找的变量的定义域，`p`则是依赖于`α`类型的命题。比如我们要证明的命题：

$$\exist x:\N.\ x + 1 = 2$$

用我们自己定义的`_Exists`来写的话就是：

```plaintext
_Exists Nat (fun x : Nat => x + 1 = 2)
```

事实上，Lean语言里形如`∃ x : Nat, x + 1 = 2`这样的命题最终会被宏编译成`Exists (fun x : Nat => x + 1 = 2)`这样的形式，也就是和我们刚刚定义的这个函数几乎完全一致。

之后我们就可以开始尝试证明`one_plus_one_is_two`了。完整证明如下：

```plaintext
theorem one_plus_one_is_two
  : _Exists _Nat (fun x : _Nat => (_NatEq (_Nat.add x _one) _two))
  := _Exists.intro _one (_NatEq.rfl _two_)
```

现在这个类型表达式已经长到有点不太能读了。但我们的证明仍然很简单，即：用`_Exists.intro`去取$x=1$，并提供$1+1=2$的证明。由于2是1的后继，证明$1+1=2$这部分我们直接使用使用`_NatEq.rfl _two`即可。编译器会自动展开`_NatEq.add`函数的定义，在两边都得到整数2，从而判定两边的式子是等价的。

### Step 2：转写成$\lambda^C$系统

上面的所有定义仍然是用Lean语言书写的。为了完全剥离编程语言层面的细节，我们不妨用纯数学的$\lambda^C$系统来重新书写上面这段代码。

首先就是要重写`inductive`关键字定义的归纳类型。[这篇文章]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %})里简要提到过怎么在λ演算中构建归纳类型~~然后我现在才知道我总结出来的这套东西有名字，叫[摩根森-斯科特编码](https://en.wikipedia.org/wiki/Mogensen%E2%80%93Scott_encoding)~~。比如，自然数类型

```plaintext
inductive _Nat where
  | zero : _Nat
  | succ : _Nat → _Nat
```

会被重写成这样：

```lisp
_Nat := Πα:*. α→(α→α)→α
_Nat.zero := λα:*. λzero:α. λsucc:(α→α). zero
_Nat.succ := λx:_Nat. λα:*. λzero:α. λsucc:(α→α). (succ (x α zero succ))
```

这里我使用一些像`zero`、`succ`这样的多字符变量名。虽然也可以全部改成`z`、`s`这样的单字符名，但这样的话代码可读性会差很多。因此，我选择将λ演算中与前文Lean代码里对应的部分使用同一个变量名，以示二者之间的联系。

这里我们使用的符号和[上一篇文章]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %})中的符号略有不同。我们统一使用`Π`来标记一切依赖类型，不论依赖类型的参数是数值还是类型本身。`Πα:*`表示这个函数接受一个类型作为参数，也就是上篇文章中用的`∀α`符号。读者可以尝试使用$\lambda^C$的类型推断规则来尝试证明一下`_Nat.zero`的类型是`_Nat`，而`_Nat.succ`类型是`_Nat→_Nat`。

> 参考：类型推导规则
>
> $$\begin{array}{c} \Gamma\vdash m:(\Pi_{x:\sigma}.\ \tau)\qquad \Gamma\vdash n:\sigma \\ \hline \Gamma\vdash (m\ n): \tau[n/x] \end{array}$$
>
> $$\begin{array}{c} \Gamma, x:\sigma\vdash m:\tau \\ \hline \Gamma\vdash (\lambda x:\sigma.\ m): (\Pi_{x:\sigma}.\ \tau) \end{array}$$
>
> 其中$a[b/c]$表示在$a$表达式中用$b$符号去替换所有$c$符号。
>
> 以及一个类型简写规则：若$\tau$类型不依赖$\sigma$类型，（即：$\tau$的表达式中没有任何项的类型是$\sigma$），则：
>
> $$(\sigma\to\tau):=\Pi_{x:\sigma}\tau$$
>
> （其实如果按照标准$\lambda^C$语法来写的话，整个表达式里都不能出现箭头符号，我们需要把`α→(α→α)→α`这样的类型写成`Πσ:α. Πτ:(α→α). α`，但因为后一种写法需要引入太多无用变量了，为了方便起见就仍然把非依赖的函数类型用箭头来写）

而`_Nat.add`的转译就简单多了。只需要原封不动地把表达式抄过来：

```plaintext
def _Nat.add (a b : _Nat) : _Nat
  := match a with
    | _Nat.zero => b
    | _Nat.succ (c : _Nat) => _Nat.succ (_Nat.add c b)
```

然后逐字逐句翻译就行。`match`语句在摩根森-斯科特编码中就是直接将变量作为函数。也就是说原式里的`match`会被翻译成这样：

```lisp
_Nat.add := λa:_Nat. λb:_Nat.
            (a
                _Nat                                  ; 重新传入自然数类型
                b                                     ; 分支1：a = _zero
                (λc:_Nat. _Nat.succ (_Nat.add c b)))  ; 分支2：a = _succ c
```

如果你忘了怎么在λ演算里去掉函数递归，可以看之前的[这篇文章]({% link blog-zh/_posts/2022-09-02-y-combinator.md %})。总之就是可以通过某些神奇方法将右侧表达式的递归调用变成非递归调用。

类似地，我们可以写出`_NatEq`的表达式。`_NatEq`类型都不像`_Nat`那样是个单纯的类型，而是依赖于某些变量的类型函数。但转写成λ演算的过程也大差不差。先把之前的Lean代码粘贴一下：

```plaintext
inductive _NatEq : _Nat → _Nat → Prop where
  | rfl (x : _Nat) : (_NatEq x x)
```

由于`_NatEq`类型需要传入两个`_Nat`类型的参数，我们需要在它的类型中也加上两个`λ`项作为参数。接下来，我们还需要把后面用来占位的`α`也变成`_Nat→_Nat→*`类型的。完整表达式如下：

```lisp
_NatEq := λm:_Nat. λn:_Nat.
          Πα:(_Nat→_Nat→*). (Πx:_Nat. (α x x))→(α m n)
_NatEq.rfl = λx:_Nat. λα:(_Nat→_Nat→*). λrfl:(Πy:_Nat. (α y y)). (rfl x)
```

同样地，你可以尝试推导一下，`_NatEq.rfl x x`的类型应当是`(_NatEq x x)`。

`_Exists`的定义则更复杂，因为`_Exists`传进来的参数`α`本身也是一个类型（当然这也意味着我们不能再用`α`作为占位类型的名称了）。但用同样的步骤我们也可以将其化成类型表达式：

```lisp
_Exists := λα:*. λp:(α→*).
           Πβ:(Πγ:*. (γ→*)→*). (Πx:α. Πh:(p x). (β x h))→(β α p)

_Exists.intro := λα:*. λx:α. λh:(p x).
                 λβ:(Πγ:*. (γ→*)→*). λintro:(Πy:α. Πhy:(p y). (β y hy)). (intro x h)
```

可以尝试代入`α`为自然数、`x`为`1`、`h`为某个`x+1=2`的证明，从而说明：`_Exists.intro Nat x (x+1=2)`的类型是`(_Exists Nat (λx:Nat. x+1=2))`。

~~这一整段代码我都是手动检查类型的，感觉脑子已经不够用了~~

好的，那么接下来就是：把所有东西都放在一起！

```lisp
one_plus_one_is_two := _Exists.intro _Nat _one (_NatEq.rfl _two)
```

完全展开是这样的：

```lisp
one_plus_one_is_two :=
  λα:(Πβ:*. (β→*)→*).
  λintro:(
    Πx:(Πγ:*. γ→(γ→γ)→γ).
    Πh:(p x).
    (α x h)
  ).
  (
    intro
    (λγ:*. λz:γ. λs:(γ→γ). s z)
    (
      λβ:((Πγ:*. γ→(γ→γ)→γ)→(Πγ:*. γ→(γ→γ)→γ)→*).
      λrfl:(Πx:(Πδ:*. δ→(δ→δ)→δ). (β x x)).
      (rfl (λγ:*. λz:γ. λs:(γ→γ). s (s z)))
    )
  )
```

而`one_plus_one_is_two`的类型则是这样的：

```lisp
one_plus_one_is_two : (_Exists _Nat (λx:_Nat. (_NatEq (_Nat.add x _one) _two)))
```

如果完全展开成仅用`λ`和`Π`表示的形式是这样的：

```lisp
one_plus_one_is_two :
  Πα:(Πγ:*. (γ→*)→*).
  (
    Πx:(Πγ:*. (γ→*)→*).
    Πh:(
      Πβ:((Πγ:*. (γ→*)→*)→(Πγ:*. (γ→*)→*)→*).
      (Πy:(Πδ:*. δ→(δ→δ)→δ). (β y y))
        →(
          β
          (λγ:*. λz:γ. λs:(γ→γ). (s (x γ z s)))
          (λγ:*. λz:γ. λs:(γ→γ). s (s z))
        )
    ).
    (α x h)
  ) → (
      α
      (Πγ:*. (γ→*)→*)
      (
        λx:(Πγ:*. (γ→*)→*).
        (Πy:(Πδ:*. δ→(δ→δ)→δ). (β y y))
          →(
            β
            (λγ:*. λz:γ. λs:(γ→γ). (s (x γ z s)))
            (λγ:*. λz:γ. λs:(γ→γ). s (s z))
          )
      )
  )
```

看起来很恐怖，但实际上仔细观察的话会发现其中有很多重复部分，所以这段表达式的实际信息量没有写出来的这么大。而且显然，编程语言在做类型检查时不会把表达式这样完全展开，只有用到特定部分的时候才会展开内部。另外，函数式语言也不会把这些表达式完全按照最底层的λ演算的形式写出来，而是会把某些较小的数据类型优化成更容易让CPU计算的形式，比如用二进制编码整数——毕竟这里只是证明$1+1=2$，万一要证明$289+1378=1667$，编译器也不可能展开1667层函数嵌套吧。

λ演算最早被提出时，是作为一种计算能力等价于图灵机的计算系统，而高级函数式语言可以看作是在λ演算这个“机器码”上建立的“高级语言”。由于冯诺依曼架构在工程上更容易实现，现在的（几乎）所有计算设备都是基于冯诺依曼架构的“加强版”图灵机。如果我们有一台假想的机器能够把λ演算像机器码一样执行，那么几乎所有的数学证明都都可以用这台“λ演算机”来做检验。

## 构造性证明的边界

上期说过，有些定理从理论上来说就是不可能用构造性方法证明的。举个例子：

> 命题：对于任意图灵机$M$，$M$要么在有限步内停机，要么不会在有限步内停机。

这个命题在经典逻辑学中就是一句废话，因为经典逻辑学的排中律告诉我们“$M$在有限步内停机”和“$M$不在有限步内停机”这两个命题肯定有一个是真的。

但是别忘了，直觉主义逻辑里没有排中律，你必须要给出一个构造才算是能够证明这个命题。但我们也知道，图灵停机问题是不可计算的，无论如何也不可能构造一个表达式去对所有图灵机$M$来判断它是否会停机。换句话说，这个命题是**不可计算**的。

而有些定理则依赖于非构造性证明，无法在依赖类型系统里论证。比如著名的**选择公理**，其形式如下：

> 选择公理：对于任意非空集合的集合$X$，存在某个定义在$X$上的函数$f$将每个$X$中的集合映射到该集合中的某个元素。
>
> 用集合论的语言来写：
>
> $$\forall X.\ (\forall\alpha\in X.\ \alpha\ne\varnothing)\to\left(\exist f:X\to\bigcup_{\alpha\in X}\alpha.\ \forall\alpha\in X.\ f(\alpha)\in \alpha\right)$$
>
> 在Lean中可以写下该定理的一个等价形式：
>
> ```plaintext
> def axiom_of_choice {α β : Sort u} (p : α → β → Prop) : (∀ x : α, ∃ y : β, p x y) → (∃ f : (α → β), ∀ x : α, p x (f x))
> ```

根据[
Diaconescu's theorem](https://en.wikipedia.org/wiki/Diaconescu%27s_theorem)，选择公理能够推出排中律，因此在直觉主义逻辑的框架下一定不可能证明选择公理。

类似地，选择公理的某些推论也不能在直觉主义逻辑下证明。比如下面这个简单的推论：

> 定理：对于任意集合$\alpha$，若$\alpha$非空，则能够找到某个$\alpha$中的元素$x\in\alpha$。
>
> 证明：令$X=\{\alpha\}$。应用选择公理，则存在映射$f:\{\alpha\}\to\alpha$。取$x=f(\alpha)$，则由$f$定义可得$x\in\alpha$。原命题得证。
>
> 用Lean来写：
>
> ```plaintext
> def choose (α : Sort u) (p : α → Prop) (h : ∃ (x : α), p x) : α
> ```
>
> 可以参考Lean标准库中的[choose](https://github.com/leanprover/lean4/blob/a0e742be5ef1f31c99b1dd0d9b73a0b4cf6b86fc/src/Init/Classical.lean#L29)函数

再比如，这些定理的证明都依赖于选择公理，因此在纯粹的直觉主义逻辑里都是无法证明的：

1. 任何满射$f:M\to N$都存在逆映射。
2. 任何向量空间都有一组基向量。
3. （Vitali集）存在一个$\R$的不可测子集。

从上面的例子可以看出，直觉主义逻辑又有必须使用构造性证明、缺少排中律等等限制，在某些情况下可能不能证明某些经典逻辑下正确的结论。

## 形式化证明工具概述

从数学证明的过程提炼出几条简单的逻辑规则，并使用这些逻辑规则去代替自然语言来书写数学证明，这就是[数学形式主义](https://en.wikipedia.org/wiki/Formalism_(philosophy_of_mathematics))。形式主义在生活中可能是个贬义词，但在数学里代表着最严格的证明方式。通过选择恰当的公理体系，我们就可以将数学证明形式化为字符串的变换，从而使用计算机来处理。

某些证明工具可以全自动在符号空间中搜索某个定理的证明，而不像Lean一样只能用来验证某个证明的正确性。因此，前者被称为**自动定理证明器**，而后者被称为**证明辅助器**。通常来说，前者由于基于一阶逻辑以及等效的逻辑系统，不用处理过于复杂的命题，因此其状态空间小到可以用搜索算法来自动化搜索证明；而后者一般基于二阶或更高阶逻辑（比如Lean从理论上支持无穷阶逻辑，只是一般我们只用到二阶），因此状态空间复杂到几乎无法用程序来枚举，因此才需要人为引导来书写证明。自动定理证明通常用于证明一些逻辑较简单的计算机程序，确保程序在任何输入下都能输出符合预期的结果；而证明辅助器则更多用于证明逻辑较复杂的数学命题。

当然，根据哥德尔不完备性定理，任何形式化体系里都会有无法证明的定理，没有任何形式主义是万能的。当然，对于实践中会用到的数学定理，现有的定理证明工具已经够用了，因此也不用太担心不完备性的问题。

关于定理证明工具更多信息，可以咨询大模型（因为别的我也不太了解了lol）。
