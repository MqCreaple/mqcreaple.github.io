// title: git原理简介
// summary: Git 如何存储和更新版本信息。
// tags: git, github
// category: tech

#import "../../template.typ": article

#show: article.with(
  title: "git原理简介",
  lang: "zh",
)

相信大家都对 #link("https://git-scm.com/")[git] 耳熟能详了。Git 是一个简单易用的版本管理工具，用户可以在 git 中修改文件、提交 commit（更新到本地仓库）、同步远程仓库等。本篇文章将主要讨论 git 更新文件和提交 commit 背后的原理。

前置知识：git 基本操作，详见 #link("https://www.runoob.com/git/")[runoob] 和 #link("https://www.w3schools.com/git/")[w3schools]。

= 一些名词

- *工作区（working tree）*表示除去 `/.git` 以外的工作目录，即通常写代码的位置。
- *暂存区/索引（index）*是执行完 `git add` 指令时文件被添加到的地方。如果没有执行过 `git add` 命令，git 并不会为你自动保存。
- *版本库（repository）*是所有当前暂存区和历史上 commit 过的文件，暂存区可以看作是版本库的一个子集。所有版本库的文件都保存在 `/.git` 目录下。

所有的历史文件、文件目录、commit 记录等全部保存为二进制对象，统一保存在 `/.git/objects` 目录下，文件名为该文件的 SHA-1 哈希值且没有后缀。

- `blob`：全称为 Binary Large Object，是常规文件保存在 `/.git/objects` 下的形式。
- `tree`：目录文件保存在 `/.git/objects` 下的形式。
- `commit`：commit 记录保存在 `/.git/objects` 下的形式。

```text
└── objects
    ├── 41
    │   └── a1d4060cf09286c1cd8fe8bdab89ce26b71086
    ├── ce
    │   └── 013625030ba8dba906f756967f9e9ca394464a
    ├── dc
    │   └── a98923d43cd634f4359f8a1f897bf585100cfe
    ├── info
    └── pack
```

上图的文件目录中，三个 object 的 SHA-1 值分别为：`41a1d4...`，`ce0136...`，和 `dca989...`。

可以使用指令：

```shell
git hash-object 文件名
```

计算一个文件的 SHA-1 哈希值。

= HEAD 指针和 commit

`HEAD` 是一个指针，默认指向当前分支的最新一个 commit（存储了 commit 文件的哈希值）。每一次提交新的 commit 时，`HEAD` 也会相应前移。`HEAD` 存储在 `/.git/HEAD` 文件中。

每一个分支也有各自的 head，指向当前分支的最后一个 commit，各分支的 head 存储在 `/.git/refs/heads/` 分支名文件中。每一次执行 `git checkout` 切换分支的时候，实际上就是让全局的 `HEAD` 赋值成了另一个分支的 head。

总结一下，现在讲过的 `/.git` 目录结构都有：

```text
.git
├── HEAD          全局 HEAD 指针
├── objects
│   └── 二进制对象都在这里
└── refs
    └── heads
        └── 各个分支的 head
```

除了第一个 commit，以后的每个 commit 都会记录上一个 commit 的哈希值，这样就形成了一个树形结构。

当整个项目只有一个分支时，所有的 commit 形成一条链：

#if sys.inputs.at("format", default: "pdf") == "html" [
  #html.elem("div", attrs: (class: "mermaid"))[
    ```text
    graph RL
    A[commit<br>a5e2] --> B[commit<br>3d97]
    B --> C[commit<br>9cd6]
    C --> D[commit<br>729f]
    D --> E[commit<br>4375]
    E --> F[......]
    subgraph master: head
    A
    end
    ```
  ]
]

有多个分支时，则是这样的：

#if sys.inputs.at("format", default: "pdf") == "html" [
  #html.elem("div", attrs: (class: "mermaid"))[
    ```text
    graph RL
    A[commit<br>a5e2] --> B[commit<br>3d97]
    B --> C[commit<br>9cd6]
    C --> D[commit<br>729f]
    D --> E[commit<br>4375]
    E --> F[......]
    subgraph master: head
    A
    end
    G[commit<br>fc6a] --> E
    H[commit<br>7032] --> G
    subgraph branch1: head
    H
    end
    ```
  ]
]

= 文件和目录

之前说过，blob 对象和 tree 对象都存在 `/.git/objects/` 目录下。Tree 对象存储了其他一系列文件的哈希值，可以理解成是一个多叉树的结点，而一般文件是叶节点。

#if sys.inputs.at("format", default: "pdf") == "html" [
  #html.elem("div", attrs: (class: "mermaid"))[
    ```text
    graph TD
    A[[root]] --> B([readme.md])
    A --> C([.gitignore])
    A --> D[[src]]
    D --> E([main.cpp])
    D --> F([main.h])
    A --> G[[test]]
    G --> H([test.cpp])
    ```
  ]
]

暂存区/索引对应着 `/.git/index` 文件，它记录了当前暂存的所有文件和目录的哈希值。每一次执行 `git add` 指令，程序就会在 `/.git/objects` 目录中生成一个对应着该文件的 blob 对象，同时将这个对象的地址加到 `/.git/index` 中。

每一个 commit 结点指向了一个 tree 节点，表示某一次 commit 的根目录。两次 commit 中不变文件不会被创建新对象。

#image("git-file-0.svg", width: 70%)

这时，如果我们添加了一个 `.gitignore` 文件并且执行 `git add .gitignore` 命令，就会创建一个新的 blob 对象并添加进索引。

#image("git-file-1.svg", width: 70%)

再接下来提交 commit，程序就会新建一个表示根目录的 tree 对象并且指向所有索引（index）中的文件和文件夹。最后再处理 commit 结点，将其指向上一次的 commit，即完成了 git 提交，如图：

#image("git-file-2.svg", width: 70%)

= 总结

#quote(block: true)[
Git 的所有对象，包括文件、目录和 commit，全部存储在 `/.git/objects/` 文件夹下。

Commit 结点指向其上一次的 commit，形成一个树形结构，每个叶节点对应一个分支的 head。

全局的 `HEAD` 指针指向任意一个 commit 结点，通常是一个特定分支的 head。

`blob` 对应一般的文件，`tree` 对应文件夹，同一个文件夹下所有文件和文件夹组成一个树形结构，但同一个文件有可能被不同版本的文件夹同时指向。

每次 `add` 文件时，git 会生成一个新的 blob 对象并添加到 index 中。

每次进行 commit 时，git 会生成 tree 对象并令其指向所有的子文件，最后让 commit 结点指向根目录文件夹，同时设置 commit 结点的上一个结点，最后完成提交。
]

Git 的版本管理逻辑和信息竞赛里的“可持久化算法”思想很像，都是尽量避免记录过多重复的内容从而减少空间占用。

Git 在文件和目录这个树形结构之上，还有一个“commit”的分支结构，这意味着它可以应对更复杂的需求，但也意味着使用者需要记忆更多的命令。

本文仅是一个简单介绍，没有涵盖诸如分支合并和 tag 等更复杂的功能，如果以后有时间可以更新。

参考资料见 @progit 与 @gitBottomUp。

#bibliography("reference.bib", title: "参考资料")
