---
title: Avoidable Mistakes in Software Engineering
layout: blog
tag: ["computer-science", "programming-language", "software-engineering"]
---

(Too lazy to think of a better title...)

I was working on my tank game code for my school's CS club recently and got annoyed by my codes. As I was still not in the mood of writing more codes, I want to write about the new things I understood in the past year about programming languages and software engineering.

## Software Engineering

The central task of **Software Engineering** is to convert an concrete problem into some form of code, which ideally should have these properties:

- Correctness: the code should solve the problem correctly
- Maintainability: when errors occurs, the changes needed for the code should be as little as possible
- Certain degree of extendability: when new demands are added, the code should change as little as possible to accomodate for the new demands

Of course, when you are collaborating with others, the code also need to have

- Clear divisions of labor: each specific function of the code should be done by exactly one person

These sound easy, but in practice, many unexpected errors might occur. Even converting the problem into codes have many notable points.

This article will discuss the potential issues of software engineering from the perspective of programming languages.

## Correspondance of Variables and Addresses

The first notable thing is: in most programming languages, **variables, the values of variables, and the addresses of variables are not one-to-one corresponding**.

For example, the following C code:

```c
char a[] = "Hello, World";
char *b = a;
char c[] = "Hello, World";
char *d = malloc(sizeof(a));
strcpy(d, a);
```

In this code, 4 variables all represents strings with value `Hello, World`. However, among these 4 variables, only `a` and `b` have the same address. The address of `a`, `c`, and `d` are different.

If two variables have the same address, changing one variable's value will affect the other's. For example, if you execute the following code after the previous one:

```c
a[2] = ' ';
printf("%s\n", b);
```

You will find that the value of `b` also changes even when we only changed `a` in our code.

These should not be surprising to you as long as you learned the basics of any programming language. However, in large projects, the codes can easily become complicated and intertwined, which would lead to many problems of mismatching variables.

### Ambiguity of Assignment Statement

However, we shouldn't blame the programmers for all the variable addess mismatches. Many times, these mistakes are caused by the ambiguity of programming languages.

For example, can you tell whether `b` copies the value of `a` or the address of `a` in these C++ codes?

```cpp
// #1
std::vector<int> a({1, 2, 3, 4, 5});
std::vector<int> b = a;

// #2
std::string a = "Hello, World";
std::string b = a;
```

And what about these similar Java codes?

```java
// #3
ArrayList<Integer> a = new ArrayList<>(List.of(1, 2, 3, 4, 5));
ArrayList<Integer> b = a;

// #4
String a = "Hello, World";
String b = a;
```

The answers are:

1. Copy by value
2. Copy by value
3. Copy by address
4. Copy by address. But since Java's `String` object is immutable (meaning that when I modify a `String` object, Java will create a new address for the object), this statement is equivalent to copying by value.

Another Java example:

```java
int[][] a = new int[][] { {1, 2, 3}, {4, 5, 6} };
int[][] b = a.clone();
b[0][0] = 0;
for(int[] row : a) {
    for(int value : row) {
        System.out.print(value + " ");
 }
    System.out.println();
}
```

It seems that `b` already copied `a` by its `clone` method, but the actual output is:

```plaintext
0 2 3
4 5 6
```

This is because in Java, 2D arrays are stored as an "array of arrays." Each element in the first layer of array is a pointer to another array in the second layer. The `clone` method here only copies the pointers in the first layer array, but the address of elements in the second layer is still the same. Therefore, modifying `b`'s elements will still change that of array `a`.

As you can see, even the same variable assignment statement have different effects in different languages or contexts. It becomes worse in languages with operator overloads, since the meaning of the "equal sign" can be an arbitrarily defined function. In this case, it is important to clearly state whether the assignment is copying the variable's value or its address.

## Mutability

If you've studied computer architecture, you should know that CPUs can actually change any address at any time. But in practice, programming languages defines which addresses can be changed and what not.

Sometimes programming languages would restrict programmer's actions by not allowing certain variables to be changed. This is called the variable's **mutability**.

### Two Types of Mutability

When dealing with structures and classes, "mutability" can mean two things:

- Whether the variable itself can be reassigned. That is, whether this code is allowed:
 ```code
 var a <- something
 a <- another value
 ```
- Whether the variable's members can be changed. That is, whether this code is allowed:
 ```code
 var a <- something
 a.property <- another value
 ```

We call the first type **external mutability** and the second type **internal mutability**.

Different languages also have different restrictions on variables' mutabilities.

- Some languages don't have any mutability restrictions, such as Java. Java requires programmers to define getters and setters to restrict internal mutability.
- Some other languages only differentiate one of the two mutabilities. For example, Kotlin's `var`/`val` and Javascript's `let`/`const` only differentiates external mutability. Rust's `let` restricts both external and internal mutability at once.
- Some languages differentiates both types of mutability. For example, pointers in C. `const char*` and `char const*` limits internal mutability, and `char* const` limits external mutability.

### Error Caused by Mutability

It is a common mistake for beginners to disregard variables' mutabilities. For example, the following Java code:

```java
ArrayList<Integer> a = new ArrayList<>(List.of(1, 2, 3, 4, 5));

for(Integer x : a) {
    if(x % 2 == 0) {
        a.add(x + 1);
 }
}
```

This code wants to traverse all numbers in array `a`, and for each odd number, add that number + 1 in the end of the array. But this code throws a runtime error when running.

The reason is: when traversing an array with for-each loop, the array should not be internally mutable within the loop, or it will cause ambiguities. The compiler don't know if the newly added elements should also get traversed, or the loop should only traverse the existing elements.

Since Java doesn't limit the variable's mutability, the code passes the compiler but throws an exception during runtime. For languages such as Rust, the same code cannot even pass the compiler:

```rust
let mut a = vec![1, 2, 3, 4, 5];
for x in &a {
    if *x % 2 == 0 {
        a.push(*x + 1);
 }
}
```

### Separating Mutable and Immutable Variables

Sometimes you may want to let an object be mutable in some context and immutable in some other contexts, such as in the previous for-each loop. Then, it's important to indicate the mutabilities of the members.

In many object-oriented languages, changing members' visibilities can limit users' actions of changing variables in unwanted ways. For example, here is a custom string class in Java without visibility modifiers.

```java
class MyString {
  char[] chars;

  MyString(char[] chars) {
    this.chars = chars.clone();
 }

  char get(int i) {
    return this.chars[i];
 }

  void set(int i, char c) {
    this.chars[i] = c;
 }

  MyString getSlice(int start, int end) {
    char[] slice = new char[end - start];
    for(int i = start; i < end; i++) {
 slice[i - start] = this.chars[i];
 }
    return new MyString(slice);
 }
}
```

If you want to make this class read-only and not let users change any value, you can set part of the methods to `private`, like this:

```java
class MyString {
  private char[] chars;

  public MyString(char[] chars) { ... }

  public char get(int i) { ... }

  private void set(int i) { ... }

  public MyString getSlice(int i) { ... }
}
```

Notice that the `getSlice` method create a copy of slice, so it's safe to make it `public`.

However, if you also want to have a mutable `MyString` in other cases, you need to create a new class.

```java
class MyStringMutable {
  public char[] chars;

  public MyStringMutable(char[] chars) { ... }

  public char get(int i) { ... }

  public void set(int i) { ... }

  public MyString getSlice(int i) { ... }
}
```

And define the conversion between the two classes:

```java
class MyString {
 ...

  public MyString(MyStringMutable str) { ... }
}

class MyStringMutable {
 ...

  public MyStringMutable(MyString str) {}
}
```

In languages with mutability keywords, such as C++, there is a better solution. C++ allows you to declare a function to be "readonly member" by adding the `const` keyword after its declaration. C++ compiler ensures that the function would not modify any members. In the previous example:

```cpp
class MyString {
  private:
    char chars[128];
  public:
    MyString(char *chars) { ... }
    char get(int i) const { ... }
    char set(int i, char c) { ... }
    MyString getSlice(int start, int end) const { ... }
}
```

Then, `MyString` objects can call all its member functions, but `const MyString` can only call functions declared as `const`, that is, `get`, and `getSlice`.

Usually, the less mutable a variable, the safer the code, especially in multithreading.

## Threads

When your program want to execute many tasks at the same time, it's inevitable to touch upon the concept of **multithreading**. Most languages have interfaces for multithreading, which usually includes

- Creation: pass in the function to execute (usually as a function name or lambda expression), the operating system will manage the new thread.
- Termination: end the current thread
- Waiting: wait in the current thread for another thread to end

Frequent creation and termination of threads can be costly in time and memory space. Thus, it's not recommended to launch too many unnecessary threads. A modern CPU has a **hardware concurrency count**, which means the maximum number of threads running in parallel supported by the CPU hardware. Creating more threads than the hardware concurrency count will not result in more performance improvement.

We can use **thread pool** if the tasks to be executed well exceed the hardware concurrency count. A thread pool would create many threads, each of which would execute the task assigned to it and pull a new task from the task queue when the old task is finished.

Of course, as multithreading brings us efficiency, it is prone to all sorts of errors.

### Shared Variables

Most cases, threads are not completely independent from each other. They may need to share or send some informations. How do we do that?

Although different threads may run on different CPU cores, they all share the same memory. If two threads know the address of a global variable, they can try to read from and write to this address, making it possible to pass information between the two threads. For example, the following C++ code:

```cpp
int global = 1;

void thread1() {
 // This function will run in a new thread
 global =  2;
}

int main() {
 // This is the main thread
 thread t(thread1); // Create a new thread and let it execute `thread1()`
 global = 3;
 cout << global << endl;
 cout << global << endl;
 cout << global << endl;
 cout << global << endl;
    t.join(); // Wait for the thread to end
}
```

But I believe you can also see the problem of this method from this code: because two threads are running at the same time, you don't know whether the first thread writes the data first or the second thread reads the data first.

Things will be worse if two threads are trying to write to the same address. When multiple threads try to write to the same address at the same time, the operating system cannot guarantee what value the address will eventually be written to. Therefore, we need to find a way to achieve **thread synchronization**.

#### Mutex Lock

One important and useful tool to solve data conflict is the **mutual exclusion lock (mutex lock)**. The lock has 2 states: locked or unlocked. Mutex lock can be shared safely between threads, and each thread can perform one of the two actions:

- lock: try to change the state of the lock from 'unlocked' to 'locked'. If the lock is already locked, then wait until the lock changes to 'unlocked'.
- release/unlock: change the state of the lock from 'locked' to 'unlocked'.

It's obvious that with these constraints, one and only one thread can lock the mutex lock at any given time. Thus, for any variable shared between threads, we need to define a corresponding mutex lock. If a thread wants to access the variable, it has to lock the mutex lock first, or multiple threads might read and write to the variable simultaneously.

The previous code can be modified like this:

```cpp
int global = 1;
mutex global_lock; // construct a mutex lock

void thread1() {
    global_lock.lock(); // try to lock
 global = 2;
    global_lock.unlock(); // try to release
}

int main() {
 thread t(thread1);

    global_lock.lock(); // try to lock
 global = 3;
    global_lock.unlock(); // try to release

 cout << global << endl;
 cout << global << endl;
 cout << global << endl;
 cout << global << endl;
    t.join(); // wait until the thread ends
}
```

The mutex lock has some variations, such as *read-write lock*. The Read-write lock has 3 states: read, write, and unlocked. The lock allows multiple threads to lock it into 'read' mode or at most one thread to 'write' mode, which enables multiple threads to read the same address. The lock slightly improves execution speed while maintaining thread synchronization.

#### Atomic Variable

If your shared variable is an integer, floating point number, character, or any small elements like such, mutex lock will create a significant time overhead compared to the actual read-write operation. A better way then is to use the **atomic variable**.

Let's say you want to share primitive variables between threads. When you modify the variable in one thread, perform `+=` operation, for example:

```cpp
int global = 1;

void thread() {
 global += 1;
}
```

This instruction contains multiple subparts:

1. Read the integer value from the address of `global`
2. Increase this value by 1
3. Write back to the address of `global`

Imagine two threads executing the same function in parallel. The ideal case would be this:

1. Thread 1: read from the address of `global`
2. Thread 1: compute `global + 1`
3. Thread 1: write back to the address of `global`
4. Thread 2: read from the address of `global`
5. Thread 2: compute `global + 1`
6. Thread 2: write back to the address of `global`

After 6 instructions, the value of `global` will increase by 2. But the following case might also happen, though not very likely:


1. Thread 1: read from the address of `global`
2. Thread 1: compute `global + 1`
3. Thread 2: read from the address of `global` (Since thread 1 hasn't written back to `global` yet, the value stored in main memory hasn't changed)
4. Thread 1: write back to the address of `global`
5. Thread 2: compute `global + 1`
6. Thread 2: write back to the address of `global`

In this case, `global`'s value only increases 1 after the 6 instructions, which is not what we have expected.

The advantage of **atomic variables** is that it can prevent other threads from interrupting its operation. I haven't quite figured out the mechanism behind that, but from what I know, atomic variables can prevent the previous problem without a mutex lock's high time overhead.

We only need to replace the `int` in our code with `atomic<int>` in the `atomic` library.

```cpp
atomic<int> global = 1;

void thread() {
 global += 1;
}
```

#### Advantage of Immutable Variables

If the variable you need to share is read-only and internally immutable, then you don't even need to use any mutex locks to ensure thread safety, because no matter how many threads want to access this variable simultaneously, as long as they don't change the variable's value, they will not cause any errors.

If your shared variable is read-only but external mutable, then you only need to use an integer atomic variable to store the variable's address. Each time the variable is accessed, you only need to read the value on this address. Compared with mutex locks, an atomic variable's time overhead will be much smaller.

As you can see, due to various restrictions in modification, sharing an immutable variable in multiple threads will reduce the space and time overhead. It is important to pay attention to the mutability of variables in the process of writing code.

(Translation to be continued...)
