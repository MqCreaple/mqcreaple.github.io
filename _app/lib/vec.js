/**
 * A 2-dimensional vector.
 */
class Vec2 {
    /**
     * Construct a vec2 with the given x and y components.
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Compute the negation of this vector
     * @returns {Vec2} The negation of this vector
     */
    neg() {
        return new Vec2(-this.x, -this.y);
    }
    /**
     * Negate this vector in place
     */
    negEq() {
        this.x = -this.x;
        this.y = -this.y;
    }
    /**
     * Add this vector with another vector or number
     * - If v is a vector, add the corresponding x and y components of this vector and v
     * - If v is a number, add v to the x and y components of this vector
     * @param {number | Vec2} v another number or vector
     * @returns {Vec2} The sum of this vector and v
     */
    add(v) {
        if(v instanceof Vec2) {
            return new Vec2(this.x + v.x, this.y + v.y);
        } else if(typeof v === "number") {
            return new Vec2(this.x + v, this.y + v);
        }
    }
    /**
     * Add v to this vector in place
     * @param {number | Vec2} v another number or vector
     */
    addEq(v) {
        if(v instanceof Vec2) {
            this.x += v.x;
            this.y += v.y;
        } else if(typeof v === "number") {
            this.x += v;
            this.y += v;
        }
    }
    /**
     * Substitude this vector with another vector or number
     * @param {number | Vec2} v another number or vector
     * @returns {Vec2} This vector substituted with v
     */
    sub(v) {
        if(v instanceof Vec2) {
            return new Vec2(this.x - v.x, this.y - v.y);
        } else if(typeof v === "number") {
            return new Vec2(this.x - v, this.y - v);
        }
    }
    /**
     * Substitute this vector with v in place
     * @param {number | Vec2} v another number or vector
     */
    subEq(v) {
        if(v instanceof Vec2) {
            this.x -= v.x;
            this.y -= v.y;
        } else if(typeof v === "number") {
            this.x -= v;
            this.y -= v;
        }
    }
    /**
     * Multiply this vector with another vector or number
     * @param {number | Vec2} v another number or vector
     * @returns {Vec2} The product of this vector and v
     */
    mul(v) {
        if(v instanceof Vec2) {
            return new Vec2(this.x * v.x, this.y * v.y);
        } else if(typeof v === "number") {
            return new Vec2(this.x * v, this.y * v);
        }
    }
    mulEq(v) {
        if(v instanceof Vec2) {
            this.x *= v.x;
            this.y *= v.y;
        } else if(typeof v === "number") {
            this.x *= v;
            this.y *= v;
        }
    }
    div(v) {
        if(v instanceof Vec2) {
            return new Vec2(this.x / v.x, this.y / v.y);
        } else if(typeof v === "number") {
            return new Vec2(this.x / v, this.y / v);
        }
    }
    divEq(v) {
        if(v instanceof Vec2) {
            this.x /= v.x;
            this.y /= v.y;
        } else if(typeof v === "number") {
            this.x /= v;
            this.y /= v;
        }
    }
    /**
     * Calculate the magnitude of this vector
     * @returns {number} The magnitude of this vector
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Normalize this vector (divide this vector by its magnitude to make it a unit vector).
     * @returns {Vec2} The normalized vector of this vector
     */
    normalize() {
        let mag = this.magnitude();
        return new Vec2(this.x / mag, this.y / mag);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    angleBetween(v) {
        return Math.acos(this.dot(v) / (this.magnitude() * v.magnitude()));
    }
}