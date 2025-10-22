theorem example1(p q : Prop) : p → q → p :=
  fun a : p => fun _ : q => a

theorem example2(p q r : Prop) : (p → r) → (q → r) → (p ∨ q → r) :=
  fun f : (p → r) => fun g : (q → r) => fun a : (p ∨ q) =>
    match a with
      | Or.inl (b : p) => (f b)
      | Or.inr (b : q) => (g b)

theorem example3(p q r : Prop) : (p → q → r) → (p ∧ q → r) :=
  fun f : (p → q → r) => fun a : (p ∧ q) => (f a.left a.right)

theorem int_square_equals_mul_itself (x : Int) : (x ^ 2 = x * x) := by
  rw [Int.pow_succ, Int.pow_succ, Int.pow_zero, Int.one_mul]

theorem example4 : (∀ x : Int, x ^ 2 >= 0) :=
  fun x : Int => by
    by_cases h : x ≥ 0
    · -- Case 1: x ≥ 0
      have hx : 0 ≤ x := h
      calc
        x ^ 2 = x * x := by rw [int_square_equals_mul_itself]
        _ ≥ 0 := Int.mul_nonneg hx hx
    · -- Case 2: x < 0
      have hlt : x < 0 := Int.lt_of_not_ge h
      have hpos : 0 < -x := Int.neg_pos.mpr hlt
      calc
      x ^ 2 = x * x := by rw [int_square_equals_mul_itself]
      _ = (-x) * (-x) := by rw [Int.neg_mul_neg]
      _ ≥ 0 := Int.mul_nonneg (Int.le_of_lt hpos) (Int.le_of_lt hpos)

theorem example5 : (∃ x : Int, x ^ 2 + 2 * x - 3 < 0) :=
  ⟨0, by simp⟩
