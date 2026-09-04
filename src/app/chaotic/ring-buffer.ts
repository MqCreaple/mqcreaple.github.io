// ring-buffer.ts — small fixed-capacity ring buffers used by the Lorenz
// visualization. Values are written newest-at-head; copyTo() uses native
// TypedArray.set() so chart updates avoid per-element JS loops.

export class FloatRingBuffer {
  readonly capacity: number;
  readonly data: Float32Array;
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.data = new Float32Array(capacity);
  }

  get length(): number {
    return this.count;
  }

  /** Index of the oldest buffered sample. */
  get start(): number {
    return this.count < this.capacity ? 0 : this.head;
  }

  push(value: number): void {
    this.data[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  /** Copy samples ordered oldest -> newest into `target` using native set(). */
  copyTo(target: Float32Array): void {
    const count = this.count;
    if (count === 0) return;
    const start = this.start;
    if (start + count <= this.capacity) {
      target.set(this.data.subarray(start, start + count));
    } else {
      const first = this.capacity - start;
      target.set(this.data.subarray(start));
      target.set(this.data.subarray(0, count - first), first);
    }
  }
}

export class TimeRingBuffer {
  readonly capacity: number;
  readonly data: Float64Array;
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.data = new Float64Array(capacity);
  }

  get length(): number {
    return this.count;
  }

  /** Index of the oldest buffered sample. */
  get start(): number {
    return this.count < this.capacity ? 0 : this.head;
  }

  push(value: number): void {
    this.data[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  /** Copy samples ordered oldest -> newest into `target` using native set(). */
  copyTo(target: Float64Array): void {
    const count = this.count;
    if (count === 0) return;
    const start = this.start;
    if (start + count <= this.capacity) {
      target.set(this.data.subarray(start, start + count));
    } else {
      const first = this.capacity - start;
      target.set(this.data.subarray(start));
      target.set(this.data.subarray(0, count - first), first);
    }
  }
}