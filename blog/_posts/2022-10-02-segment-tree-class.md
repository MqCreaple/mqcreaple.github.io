---
title: 封装一棵线段树
layout: blog
tags: ["algorithm"]
---

最近得了个“小感冒”，实在懒得去做题，然后就在其他人的博客里瞎逛。无意间发现了zxp大佬之前写过的[*封装一棵线段树*](https://zxp2019.github.io/blog/article/segment-tree-class/)，然后就想把这里的代码稍微改得更像C++标准库一点。

## 基本结构

首先肯定是不能用数组来写线段树了，而应当用一个更高级的工具：**指针**。

我们在线段树结点的struct里放这些东西：

```cpp
struct Node {
    int leftBound;  // inclusive
    int rightBound; // exclusive
    Node *leftChild;
    Node *rightChild;
    T sum;
    T lazy;
    Node(int leftBound, int rightBound)
        : leftBound(leftBound), rightBound(rightBound), leftChild(nullptr), rightChild(nullptr), sum(0), lazy(0) {}
};
```

*（为了对应大部分C++标准库的规则，这里的左边界是包含的，而右边界则不包含，相当于这个结点覆盖的是区间上`[left, right)`的部分）*

然后在每个线段树类里面记录一下线段树的根结点`root`即可：

```cpp
class QuickArray {
public:
private:
    struct Node {
        // Omitted
    };
    Node *root;
};
```

然后就是其他操作了：

## 线段树的操作

### 创建线段树

这里我直接把它放在了线段树类`QuickArray`的构造函数里。代码是这样的：

```cpp
class QuickArray {
public:
    QuickArray(int left, int right): root(buildTree(left, right)) {}
};
```

而这里的`buildTree`是一个私有的辅助函数，专门用来构造线段树：

```cpp
private:
    static Node *buildTree(int left, int right) {
        Node *cur = new Node(left, right);        // create a new node in memory
        if(right - left <= 1) {
            return cur;                           // current node is leaf, directly return from function
        }
        int mid = (left + right) / 2;
        cur->leftChild = buildTree(left, mid);    // build left tree
        cur->rightChild = buildTree(mid, right);  // build right tree
        return cur;
    }
```

### 更新区间

更新区间的操作就是线段树板子了，直接贴上去就好：

```cpp
public:
    void add(int left, int right, T value) {
        if(left < right) {
            // to prevent illegal update
            nodeAdd(root, left, right, value);
        }
    }
private:
    static void nodeAdd(Node *n, IndexT left, IndexT right, T value) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return;
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            n->lazy += value;
            pushDown(n);
            return;
        }
        nodeAdd(n->leftChild, left, right, value);
        nodeAdd(n->rightChild, left, right, value);
        n->sum = n->leftChild->sum + n->rightChild->sum;
    }
```

### 区间查询

还是板子。先写一个`pushDown`：

```cpp
private:
    static void pushDown(Node *n) {
        if(n->leftChild != nullptr && n->rightChild != nullptr) {
            n->leftChild->lazy += n->lazy;
            n->rightChild->lazy += n->lazy;
            n->sum += n->lazy * (n->rightBound - n->leftBound);
        } else {
            n->sum += n->lazy;
        }
        n->lazy = 0;
    }
```

然后就是区间查询的代码：

```cpp
public:
    T sum(int left, int right) const {
        if(left < right) {
            return nodeSum(root, left, right);
        }
        throw "Invalid query!";
    }
private:
    static T nodeSum(Node *n, IndexT left, IndexT right) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return T(0);
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            return n->sum;
        }
        return nodeSum(n->leftChild, left, right) + nodeSum(n->rightChild, left, right);
    }
```

### 其他

再加一些可能用得上的函数，比如查询区间的左端和右端：

```cpp
public:
    int leftBound() const {
        return root->leftBound;
    }
    int rightBound() const {
        return root->rightBound;
    }
```

完成！

## 第一版代码

```cpp
#pragma once

template<typename T>
class QuickArray {
public:
    typedef int IndexT;
    /**
     * @brief Construct a QuickArray from left and right bound
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     */
    QuickArray(IndexT left, IndexT right): root(buildTree(left, right)) {}

    /**
     * @brief Construct a new QuickArray from a given array
     * @param array array with initial elements
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     */
    QuickArray(T *array, IndexT left, IndexT right): root(buildTree(array, left, right)) {}

    /**
     * @brief Add a given number to every term in range [left, right)
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     * @param amount amount to add
     */
    void add(IndexT left, IndexT right, T value) {
        if(left < right) {
            nodeAdd(root, left, right, value);
        }
    }

    /**
     * @brief Find the sum of all terms in range [left, right)
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     * @return T sum
     */
    T sum(IndexT left, IndexT right) const {
        if(left < right) {
            return nodeSum(root, left, right);
        }
        throw "Invalid query!";
    }

    /**
     * @brief Get the array's left bound
     * @return IndexT left bound (inclusive)
     */
    IndexT leftBound() const {
        return root->leftBound;
    }

    /**
     * @brief Get the array's right bound
     * @return IndexT right bound (exclusive)
     */
    IndexT rightBound() const {
        return root->rightBound;
    }

    ~QuickArray() {
        removeNodes(root);
    }
private:
    struct Node {
        IndexT leftBound;  // inclusive
        IndexT rightBound; // exclusive
        Node *leftChild;
        Node *rightChild;
        T sum;
        T lazy;
        Node(int leftBound, int rightBound)
            : leftBound(leftBound), rightBound(rightBound), leftChild(nullptr), rightChild(nullptr), sum(0), lazy(0) {}
    };
    Node *root;

    static Node *buildTree(IndexT left, IndexT right) {
        Node *cur = new Node(left, right);        // create a new node in memory
        if(right - left <= 1) {
            return cur;                           // current node is leaf, directly return from function
        }
        IndexT mid = (left + right) / 2;
        cur->leftChild = buildTree(left, mid);    // build left tree
        cur->rightChild = buildTree(mid, right);  // build right tree
        return cur;
    }

    static Node *buildTree(T *array, IndexT left, IndexT right) {
        Node *cur = new Node(left, right);
        if(right - left <= 1) {
            cur->sum = array[left];
            return cur;
        }
        IndexT mid = (left + right) / 2;
        cur->leftChild = buildTree(array, left, mid);
        cur->rightChild = buildTree(array, mid, right);
        cur->sum = cur->leftChild->sum + cur->rightChild->sum;
        return cur;
    }

    static void pushDown(Node *n) {
        if(n->leftChild != nullptr && n->rightChild != nullptr) {
            n->leftChild->lazy += n->lazy;
            n->rightChild->lazy += n->lazy;
            n->sum += n->lazy * (n->rightBound - n->leftBound);
        } else {
            n->sum += n->lazy;
        }
        n->lazy = 0;
    }

    static void nodeAdd(Node *n, IndexT left, IndexT right, T value) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return;
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            n->lazy += value;
            pushDown(n);
            return;
        }
        nodeAdd(n->leftChild, left, right, value);
        nodeAdd(n->rightChild, left, right, value);
        n->sum = n->leftChild->sum + n->rightChild->sum;
    }

    static T nodeSum(Node *n, IndexT left, IndexT right) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return T(0);
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            return n->sum;
        }
        return nodeSum(n->leftChild, left, right) + nodeSum(n->rightChild, left, right);
    }

    static void removeNodes(Node *n) {
        if(n == nullptr) {
            return;
        }
        removeNodes(n->leftChild);
        removeNodes(n->rightChild);
        delete n;
    }
};
```

## 改进

我们用C++新特性：智能指针，来代替上文中的`Node*`。这增加了程序的安全性。

由于我们不需要复制结点指针，所有指针一律改成`unique_ptr`即可：

> `unique_ptr`是一个类，用来模拟一个指针。
>
> 如果`unique_ptr`指向一个堆中的对象，那么当它的作用域结束之后，`unique_ptr`的析构函数会自动释放该对象的内存，不用手动`delete`。
>
> `unique_ptr`不允许复制，这样保证了不会有两个指针指向同一块内存而导致将该内存释放多次。

以下为改成`unique_ptr`的代码：

```cpp
#pragma once

#include <memory>
using std::unique_ptr;

template<typename T>
class QuickArray {
public:
    typedef int IndexT;
    /**
     * @brief Construct a QuickArray from left and right bound
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     */
    QuickArray(IndexT left, IndexT right) {
        buildTree(root, left, right);
    }

    /**
     * @brief Construct a new QuickArray from a given array
     * @param array array with initial elements
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     */
    QuickArray(T *array, IndexT left, IndexT right) {
        buildTree(root, array, left, right);
    }

    /**
     * @brief Add a given number to every term in range [left, right)
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     * @param amount amount to add
     */
    void add(IndexT left, IndexT right, T value) {
        if(left < right) {
            nodeAdd(root, left, right, value);
        }
    }

    /**
     * @brief Find the sum of all terms in range [left, right)
     * @param left left bound (inclusive)
     * @param right right bound (exclusive)
     * @return T sum
     */
    T sum(IndexT left, IndexT right) const {
        if(left < right) {
            return nodeSum(root, left, right);
        }
        throw "Invalid query!";
    }

    /**
     * @brief Get the array's left bound
     * @return IndexT left bound (inclusive)
     */
    IndexT leftBound() const {
        return root->leftBound;
    }

    /**
     * @brief Get the array's right bound
     * @return IndexT right bound (exclusive)
     */
    IndexT rightBound() const {
        return root->rightBound;
    }
private:
    struct Node {
        IndexT leftBound;  // inclusive
        IndexT rightBound; // exclusive
        unique_ptr<Node> leftChild;
        unique_ptr<Node> rightChild;
        T sum;
        T lazy;
        Node(int leftBound, int rightBound)
            : leftBound(leftBound), rightBound(rightBound), leftChild(), rightChild(), sum(0), lazy(0) {}
    };
    unique_ptr<Node> root;

    static void buildTree(unique_ptr<Node> &cur, IndexT left, IndexT right) {
        cur = std::make_unique<Node>(left, right);  // equivalent to `cur = new Node(left, right)` in C pointer
        if(right - left <= 1) {
            return;
        }
        IndexT mid = (left + right) / 2;
        buildTree(cur->leftChild, left, mid);
        buildTree(cur->rightChild, mid, right);
    }

    static void buildTree(unique_ptr<Node> &cur, T *array, IndexT left, IndexT right) {
        cur = std::make_unique<Node>(left, right);
        if(right - left <= 1) {
            cur->sum = array[left];
            return;
        }
        IndexT mid = (left + right) / 2;
        buildTree(cur->leftChild, array, left, mid);
        buildTree(cur->rightChild, array, mid, right);
        cur->sum = cur->leftChild->sum + cur->rightChild->sum;
    }

    static void pushDown(const unique_ptr<Node> &n) {
        if(n->leftChild != nullptr && n->rightChild != nullptr) {
            n->leftChild->lazy += n->lazy;
            n->rightChild->lazy += n->lazy;
            n->sum += n->lazy * (n->rightBound - n->leftBound);
        } else {
            n->sum += n->lazy;
        }
        n->lazy = 0;
    }

    static void nodeAdd(const unique_ptr<Node> &n, IndexT left, IndexT right, T value) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return;
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            n->lazy += value;
            pushDown(n);
            return;
        }
        nodeAdd(n->leftChild, left, right, value);
        nodeAdd(n->rightChild, left, right, value);
        n->sum = n->leftChild->sum + n->rightChild->sum;
    }

    static T nodeSum(const unique_ptr<Node> &n, IndexT left, IndexT right) {
        pushDown(n);
        if(n->leftBound >= right || n->rightBound <= left) {
            return T(0);
        }
        if(n->leftBound >= left && n->rightBound <= right) {
            return n->sum;
        }
        return nodeSum(n->leftChild, left, right) + nodeSum(n->rightChild, left, right);
    }
};
```
