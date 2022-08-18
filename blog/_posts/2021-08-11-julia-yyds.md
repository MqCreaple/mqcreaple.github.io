---
title: 盘点亿些Julia人性化的设计
layout: blog
tags: ["julia", "python"]
---

## Symbols

### 1. Greek Letters

Python:

```python
alpha = 1
beta = 2
gamma = 3
```

Julia:

```julia
α = 1      # type "\alpha" and press [tab]
β = 2
γ = 3
```

### 2. constants

Python:

```python
import math
print(math.pi)
print(math.e)
```

Julia:

```julia
println(π)     # "\pi"
println(ℯ)     # "\euler"
```

### 3. Operators

Python:

```python
3*x**2+2*x+1
sqrt(x)
```

Julia:

```julia
3x^2+2x+1
√x  # same as sqrt(x)
```

## Arrays | Vectors

### 1. loop

Python:

```python
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
for a in arr:
    print(a)
```

Julia:

```julia
arr = [1, 2, 3, 4, 5]
for a ∈ arr       # a "\in" arr
    println(a)
end
```

### 2. vector operation

Python:

```python
import numpy as np
np.add([1, 2, 3], 1)
np.add([1, 2, 3], [4, 5, 6])
np.multiply([1, 2, 3], 2)
np.multiply([1, 2], [3, 4])
def f(x):
    return 2 * x + 1
map(f, [1, 2, 3, 4])
```

Julia:

```julia
[1, 2, 3] .+ 1
[1, 2, 3] + [4, 5, 6]
[1, 2, 3] * 2
[1, 2] .* [3, 4]
f(x) = 2x + 1
f.([1, 2, 3, 4])
```

### 3. Matrix

Python:

```python
import numpy as np
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
C = A.dot(B)
D = A.transpose()
```

Julia:

```julia
A = [1 2 ; 3 4]
B = [5 6 ; 7 8]
C = A * B
D = A'
```