---
title: Lean简介：基础程序证明
layout: blog
tags: ["lean", "computation", "mathematics"]
---

本文主要面向没有接触过Lean的初学者，将Lean的各个功能以一种更容易理解的顺序呈现给读者。建议读者具有以下前置知识后再阅读：

1. 函数式语言（了解基础概念即可）
2. 基础群论知识

本文全文内容均来自[The Lean Language Reference](https://lean-lang.org/doc/reference/latest/)，有能力者也可以尝试阅读原文。

## 函数式编程简介

关于**函数式编程（Functional Programming）**，现在的互联网上已经有许多资料了，这里就不再展开细节了。大体来说，函数式编程和我们熟悉的命令式编程/面向对象式编程的主要区别是：在函数式语言中，**函数（Function）**，或者说**纯函数（Pure Function）**，是最基本的对象。

- 纯函数是指返回值永远确定、无副作用、且对于同样的输入永远返回同样输出的函数。比如下面这个Python语言写的函数就是一个纯函数：

  ```py
  def add(a, b):
      return a + b
  ```

  而这个函数就不是纯函数

  ```py
  from random import random
  c = 1
  def add(a, b):
      global c
      c += 1                       # 有副作用（改变了函数外的变量c）
      return a + b + c + random()  # 非确定性（使用了随机数）
  ```

- 函数调用通常使用λ演算的记号，即：`(f x)`表示将参数`x`传入函数`f`，而不像大部分编程语言中使用记号`f(x)`。
- 常数和变量被定义为无参数的函数。由于纯函数的要求，变量被赋值之后无法更改，只能被覆盖。如果你了解C语言，可以理解成函数式语言里所有变量都是C里的`const`修饰符修饰的。
- 函数可以作为参数传入其他的函数。即：可以定义“函数的函数”、“函数的函数的函数”，以此类推。
- 函数可以**柯里化（Currying）**，即当某个函数的参数不完整时，它会被认为是接收剩余参数的函数。

  举个例子：如果 $f:\R\times\R\to\R$ 是一个接收两个实数的二元函数，那么 $(f\ 1)$ 是一个一元函数，接收一个实数$x$，返回 $(f\ 1\ x)$ 的值。

  举个更具体的例子，加法操作（$+$）可以看作是一个二元函数。那么对加法使用柯里化，$(+\ 1)$ 就表示一个一元函数 $f(x) = 1+x$。

关于λ演算的更多内容，可以看[这篇文章]({% link blog-zh/_posts/2022-08-27-lambda.md %})。那么说完基础知识，我们再来讲Lean语言的特性。

## 函数：`def`、`theorem`、`abbrev`和`fun`

首先就是怎么在Lean里定义函数。Lean提供了三种定义函数的关键字，分别是`def`、`theorem`和`abbrev`，用以区分不同的函数类型。

首先就是`def`：`def`用于定义一般的函数，通常是数值到数值的函数。比如这个：

```lean
def f (x : Nat) : Nat := x + 1
```

这里括号里的`x`就是传入的参数，`x`后面跟着`: Nat`则是标记了`x`的类型为自然数（Natural Number）。括号外的`: Nat`则是函数本身的返回值，表示这个函数返回一个自然数。后面的`:=`标记了函数体的开始，再后面的`x + 1`就是函数本身的返回值。

我们可以使用`#eval`指令来计算表达式的值，或者用`#check`指令来检查表达式的类型。这两条指令都是编译器内部为了方便调试做的宏，本身不是用纯函数做出来的。

```lean
#eval (f 2)    -- 3
#check (f 2)   -- f 2 : Nat
```

函数可以传入多个参数。比如这样：

```lean
def f (x : Nat) (y : Nat) : Nat := x * (y + 1)
```

注意这里每个参数都要用括号括起来。当传入的多个参数类型相同时，也可以这样简写：

```lean
def f (x y : Nat) : Nat := x * (y + 1)
```

类型也可以作为普通参数传进来。并且由于Lean完全兼容依赖类型（如果你忘了依赖类型是什么可以看[这里]({% link blog-zh/_posts/2025-10-21-logic-and-proof.md %})），我们可以写出这样的函数：

```lean
def rep (α : Type) (f : α → α) (g : α) : α := f (f g)
```

其中`α`是一个类型参数，`f`是一个从`α`到`α`的函数，而`g`是一个`α`类型的常数。这个函数将`f`重复应用在`g`上两遍。如果想要调用这个函数，需要这样做：

```lean
def process (x : Nat) := if x % 2 = 0 then x / 2 else x + 1
def x := rep Nat process 137   -- 别忘了常数也是一种特殊的函数！
#eval x                        -- 返回值：69
```

注意到这里需要手动将参数类型`Nat`传进`rep`里。也可以使用花括号来省略参数，从而在函数调用时让编译器自动推断参数类型。这样可以实现更接近其他编程语言里的模板函数的效果：

```lean
def rep2 {α : Type} (f : α → α) (g : α) := f (f g)
def x := rep2 process 137      -- 编译器自动推断α为Nat
```

上述代码的右箭头符号`→`可以在VSCode里用`\to`或者`\r`再按空格打出来。或者也可以用ASCII字符组合`->`替代。

在Lean中也可以使用递归函数，即在函数中调用自身。但是Lean要求所有递归函数都必须证明其会在有限层内终止。这一点我们会在[证明和策略](#证明和策略by)章节中详细说明。

`def`的变体`abbrev`和`theorem`在语法上和`def`没有区别，只要把`def`关键字换成`abbrev`或者`theorem`即可。从习惯上来说，`abbrev`通常用于定义某个较长的名称的简写，而`theorem`通常用于定义某个定理。根据[上期]({% link blog-zh/_posts/2025-10-21-logic-and-proof.md %})提到过的丘奇-霍华德同构，定理和函数类型是一一对应的，这也是为什么我们能用定义函数的语法来定义定理。

编译器也会给这两种函数做不同的处理：

- 所有用`abbrev`定义的函数都必须是[强归约](https://lean-lang.org/doc/reference/latest/Definitions/Recursive-Definitions/#--tech-term-Reducible)的。即：对于`abbrev X := Y`，所有出现`X`的地方都会被替换成`Y`。
- 所有用`theorem`定义的函数会被识别为定理。`theorem`函数的返回值必须是命题类型（`Prop`）且不可省略。编译器默认情况下不会对`theorem`函数做归约（即在出现该函数的地方自动替换为函数体）。

`theorem`还有一个变体：`example`。用`example`定义定理的时候不用提供定理名。编译器仍然会检查定理的正确性，但在检验完毕之后就会立刻忘记这个定理，用于节省计算资源。`example`可以用来定义一些演示性的定理，或者用来展示某个程序的正确性。

```
-- 用加法交换律证明定理 a + 1 = 1 + a ，并将其称为add_one_is_one_add
theorem add_one_is_one_add (a : Nat) : a + 1 = 1 + a :=
  by apply Nat.add_comm

#check (add_one_is_one_add 3)  -- add_one_is_one_add 3 : 3 + 1 = 1 + 3

-- 应用该定理来证明 3 + 1 = 1 + 3
example : 3 + 1 = 1 + 3 := add_one_is_one_add 3
```

### 匿名函数`fun`

某些场合下我们可能想要传入一个函数，但不像再给这个函数一个全局变量名。这时候使用`fun`定义匿名函数就会很方便。比如这样：

```lean
def rep2 {α : Type} (f : α → α) (g : α) := f (f g)
def x := rep2 (fun x ↦ x * 2 + 1) 137
```

这里`fun x`后面这个箭头可以用`\map`打出来。或者也可以用ASCII字符组合`=>`替代。

### 命名空间`namespace`和章节`section`

如果函数的名字里包含`.`，那么编译器会认为`.`前面的部分是函数所在的命名空间（namespace）。当然，也可以用`namespace`和`end`关键字手动声明一块命名空间，比如下面这两个定义是等价的：

```lean
def MyNamespace.f (x : Nat) := x + 1

namespace MyNamespace

def f (x : Nat) := x + 1   -- 在这里编译器会提示该名称已经被定义

end MyNamespace
```

可以用`open`关键字来“打开”一个命名空间，这样调用命名空间里的函数就不用加前缀了。`open`有点类似于其它语言的`using`或者`use`关键字。

```lean
def MyNamespace.f (x : Nat) := x + 1

open MyNamespace

def y := f 3      -- y = 4
```

当你想要在一个文件的多个部分里打开不同的命名空间时，可以用`section`把这些不同的部分隔开：

```lean
def MyNamespace1.f (x : Nat) := x + 1
def MyNamespace2.f (x : Nat) := x - 1

section Section1
open MyNamespace1

def y := f 3      -- y = 4

end Section1

section Section2
open MyNamespace2

def z := f 3      -- z = 2

end Section2

#eval y
#eval z
```

注意`section`本身不会创建新的命名空间。它只是起到一个分割代码的作用。比如上面的变量`y`和`z`就是直接定义在`_root_`命名空间下的。而同一段代码如果将`section`改成`namespace`：

```lean
def MyNamespace1.f (x : Nat) := x + 1
def MyNamespace2.f (x : Nat) := x - 1

namespace MyNamespace1

def y := f 3      -- y = 4

end MyNamespace1

namespace MyNamespace2

def z := f 3      -- z = 2

end MyNamespace2

#eval MyNamespace1.y
#eval MyNamespace2.z
```

那么此时`y`就是定义在`MyNamespace1`里的，而`z`是定义在`MyNamespace2`里的。如果想要在全局命名空间里使用`y`和`z`的值，就需要用`MyNamespace1.y`和`MyNamespace2.z`。

## 类型：`structure`、`inductive`、`class`

Lean包含一些内置的数据类型，比如自然数`Nat`、布尔类型`Bool`、有限自然数类型`Fin`、以及`Int32`、`Int64`等类型。而“类型”本身也是一个类型，在Lean中记作`Type`。你可以将一个类型赋给一个变量，像这样：

```lean
abbrev α : Type := Nat
def x : α := 1
```

此处`α`就是一个类型为`Type`的变量，因此它也可以被作为类型使用。从上面的表达式里也可以看出`abbrev`和`def`的区别。如果将此处的`abbrev α`换成`def α`，那么编译器不会知道`α`就是`Nat`，而是会要求你使用`cast`函数将`1`的类型转换为`α`并提供`Nat = α`的证明。

同样的，`Type`本身也有一个类型，在Lean中记作`Type 1`，而`Type 1`的类型为`Type 2`，以此类推。

```lean
#check Type     -- Type : Type 1
#check Type 1   -- Type 1 : Type 2
#check Type 2   -- Type 2 : Type 3
#check Type 3   -- Type 3 : Type 4
```

当然实际编码中一般用不到这么高阶的类型，顶多用到`Type 1`或者`Type 2`。之所以需要引入任意大阶数的类型主要是为了避免制造出无限递归。这点之后再详细说。

Lean还有一个特殊的类型：`Prop`。`Prop`用来表示所有命题的类型，而`Prop`本身的类型是`Type`。如下所示：

```lean
#check 2 = 3                  -- Prop
#check ∀ x : Nat, x + 1 > 0   -- Prop
#check True                   -- Prop （注意这里首字母大写的True是命题而不是布尔值）
#check Prop                   -- Type
```

而[上篇文章]({% link blog-zh/_posts/2025-10-21-logic-and-proof.md %})说过，命题本身就是类型，也可以作为函数返回值。不仅如此，所有`theorem`标记的定理的返回值必须是`Prop`类型的。

### 类型函数

不仅`Nat`、`Bool`这些数值类型可以作为函数返回值，`Type`本身也可以作为函数返回值，比如这样：

```lean
def DependentType (x : Nat) : Type :=
  if x = 1 then Nat else String
```

这样定义的话，这个函数也可以作为类型来标记其他变量：

```lean
def f (x : Nat) : DependentType x := sorry
```

Lean为我们定义好了很多常用的类型函数，比如用于表示函数类型的`→`就可以看作是输入两个类型、输出一个类型的函数（当然这个符号的定义是编译器内置的，否则你连函数都写不出来）。

### 组合类型：`structure`

正如大多数语言里对`struct`和`class`的定义一样，Lean里的`structure`可以用来表示多个类型的组合。例如这样：

```lean
structure A where
  num : Nat
  str : String
  func : Nat → Nat

def a : A := A.mk 1 "hello" (fun x ↦ x + 1)
```

所有`structure`会自带一个构造函数`mk`，只需要调用该构造函数就可以创建一个属于该结构体类型的对象。如果你不想用`mk`这个名字，也可以在定义前加一个构造函数名，后面跟两个冒号（`::`），像这样：

```lean
structure A where
  myFancyConstructor::
  num : Nat
  str : String
  func : Nat → Nat

def a : A := A.myFancyConstructor 1 "hello" (fun x ↦ x + 1)
```

`structure`也可以有成员函数。如果一个函数的命名空间和这个结构体的名称相同，比如函数叫`A.func`，并且如果`A.func`的第一个参数是该结构体类型的，那么这个函数就被认为是该结构体的成员函数。比如这样：

```lean
structure A where
  num : Nat
  str : String
  func : Nat → Nat

def A.apply_func_to_num {a : A} : Nat := a.func a.num

def a : A := A.mk 1 "hello" (fun x ↦ x + 1)
def b : Nat := a.apply_func_to_num
#eval b        -- 2
```

当然，如果要一次定义很多函数，建议将这些函数放在`namespace`代码块里：

```lean
structure A where
  num : Nat
  str : String
  func : Nat → Nat

namespace A
variable a : A

def apply_func_to_num : Nat := a.func a.num
-- 然后可以在这里面定义更多的成员函数

end A
```

`variable`命令可以定义一个虚拟的局部变量，让每个使用该变量的函数自动把它加入该函数的参数列表里。因此此处的`func1`虽然看起来好像没有写参数，但实际上是有参数的。可以用`#check`检查其类型：

```lean
#check A.apply_func_to_num  -- A.apply_func_to_num (a : A) : Nat
```

`structure`也可以继承，像这样：

```lean
structure A where
  num : Nat
  str : String
  func : Nat → Nat

structure B extends A where
  bool : Bool

def c : B := B.mk (A.mk 2 "world" (fun x ↦ x * 2 + 1)) true
```

此时`B`的构造函数里就会包含一个`A`的对象和`B`的其他成员。`B.toA`函数可以用来提取`B`中的`A`成分。

## 递归类型：`inductive`

递归类型有点像Haskell里的`data`和Rust里的`enum`（或者准确来说Rust的`enum`最早就是从函数式语言里抄过来的），它允许该类型的成员选择几种不同可能性中的一种。像这样：

```lean
inductive Ind where
  | aa : Ind
  | bb : Nat → Ind
  | cc : String → Nat → Ind

def a : Ind := Ind.aa
def b : Ind := Ind.bb 1
def c : Ind := Ind.cc "hello" 2
```

如果在每个分支下面不写清楚返回类型，则默认是返回递归类型本身，比如：

```lean
inductive Ternary where
  | Yes
  | No
  | Idk
```

等价于：

```lean
inductive Ternary where
  | Yes : Ternary
  | No  : Ternary
  | Idk : Ternary
```

由于`inductive`保证了它一定只有有限种分支，因此我们可以用`match`语句做模式匹配：

```lean
inductive Ind where
  | aa : Ind
  | bb : Nat → Ind
  | cc : String → Nat → Ind

def f (a : Ind) : Nat := match a with
  | Ind.aa => 1
  | Ind.bb (x : Nat) => x
  | Ind.cc (s : String) (x : Nat) => x + 1
```

### 标准库中的类型定义

有了这些基础知识，我们就可以看一下Lean的标准库里是怎么实现各种不同类型的了。

首先是命题运算：

```lean
/--
`And a b`, or `a ∧ b`, is the conjunction of propositions. It can be
constructed and destructed like a pair: if `ha : a` and `hb : b` then
`⟨ha, hb⟩ : a ∧ b`, and if `h : a ∧ b` then `h.left : a` and `h.right : b`.
-/
@[pp_using_anonymous_constructor]
structure And (a b : Prop) : Prop where
  /-- `And.intro : a → b → a ∧ b` is the constructor for the And operation. -/
  intro ::
  /-- Extract the left conjunct from a conjunction. `h : a ∧ b` then
  `h.left`, also notated as `h.1`, is a proof of `a`. -/
  left : a
  /-- Extract the right conjunct from a conjunction. `h : a ∧ b` then
  `h.right`, also notated as `h.2`, is a proof of `b`. -/
  right : b

/--
`Or a b`, or `a ∨ b`, is the disjunction of propositions. There are two
constructors for `Or`, called `Or.inl : a → a ∨ b` and `Or.inr : b → a ∨ b`,
and you can use `match` or `cases` to destruct an `Or` assumption into the
two cases.
-/
inductive Or (a b : Prop) : Prop where
  /-- `Or.inl` is "left injection" into an `Or`. If `h : a` then `Or.inl h : a ∨ b`. -/
  | inl (h : a) : Or a b
  /-- `Or.inr` is "right injection" into an `Or`. If `h : b` then `Or.inr h : a ∨ b`. -/
  | inr (h : b) : Or a b
```

可以看到，`And`的定义就是一个简单的二元`structure`，由左右两个命题组成。因此，如果想要构造命题`And p q`（即`p ∧ q`）的证明，必须同时提供左右两侧的证明。而`Or`是一个包含两个分支的`inductive`类型，因此如果想要构造`Or p q`（即`p ∨ q`）的证明，只需要提供左右二者之一的证明即可。

接下来可以看一下常用数值类型的构造：

```lean
/--
The Boolean values, `true` and `false`.

Logically speaking, this is equivalent to `Prop` (the type of propositions). The distinction is
public important for programming: both propositions and their proofs are erased in the code generator,
while `Bool` corresponds to the Boolean type in most programming languages and carries precisely one
bit of run-time information.
-/
inductive Bool : Type where
  /-- The Boolean value `false`, not to be confused with the proposition `False`. -/
  | false : Bool
  /-- The Boolean value `true`, not to be confused with the proposition `True`. -/
  | true : Bool

/--
The natural numbers, starting at zero.

This type is special-cased by both the kernel and the compiler, and overridden with an efficient
implementation. Both use a fast arbitrary-precision arithmetic library (usually
[GMP](https://gmplib.org/)); at runtime, `Nat` values that are sufficiently small are unboxed.
-/
inductive Nat where
  /--
  Zero, the smallest natural number.

  Using `Nat.zero` explicitly should usually be avoided in favor of the literal `0`, which is the
  [simp normal form](lean-manual://section/simp-normal-forms).
  -/
  | zero : Nat
  /--
  The successor of a natural number `n`.

  Using `Nat.succ n` should usually be avoided in favor of `n + 1`, which is the [simp normal
  form](lean-manual://section/simp-normal-forms).
  -/
  | succ (n : Nat) : Nat
```

`Bool`和`Nat`两个类型都是通过`inductive`定义出来的。`Bool`很简单，要么真要么假，因此在`inductive`的两个分支里放上`false`和`true`即可。自然数`Nat`的定义略微复杂一些：自然数有可能是0，也有可能是某个其他自然数的后继，因此两个分支分别是`zero`和`succ (n)`。关于为什么要这样定义，也可以看[这篇文章]({% link blog-zh/_posts/2025-09-03-typed-lambda.md %})。

Lean还定义了一些类型函数，比如`Option`、`List`等。这些类型本身接收另一个类型`α`作为函数，返回一个类型。

```lean
/--
Optional values, which are either `some` around a value from the underlying type or `none`.

`Option` can represent nullable types or computations that might fail. In the codomain of a function
type, it can also represent partiality.
-/
inductive Option (α : Type u) where
  /-- No value. -/
  | none : Option α
  /-- Some value of type `α`. -/
  | some (val : α) : Option α

/--
Linked lists: ordered lists, in which each element has a reference to the next element.

Most operations on linked lists take time proportional to the length of the list, because each
element must be traversed to find the next element.

`List α` is isomorphic to `Array α`, but they are useful for different things:
* `List α` is easier for reasoning, and `Array α` is modeled as a wrapper around `List α`.
* `List α` works well as a persistent data structure, when many copies of the tail are shared. When
  the value is not shared, `Array α` will have better performance because it can do destructive
  updates.
-/
inductive List (α : Type u) where
  /-- The empty list, usually written `[]`. -/
  | nil : List α
  /--
  The list whose first element is `head`, where `tail` is the rest of the list.
  Usually written `head :: tail`.
  -/
  | cons (head : α) (tail : List α) : List α
```

有了之前的基础，这些代码应该都比较易懂了。只是需要注意`Option`、`List`本身不是类型，需要在后面传入一个其他类型才能将其变成一个类型。

### Type Class（`class`）

最后一个需要介绍的类型是`class`。`class`与`structure`很像，都由一系列成员构成，都有构造函数，都可以继承别的`class`或者`structure`。只有在一种情况下两者会有不同：

```lean
structure Commutative (α : Type) extends Add α where
  add_comm (a b : α) : add a b = add b a

namespace Commutative

theorem comm_three {α : Type} {instComm : Commutative α} (a b c : α)
  : instComm.add (instComm.add a b) c = instComm.add c (instComm.add b a) :=
    Eq.trans (instComm.add_comm (instComm.add a b) c) (congrArg (fun x : α ↦ instComm.add c x) (instComm.add_comm a b))

end Commutative
```

`Commutative`是一个类型函数，为类型`α`绑定了交换律，即`add a b = add b a`，而我们想要证明`(add (add a b) c) = (add c (add b a))`。可以看到，为了书写这个证明，我们不得不创建一个`instComm`对象，并在所有需要加法的地方使用`instComm.add`，导正整个证明写出来十分啰嗦。而如果将`structure`换成`class`，同样的证明就可以非常简单：

```lean
class Commutative (α : Type) extends Add α where
  add_comm (a b : α) : a + b = b + a

namespace Commutative

theorem comm_three {α : Type} [Commutative α] (a b c : α) : (a + b) + c = c + (b + a)
  := Eq.trans (add_comm (a + b) c) (congrArg (fun x ↦ c + x) (add_comm a b))

end Commutative
```

这个证明就更接近数学语言，可读性也更高。方括号里的参数`[Commutative α]`表示`α`本身实现了`Commutative`类型所需的函数，其效果就等价于创建了一个`instComm`对象，但我们不用显式地调用它。`class`极大地方便了数学结构的定义。如果你没看懂这一段也没关系，我们可以继续下一步：实战演练。

## 练习：群论基础

我们不妨看一个实际的例子：实现一个群的性质和运算。

首先，我们希望将`Group`定义为一个Type Class。这样方便让别的类型去实现群的性质。

```lean
class Group (α : Type)
-- TODO
```

接下来，我们来考虑群的四条基本性质：

1. 封闭性：若$a, b\in G$，则$a*b\in G$
2. 结合律：$(a*b)*c=a*(b*c)$
3. 单位元的性质：$a*1=1*a=a$
4. 逆元的性质：$a*a^{-1}=a^{-1}*a=1$

不难看出，如果一个类型想要实现群的性质，它必须先有乘法、单位元和求逆这几个运算的定义。这些运算我们都可以继承标准库里定义好的类型：`Mul`、`One`和`Inv`。

```lean
class Group (α : Type) extends Mul α, One α, Inv α
-- TODO
```

再之后我们可以把Group的每条性质都放进去：

```lean
class Group (α : Type) extends Mul α, One α, Inv α where
  assoc (a b c : α) : (a * b) * c = a * (b * c)
  mul_one (a : α) : a * 1 = a
  one_mul (a : α) : 1 * a = a
  mul_inv (a : α) : a * a⁻¹ = 1
  inv_mul (a : α) : a⁻¹ * a = 1
```

由于编译器重载了`*`、`1`和`⁻¹`这些运算的定义，`a * b`其实就是`Mul α`里定义的`mul a b`函数，`1`和`⁻¹`的定义也同理。

上面的定义用人话说就是：只有当某个类型`α`能够同时提供这五条性质的证明时，它才配拥有`Group α`这个称呼。不妨看一个具体的例子：

### 旋转群Z₃

不妨以旋转群Z₃为例。这个群只包含3个元素：不旋转、往左旋转120°、往右旋转120°。我们可以这样表示：

```lean
inductive Z₃ where
  | Id
  | Left
  | Right
```

（数字下标“₃”可以用`\3`或者`\_3`打出来）

接下来，我们可以为其定义单位元、乘法运算、以及逆运算：

```lean
namespace Z₃

instance instOne : One Z₃ where
  one := id

instance instInv : Inv Z₃ where
  inv (a : Z₃) := match a with
    | id => id
    | left => right
    | right => left

instance instMul : Mul Z₃ where
  mul (a b : Z₃) := match a with
    | id => b
    | left => match b with
      | id => left
      | left => right
      | right => id
    | right => match b with
      | id => right
      | left => id
      | right => left

end Z₃
```

由于只有三个元素，我们可以直接暴力枚举出所有情况。

`instance`和`class`一般配对使用，其用于声明某类型在某`class`下的实例。比如在写完这样一段代码之后，如果某个函数的参数列表是这样的：

```lean
def f {α : Type} [Mul α]  --  ... 后续省略
```

那么`Z₃`类型的元素就可以直接代入`f`里，而`[Mul α]`就会被替换成此处实现的`instMul`实例。

接下来我们可以尝试给`Z₃`实现群的性质：

```lean
-- 这段代码仍然定义在namespace Z₃里，此处省略
instance instGroup : Group Z₃ where
  mul_one (a : Z₃) := match a with
    | id => rfl
    | left => rfl
    | right => rfl
  one_mul (a : Z₃) := rfl
  mul_inv (a : Z₃) := match a with
    | id => rfl
    | left => rfl
    | right => rfl
  inv_mul (a : Z₃) := match a with
    | id => rfl
    | left => rfl
    | right => rfl
  assoc (a b c : Z₃) := sorry
```

此处我们先将结合律的证明留空~~读者自证不难~~。这样，我们就算是为`Z₃`实现了群的所有性质了。

### 无策略证明

我们现在开始尝试证明这个定理：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  sorry
```

一个很自然的想法是在等式两边同时乘以$a^{-1}$，这样的话我们就得到：

$$(a^{-1})^{-1}*a^{-1}=a * a^{-1}$$

再接下来，我们发现左侧就是$a^{-1}$右乘上自己的逆，而右边则是$a$左乘上自己的逆。因此，两边都等于$1$，结论得证。

但很可惜，Lean看不懂我们这段文字描述，你必须将这段文字转化成一段Lean函数，同时确保函数上的参数符合Lean类型检查规则。我们不妨先来看一下有哪些定理可以用：

```lean
-- 以下定理省略了部分参数

-- 等式自反
Eq.refl (a : α) : a = a

-- 等式对换
Eq.symm {a b : α} (h : a = b) : b = a

-- 等式传导
Eq.trans {a b c : α} (h₁ : a = b) (h₂ : b = c) : a = c

-- a = b 和 p a 能够推出 p b
Eq.subst {motive : α → Prop} {a b : α} (h₁ : a = b) (h₂ : motive a) : motive b
```

除了这几条之外，也就只剩我们刚刚定义的群论的几条性质能用了。似乎留给我们发挥的空间不多。看到这里大家不妨自己尝试一下，能不能只用给出的这几条性质去推出$(a^{-1})^{-1}=a$这个定理。

好吧，揭晓答案：我们需要构造一条非常长的等式传递链，最左端为$(a^{-1})^{-1}$，最右端为$a$，如下所示：

$$\begin{align*}& (a^{-1})^{-1} \\ = & (a^{-1})^{-1} * 1 \\ = & (a^{-1})^{-1} * (a^{-1} * a) \\ = & \left((a^{-1})^{-1} * a^{-1}\right) * a \\ = & 1 * a \\ = & a\end{align*}$$

这条等式链里面每一个等号都对应着上面的一条规则（你能尝试找到每一个等号分别是哪条规则吗？）。因此，我们可以用`Eq.trans`函数将每一个这样的等式全都连起来。

先从第一个开始：将`(a⁻¹)⁻¹ = a`拆成`(a⁻¹)⁻¹ = (a⁻¹)⁻¹ * 1`和`(a⁻¹)⁻¹ * 1 = a`。而`(a⁻¹)⁻¹ = (a⁻¹)⁻¹ * 1`可以用`mul_one (a⁻¹)⁻¹`来证明。当然注意，`(mul_one (a⁻¹)⁻¹)`返回的表达式是`(a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹`，因此还需要用`Eq.symm`来反过来：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  (Eq.trans (Eq.symm (mul_one (a⁻¹)⁻¹))
    sorry)
```

继续拆解。`(a⁻¹)⁻¹ * 1 = a`可以用`Eq.trans`拆成`(a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * (a⁻¹ * a)`和`(a⁻¹)⁻¹ * (a⁻¹ * a) = a`。左侧的证明由于涉及的函数比较多，我们不妨单独拿出来看：

```lean
theorem lemma1 (a : α) : (a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * (a⁻¹ * a) :=
  sorry
```

观察到，这个表达式可以看作是`1 = a⁻¹ * a`这个表达式左右两边同时乘上了`(a⁻¹)⁻¹`。也就是说，这个表达式可以看作是将恒等式`(a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * _`里右边的`_`从`1`换成了`a⁻¹ * a`。写成函数就是：

```lean
theorem lemma1 (a : α) : (a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * (a⁻¹ * a) :=
  (@Eq.subst
    _
    (fun x ↦ (a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * x)
    _ _
    (Eq.symm (inv_mul a))
    (Eq.refl _))
```

在函数名前面加`@`表示强制指定其省略的参数。`_`则表示省略该参数，让编译器自动补全。这里，我们想要制定代入的表达式`p`的类型为`(a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * x`，因此需要指定这部分的参数。但其余部分的参数就可以用自动补全了。

有了这个引理，我们就可以补全证明的下一个环节了：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  (Eq.trans (Eq.symm (mul_one (a⁻¹)⁻¹))
    (Eq.trans (lemma1 a)
      sorry))
```

如果你在VSCode上安装了Lean插件，可以将光标移到`sorry`之前，查看目标表达式：

```lean
α : Type
inst✝ : Group α
a : α
⊢ a⁻¹⁻¹ * (a⁻¹ * a) = a
```

可以看到，我们离目标已经近了很多了。

下一步将`a⁻¹⁻¹ * (a⁻¹ * a) = a`拆成`a⁻¹⁻¹ * (a⁻¹ * a) = (a⁻¹⁻¹ * a⁻¹) * a`和`(a⁻¹⁻¹ * a⁻¹) * a = a`。左侧可以用结合律证明，而右侧则是`a⁻¹⁻¹ * a⁻¹ = 1`在两侧同时乘`a`。先把左侧写出来：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  (Eq.trans (Eq.symm (mul_one (a⁻¹)⁻¹))
    (Eq.trans (lemma1 a)
      (Eq.trans (Eq.symm (assoc (a⁻¹)⁻¹ a⁻¹ a))
        sorry)))
```

我们可以再引入一个引理来证明`(a⁻¹⁻¹ * a⁻¹) * a = 1 * a`。同样使用`Eq.subst`：

```lean
theorem lemma2 (a : α) : a⁻¹⁻¹ * a⁻¹ * a = 1 * a :=
  (@Eq.subst
    _
    (fun x ↦ x * a = 1 * a)
    _ _
    (Eq.symm (inv_mul a⁻¹))
    (Eq.refl _))
```

接下来将`(a⁻¹⁻¹ * a⁻¹) * a = a`拆成`(a⁻¹⁻¹ * a⁻¹) * a = 1 * a`和`1 * a = a`。左侧是`lemma2`，右侧就是`one_mul`。因此可以这样写：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  (Eq.trans (Eq.symm (mul_one (a⁻¹)⁻¹))
    (Eq.trans (lemma1 a)
      (Eq.trans (Eq.symm (assoc (a⁻¹)⁻¹ a⁻¹ a))
        (Eq.trans (lemma2 a) (one_mul a)))))
```

Lean的检查结果表明该代码没有类型问题。自此，证明结束。完整证明如下：

```lean
theorem lemma1 (a : α) : (a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * (a⁻¹ * a) :=
  (@Eq.subst
    _
    (fun x ↦ (a⁻¹)⁻¹ * 1 = (a⁻¹)⁻¹ * x)
    _ _
    (Eq.symm (inv_mul a))
    (Eq.refl _))

theorem lemma2 (a : α) : a⁻¹⁻¹ * a⁻¹ * a = 1 * a :=
  (@Eq.subst
    _
    (fun x ↦ x * a = 1 * a)
    _ _
    (Eq.symm (inv_mul a⁻¹))
    (Eq.refl _))

theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a :=
  (Eq.trans (Eq.symm (mul_one (a⁻¹)⁻¹))
    (Eq.trans (lemma1 a)
      (Eq.trans (Eq.symm (assoc (a⁻¹)⁻¹ a⁻¹ a))
        (Eq.trans (lemma2 a) (one_mul a)))))
```

## 证明和策略：`by`

### `rw`策略：表达式替换

显然，这样的证明太繁琐、太烧脑了。我们也不想每次证明的时候都事无巨细地从头推导一遍。这样的效率太低了。因此，Lean引入了**证明策略**这一功能。它使用类似Monad的方法，让用户可以用类似指令式的方法来做公式推导。其格式大致如下：

```lean
theorem 定理名 定理参数 := by
  策略1
  策略2
  策略3
  ...
```

接下来我们就要介绍第一个策略：

> `rw [h : a = b]`：将当前表达式中所有的`a`全部替换成`b`。

举个例子，`Eq.symm (mul_one a⁻¹⁻¹)`的类型是：

```lean
Eq.symm (mul_one a⁻¹⁻¹) ： a⁻¹⁻¹ = a⁻¹⁻¹ * 1
```

那么如果我们执行`rw [Eq.symm (mul_one a⁻¹⁻¹)]`，就会把表达式变成这样：

```lean
a⁻¹⁻¹ = a
↓   rw [Eq.symm (mul_one a⁻¹⁻¹)]  -- Eq.symm (mul_one a⁻¹⁻¹) ： a⁻¹⁻¹ = a⁻¹⁻¹ * 1
a⁻¹⁻¹ * 1 = a
```

使用`rw`策略，同样的证明步骤就可以这样写：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a := by
  rw [Eq.symm (mul_one a⁻¹⁻¹)]
  rw [Eq.symm (inv_mul a)]
  rw [Eq.symm (assoc a⁻¹⁻¹ a⁻¹ a)]
  rw [inv_mul a⁻¹]
  rw [one_mul a]
```

这样的表达式就简洁易懂多了。可以理解成`rw`在内部帮你写好了一系列`Eq.subst`函数的调用，实现了表达式替换的效果。实际上所有的证明策略都可以用Lean的原生语法实现。

Lean还提供了一些语法糖，比如可以用`rw [← a=b]`来表示`rw [b=a]`。因此，上面的证明还可以更简化：

```lean
theorem inv_inv (a : α) : (a⁻¹)⁻¹ = a := by
  rw [← mul_one a⁻¹⁻¹, ← inv_mul a, ← assoc a⁻¹⁻¹ a⁻¹ a, inv_mul a⁻¹, one_mul a]
```

将五条`rw`策略写进一行，整个证明在两行内就能写完。

### `intro`策略：引入假设

有了`rw`这个强大的工具，我们不妨再看一些其他的定理。比如我们可以证明：若两元素$a, b$各自的逆相等，则$a=b$。

$$\forall a, b\in G,\ a^{-1}=b^{-1}\to a=b$$

用Lean来写就是：

```lean
theorem eq_of_inv_eq_inv {a b : α} : a⁻¹ = b⁻¹ → a = b := sorry
```

我们可以先看看代码提示是怎么说的：

```lean
α : Type
inst✝ : Group α
a b : α
⊢ a⁻¹ = b⁻¹ → a = b
```

也就是说，我们需要返回一个函数类型，输入一个`a⁻¹ = b⁻¹`的证明，输出一个`a=b`的证明。如果不使用Lean的证明策略，那么我们就需要在结果处写一个匿名函数：

```lean
theorem eq_of_inv_eq_inv {a b : α} : a⁻¹ = b⁻¹ → a = b
  := fun h : a⁻¹ = b⁻¹ ↦ sorry
```

同样的操作可以用`intro`策略实现。`intro h`就表示将目标函数的参数提取成一个可用的变量，其内部执行的操作其实就是创建了一个匿名函数。使用`intro`策略可以让我们的代码排版更清晰易懂。

> `intro h`：若目标表达式是一个函数，则将函数的参数提取成一个变量`h`。

```lean
theorem eq_of_inv_eq_inv {a b : α} : a⁻¹ = b⁻¹ → a = b := by
  intro h    -- 等价于 fun h : a⁻¹ = b⁻¹ ↦ ...
  sorry
```

此时再看代码提示，就是这个样子的：

```lean
α : Type
inst✝ : Group α
a b : α
h : a⁻¹ = b⁻¹
⊢ a = b
```

可以看到，我们的变量里多了一个`h : a⁻¹ = b⁻¹`，并且要证明的目标变成了`a = b`本身。

这个命题的具体证明过程我就不完整解释了。这里只给出最终证明的代码形式：

```lean
theorem eq_of_inv_eq_inv {a b : α} : a⁻¹ = b⁻¹ → a = b := by
  intro h
  rw [← inv_inv a, h, inv_inv b]
```

使用三次`rw`将表达式重写，即可最终转变为`b = b`恒等式。

### `have`策略：定义变量

接下来我们来迎接下一个挑战：证明群的单位元唯一。

这个命题其实有两部分构成：

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  sorry

theorem id_unique_right (a b : α) : a * b = a → b = 1 := by
  sorry
```

这里我们只证明`id_unique_left`，另一个命题的证明可以由以下证明对称得到。首先肯定要用`intro`策略来把函数参数变成一个我们可用的变量。但接下来怎么办呢？

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  intro h
  sorry
```

不难看到，我们可以在表达式`a * b = b`的两边同时乘上`b⁻¹`，这样就可以让左右两边的`b * b⁻¹`消掉，得到我们想要的表达式。我们可以用`have`策略来将这个表达式存储成一个中间变量：

> `have h : ⟪type⟫ := ⟪value⟫`：定义变量`h`，并将其赋值为对应的证明。

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  intro h
  have h1 : a * b * b⁻¹ = b * b⁻¹ := by rw [h]
  sorry
```

这里我们引入中间变量`h1 : a * b * b⁻¹`。其证明方法也很简单，直接用`h`对等式左侧转写，就可以得到恒等式`b * b⁻¹`。证毕。

接下来我们可以引入第二个中间变量：`h2 : a * (b * b⁻¹)`。别忘了乘号是从左往右结合的，如果不加这一步的话Lean是没法直接直接计算`(b * b⁻¹)`的。

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  intro h
  have h1 : a * b * b⁻¹ = b * b⁻¹ := by rw [h]
  have h2 : a * (b * b⁻¹) = b * b⁻¹ := by rw [← assoc a b b⁻¹, h1]
  sorry
```

接下来可以将`b * b⁻¹`变成`1`，再用`mul_one`定理将`a * 1`变成`a`。这样，这个定理就证明完毕了。

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  intro h
  have h1 : a * b * b⁻¹ = b * b⁻¹ := by rw [h]
  have h2 : a * (b * b⁻¹) = b * b⁻¹ := by rw [← assoc a b b⁻¹, h1]
  rw [← mul_one a, ← mul_inv b, h2]
```

当然，这个命题也可以只用`rw`来证明。只需要把证明从后往前写即可：

```lean
theorem id_unique_left (a b : α) : a * b = b → a = 1 := by
  intro h
  rw [← mul_one a, ← mul_inv b, ← assoc a b b⁻¹, h]
```

只不过这样写的话需要我们从一开始就从后往前倒退着推理。对于这样一个简单的命题可能还好，但一旦命题复杂起来，这样的推理过程会很不符合我们人类固有的从前往后推理的思维方式。而使用`have`引入一些中间步骤，将每个步骤从前往后逐个攻破，会让证明变得容易许多。

### 其他常用证明策略

Lean提供了非常多的证明策略。除了以上的三条之外，还有很多常用的证明策略没有详细展开说明。下面几个章节里我简要列举一些其他的常用策略，并给出它们对应的不用策略的表达式。以下列举出一些常用的证明策略，更多内容也可以看[Lean Language Reference](https://lean-lang.org/doc/reference/latest/Tactic-Proofs/#tactics)。

#### `exact`策略：提供答案

如果经过几步推导之后，你得到了一个和你的参数长得一模一样的表达式，那么这时你就可以直接用`exact`策略证明该命题。比如，如果你要证明的命题是`a = b`，而你的参数列表里有`h : a = b`。那么可以用`exact h`直接证明该命题：

```lean
example {α : Type} (a b : α) (h : a = b) : a = b := by
  exact h
```

而它对应的无策略证明也很简单，就是直接把`h`抄过来：

```lean
example {α : Type} (a b : α) (h : a = b) : a = b
  := h
```

当然，`exact`后面也可以传入表达式。比如这样：

```lean
example {α : Type} (a b : α) (h : a = b) : b = a := by
  exact Eq.symm h
```

#### `apply`策略：调用函数

`apply`和`intro`对应着λ演算的两大基本操作。之前说过了`intro`代表引入参数，对应着λ演算的*抽象化*；而`apply`则对应着*函数调用*。

如果我们要证明的目标命题是`q`，而现在已经有一个已知变量`h : p → q`，我们可以用`apply h`来将待证的命题变成`p`。如下所示：

```lean
example (p q : Prop) (hp : p) (h : p → q) : q := by
  apply h     -- 现在待证命题就从q变成了p
  exact hp
```

对应的无策略证明是这样的：

```lean
example (p q : Prop) (hp : p) (h : p → q) : q :=
  (h hp)
```

`apply`也可以用在参数上。`apply h at hp`可以将`hp`的类型从`p`转变为`q`。如下所示：

```lean
example (p q : Prop) (hp : p) (h : p → q) : q := by
  apply h at hp   -- hp就会从p变成q
  exact hp
```

如果`apply`的函数有多个参数，比如`h : p → q → r`，那么Lean就会生成两个子目标`p`和`q`。如下所示：

```lean
example (p q r : Prop) (h : p → q → r) (hp : p) (hq : q) : r
  := by
    apply h    -- 此处的目标r会被拆成两个目标：p和q
    · exact hp
    · exact hq
```

上面的两个`·`符号其实是可以省略的。但为了证明结构清晰，建议在每个子目标前面加上这个`·`。

#### `induction`策略：分情况讨论

如果你想对某个`inductive`类型的变量做分情况讨论，可以使用`induction`策略。比如，标准库里的`Or`其实是一个`inductive`类型，我们在拿到一个`Or`类型的命题时就可以用`induction`策略将其拆分成两种情况：

```lean
example (p q r : Prop) (h : p ∨ q) : (p → r) → (q → r) → r := by
  intro hp hq
  induction h with    -- 对h分情况讨论：h有可能时Or.inl也有可能是Or.inr
  | inl hp' => exact hp hp'
  | inr hq' => exact hq hq'
```

`induction`策略对应着无策略证明里的`match`语句。

```lean
example (p q r : Prop) (h : p ∨ q) : (p → r) → (q → r) → r :=
    fun hp hq ↦
      match h with
      | Or.inl hp' => hp hp'
      | Or.inr hq' => hq hq'
```

当我们对自然数做`induction`的时候，其实就相当于在做数学归纳法：

```lean
example (f : Nat → Nat) (h0 : f 0 = 1) (hs : ∀ n : Nat, f (n + 1) = (f n) * 2) : ∀ n : Nat, f n = 2 ^ n
  := by
  intro n
  induction n with
  | zero => rw [h0, Nat.pow_zero]
  | succ n' ih => rw [hs, ih, Nat.pow_succ]
```

对应到无策略证明就是：

```lean
theorem induction_tactic (f : Nat → Nat) (h0 : f 0 = 1) (hs : ∀ n : Nat, f (n + 1) = (f n) * 2) : ∀ n : Nat, f n = 2 ^ n
  := fun n ↦
    match n with
    | 0 => Eq.symm h0 ▸ Nat.pow_zero 1
    | Nat.succ n' => (fun ih : f n' = 2 ^ n' ↦
        hs n' ▸ ih ▸ (Eq.symm (Nat.pow_succ 2 n')))
      (induction_tactic f h0 hs n')
```

## 思考题

1. 原文中对`Group`的定义包含以下这几条性质：

    ```lean
    class Group (α : Type) extends Mul α, One α, Inv α where
      assoc (a b c : α) : (a * b) * c = a * (b * c)
      mul_one (a : α) : a * 1 = a
      one_mul (a : α) : 1 * a = a
      mul_inv (a : α) : a * a⁻¹ = 1
      inv_mul (a : α) : a⁻¹ * a = 1
    ```

    其中有一条性质是多余的。请移除该性质之后用其余几条性质将其证明。
2. （算法和数据结构）以下为Lean定义的一个二叉树类型

    ```lean
    inductive BinTree (α : Type) where
      | nil : BinTree α
      | node : α → BinTree α → BinTree α → BinTree α

    namespace BinTree
    variable {α : Type}

    def size (t : BinTree α) : Nat := match t with
      | nil => 0
      | node _ l r => (size l) + (size r) + 1

    def depth (t : BinTree α) : Nat := match t with
      | nil => 0
      | node _ l r => Nat.max (depth l) (depth r) + 1

    end BinTree
    ```

    请尝试说明该代码等价于二叉树的原因，并证明以下定理：

      - 二叉树的深度小于等于二叉树的子结点个数
      - 2的二叉树深度次方大于二叉树子结点个数

    请尝试写一个类型来表示平衡树，定义平衡树的左旋转和右旋转函数，并证明该操作仍然保持平衡树的平衡性质。
3. 抽象代数

    1. 请尝试实现一个类型来表示*同态映射*。对于群$(G, \ast)$和$(H, \diamond)$，函数$\phi: G\to H$在满足以下条件时被称为群$G$到$H$的同态映射：$$\forall u, v\in G,\ \phi(u\ast v)=\phi(u)\diamond\phi(v)$$
    同时请尝试证明以下定理：

        - 同态映射会将$G$的单位元$1_G$映射到$H$的单位元$1_H$。
        - 同态映射的复合仍然是同态映射
    2. 请在群同态映射的基础上定义群的*核*（所有$G$中被映射到$1_H$的元素构成的集合）。并尝试证明$\ker G$是群$G$的一个子群。

    3. 请尝试定义环（Ring）和域（Field）结构，使用继承关系让其兼容已经写完的群的定义。

4. 数论
    1. 请尝试阅读Lean标准库对于自然数`Nat`的定义。其中包含了许多和自然数的数论性质相关的证明。请选择一两个你感兴趣的证明并尝试理解证明过程。
    2. 请写一个`Nat → Prop`的命题函数来判断某个自然数是否为质数，并尝试证明以下定理：
        - 一个质数若不是2，则必定是奇数。
        - 质数$p$与任意小于$p$的数都互质。
        - $\Z/p\Z$和整数乘法构成一个群。

## 参考资料

<a id="cite-1"></a> [1] “Lean Langauge Reference.” *Lean FRO*, <https://lean-lang.org/doc/reference/latest/>. Accessed 3 Nov. 2025.
