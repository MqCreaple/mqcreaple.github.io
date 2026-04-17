---
title: "Hilbert's Curve and Color Fractal"
layout: blog
tags: ["computer-graphics", "shader"]
optional_scripts:
  - jquery
  - shadertoy
---

Fractals can be a powerful tool in creating arts. With computer codes, you can generate fractals with infinitely complex details in a few lines of code. The following pictures explores the possibility of creating fractals in the color space.

As we all know, there are 3 fundamental colors from which every color can be created. This fact means that the color space is 3-dimensional. If we can embed fractal geometry in the 3D color space, we can visualize fractals in a new way.

The [Hilbert curve](https://en.wikipedia.org/wiki/Hilbert_curve) is a type of space-filling fractal. Although it may look like a 1 dimensional line, as it iterates, the Hilbert curve can fill the entire unit square. Here is an illustration of Hilbert curve's space filling property by mapping each pixel on the screen to an intensity between 0 to 255 according to its position on the Hilbert curve.

<div class="shadertoy-figure shadertoy-pause">
void getHilbert3D(int index, out ivec3 v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    for(int i = 0; i < 8; i++) {
        int bits = (index >> (3 * i)) & 7;
        if(bits == 0) {
            v = v.yxz;
        } else if(bits == 1) {
            v = v.yzx + ivec3(0, 1 << i, 0);
        } else if(bits == 2) {
            v = v.yzx + ivec3(0, 1 << i, 1 << i);
        } else if(bits == 3) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(0, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 4) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(1 << i, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 5) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << (i + 1)) - 1);
        } else if(bits == 6) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << i) - 1);
        } else if(bits == 7) {
            v = v.yxz * ivec3(-1, -1, 1) + ivec3((1 << (i + 1)) - 1, (1 << i) - 1, 0);
        }
    }
}

int getHilbert2D(in ivec2 v) {
    int ans = 0;
    for(int i = 15; i >= 0; i--) {
        int xb = v.x & (1 << i);
        int yb = v.y & (1 << i);
        v.x -= xb;
        v.y -= yb;
        if(xb == 0 && yb == 0) {
            v = v.yx;
        } else if(xb == 0 && yb != 0) {
            ans += 1 * (1 << (2 * i));
        } else if(xb != 0 && yb != 0) {
            ans += 2 * (1 << (2 * i));
        } else {
            ans += 3 * (1 << (2 * i));
            v = (1 << i) - 1 - v.yx;
        }
    }
    return ans;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 16.0);
    int index = getHilbert2D(coord);
    float gray = float(index) / 256.0;
    fragColor = vec4(gray, gray, gray, 1.0);
}
</div>

The previous image contains all shades of grays an 8-bit screen can display. How many levels of gray can you distinguish? Can you spot the Hilbert curve from this picture?

Of course. Hilbert curve can also be generalized to 3D or even higher dimensions. The following picture is created by filling the RGB color space with 3D Hilbert curve, and then stretch the curve into a straight line.

<div class="shadertoy-figure shadertoy-pause">
void getHilbert3D(int index, out ivec3 v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    for(int i = 0; i < 8; i++) {
        int bits = (index >> (3 * i)) & 7;
        if(bits == 0) {
            v = v.yxz;
        } else if(bits == 1) {
            v = v.yzx + ivec3(0, 1 << i, 0);
        } else if(bits == 2) {
            v = v.yzx + ivec3(0, 1 << i, 1 << i);
        } else if(bits == 3) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(0, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 4) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(1 << i, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 5) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << (i + 1)) - 1);
        } else if(bits == 6) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << i) - 1);
        } else if(bits == 7) {
            v = v.yxz * ivec3(-1, -1, 1) + ivec3((1 << (i + 1)) - 1, (1 << i) - 1, 0);
        }
    }
}

int getHilbert2D(in ivec2 v) {
    int ans = 0;
    for(int i = 15; i >= 0; i--) {
        int xb = v.x & (1 << i);
        int yb = v.y & (1 << i);
        v.x -= xb;
        v.y -= yb;
        if(xb == 0 && yb == 0) {
            v = v.yx;
        } else if(xb == 0 && yb != 0) {
            ans += 1 * (1 << (2 * i));
        } else if(xb != 0 && yb != 0) {
            ans += 2 * (1 << (2 * i));
        } else {
            ans += 3 * (1 << (2 * i));
            v = (1 << i) - 1 - v.yx;
        }
    }
    return ans;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    int index = int((uv.x) * 256.0 * 256.0 * 256.0);
    ivec3 col;
    getHilbert3D(index, col);
    fragColor = vec4(vec3(col) / 256.0, 1.0);
}
</div>

The strip is quite long, and it's hard to see the full picture at once. But you can zoom in to see that each 1/8th of the line has a similar pattern to the overall line (which is more obvious around the black and white regions).

If we combine the two, we can first map each color in space into an single integer representing its index on the 3D Hilbert curve, then we fold the line to a 2D square with the 2D Hilbert curve mapping. And we can get the following picture:

<div class="shadertoy-figure shadertoy-pause">
void getHilbert3D(int index, out ivec3 v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    for(int i = 0; i < 8; i++) {
        int bits = (index >> (3 * i)) & 7;
        if(bits == 0) {
            v = v.yxz;
        } else if(bits == 1) {
            v = v.yzx + ivec3(0, 1 << i, 0);
        } else if(bits == 2) {
            v = v.yzx + ivec3(0, 1 << i, 1 << i);
        } else if(bits == 3) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(0, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 4) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(1 << i, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 5) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << (i + 1)) - 1);
        } else if(bits == 6) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << i) - 1);
        } else if(bits == 7) {
            v = v.yxz * ivec3(-1, -1, 1) + ivec3((1 << (i + 1)) - 1, (1 << i) - 1, 0);
        }
    }
}

int getHilbert2D(in ivec2 v) {
    int ans = 0;
    for(int i = 15; i >= 0; i--) {
        int xb = v.x & (1 << i);
        int yb = v.y & (1 << i);
        v.x -= xb;
        v.y -= yb;
        if(xb == 0 && yb == 0) {
            v = v.yx;
        } else if(xb == 0 && yb != 0) {
            ans += 1 * (1 << (2 * i));
        } else if(xb != 0 && yb != 0) {
            ans += 2 * (1 << (2 * i));
        } else {
            ans += 3 * (1 << (2 * i));
            v = (1 << i) - 1 - v.yx;
        }
    }
    return ans;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 4096.0);
    int index = getHilbert2D(coord);
    ivec3 col;
    getHilbert3D(index, col);
    fragColor = vec4(vec3(col) / 256.0, 1.0);
}
</div>

This image contains all possible colors your computer monitor can display (given that your monitor is at least 4k and you're viewing this image in full-screen).

What if we use other types of space-filling curves?

For example, Moore curve, which is essentially stacking 4 (or 8 in 3D) Hilbert curve together to form a loop:

<div class="shadertoy-figure shadertoy-pause">
int getHilbert2DWithLevel(in ivec2 v, int level) {
    int ans = 0;
    for(int i = level; i >= 0; i--) {
        int xb = v.x & (1 << i);
        int yb = v.y & (1 << i);
        v.x -= xb;
        v.y -= yb;
        if(xb == 0 && yb == 0) {
            // ans += 0 * (1 << (2 * i));
            v = v.yx;
        } else if(xb == 0 && yb != 0) {
            ans += 1 * (1 << (2 * i));
        } else if(xb != 0 && yb != 0) {
            ans += (2 << (2 * i));
        } else {
            ans += (3 << (2 * i));
            v = (1 << i) - 1 - v.yx;
        }
    }
    return ans;
}

int getMoore2D(in ivec2 v, int level) {
    int xb = v.x & (1 << level);
    int yb = v.y & (1 << level);
    v.x -= xb;
    v.y -= yb;
    if(xb == 0 && yb == 0) {
        v = v.yx * ivec2(1, -1) + ivec2(0, (1 << level) - 1);
        return getHilbert2DWithLevel(v, level - 1);
    } else if(xb == 0 && yb != 0) {
        v = v.yx * ivec2(1, -1) + ivec2(0, (1 << level) - 1);
        return getHilbert2DWithLevel(v, level - 1) + (1 << (level * 2));
    } else if(xb != 0 && yb != 0) {
        v = v.yx * ivec2(-1, 1) + ivec2((1 << level) - 1, 0);
        return getHilbert2DWithLevel(v, level - 1) + (2 << (level * 2));
    } else {
        v = v.yx * ivec2(-1, 1) + ivec2((1 << level) - 1, 0);
        return getHilbert2DWithLevel(v, level - 1) + (3 << (level * 2));
    }
}

void getHilbert3DWithLevel(int index, out ivec3 v, int level) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    for(int i = 0; i < level; i++) {
        int bits = (index >> (3 * i)) & 7;
        if(bits == 0) {
            v = v.yxz;
        } else if(bits == 1) {
            v = v.yzx + ivec3(0, 1 << i, 0);
        } else if(bits == 2) {
            v = v.yzx + ivec3(0, 1 << i, 1 << i);
        } else if(bits == 3) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(0, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 4) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(1 << i, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 5) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << (i + 1)) - 1);
        } else if(bits == 6) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << i) - 1);
        } else if(bits == 7) {
            v = v.yxz * ivec3(-1, -1, 1) + ivec3((1 << (i + 1)) - 1, (1 << i) - 1, 0);
        }
    }
}

void getMoore3D(int index, out ivec3 v) {
    getHilbert3DWithLevel(index, v, 7);
    int bits = (index >> 21) & 7;
    if(bits == 0) {
        v = v.zyx * ivec3(-1, 1, 1) + ivec3((1 << 7) - 1, 0, 0);
    } else if(bits == 1) {
        v = v.yxz * ivec3(-1, 1, 1) + ivec3((1 << 7) - 1, 0, 1 << 7);
    } else if(bits == 2) {
        v = v.yxz * ivec3(-1, 1, 1) + ivec3((1 << 7) - 1, 1 << 7, 1 << 7);
    } else if(bits == 3) {
        v = v.zyx * ivec3(-1, -1, -1) + ivec3((1 << 7) - 1, (1 << 8) - 1, (1 << 7) - 1);
    } else if(bits == 4) {
        v = v.zyx * ivec3(1, -1, 1) + ivec3(1 << 7, (1 << 8)  - 1, 0);
    } else if(bits == 5) {
        v = v.yxz * ivec3(1, -1, 1) + ivec3(1 << 7, (1 << 8) - 1, 1 << 7);
    } else if(bits == 6) {
        v = v.yxz * ivec3(1, -1, 1) + ivec3(1 << 7, (1 << 7) - 1, 1 << 7);
    } else if(bits == 7) {
        v = v.zyx * ivec3(1, 1, -1) + ivec3(1 << 7, 0, (1 << 7) - 1);
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 4096.0);
    int index = getMoore2D(coord, 11);
    ivec3 col;
    getMoore3D(index, col);
    fragColor = vec4(vec3(col) / 256.0, 1.0);
}
</div>

This is the color map constructed with the Peano curve.

<div class="shadertoy-figure shadertoy-pause">
const int pow3[19] = int[](1, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683, 59049, 177147, 531441, 1594323, 4782969, 14348907, 43046721, 129140163, 387420489);

void getPeano3D(int index, out ivec3 v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    int pow27i = 1;
    for(int i = 0; i < 5; i++) {
        int bits = (index / pow27i) % 27;
        pow27i *= 27;
        int z = bits % 3;
        int x = bits / 3 % 3;
        int y = bits / 9 % 3;
        if((y & 1) == 1) {
            x = 2 - x;
        }
        if(((x + y) & 1) == 1) {
            z = 2 - z;
        }
        if((z & 1) == 1) {
            // flip x and y
            v.x = pow3[i] - 1 - v.x;
            v.y = pow3[i] - 1 - v.y;
        }
        if((x & 1) == 1) {
            // flip y and z
            v.y = pow3[i] - 1 - v.y;
            v.z = pow3[i] - 1 - v.z;
        }
        if((y & 1) == 1) {
            // flip z and x
            v.x = pow3[i] - 1 - v.x;
            v.z = pow3[i] - 1 - v.z;
        }
        v.x += x * pow3[i];
        v.y += y * pow3[i];
        v.z += z * pow3[i];
        
    }
}

int getPeano2D(in ivec2 v) {
    int ans = 0;
    for(int i = 9; i >= 0; i--) {
        int xb = v.x / pow3[i];
        int yb = v.y / pow3[i];
        v.x -= xb * pow3[i];
        v.y -= yb * pow3[i];
        if(xb == 1) {
            yb = 2 - yb;
            // flip y
            v.y = pow3[i] - 1 - v.y;
        }
        if(yb == 1) {
            v.x = pow3[i] - 1 - v.x;
        }
        ans += (xb * 3 + yb) * pow3[2 * i];
    }
    return ans;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 729.0);
    int index = getPeano2D(coord);
    ivec3 col;
    getPeano3D(index, col);
    fragColor = vec4(vec3(col) / 81.0, 1.0);
}
</div>

Since Peano curve is constructed by dividing the space into 1/3 of its original length, the curve's size must be a power of 3. To be able to put everyting onto a square, it also requires the cube's side length to be a perfect square number. The largest number satisfying both requirements is 81. Thus, the color division shown in this image is not as finely comparing to the previous curves.

We can also give the graph some animation:

<div class="shadertoy-figure">
void getHilbert3D(int index, out ivec3 v) {
    v.x = 0;
    v.y = 0;
    v.z = 0;
    for(int i = 0; i < 8; i++) {
        int bits = (index >> (3 * i)) & 7;
        if(bits == 0) {
            v = v.yxz;
        } else if(bits == 1) {
            v = v.yzx + ivec3(0, 1 << i, 0);
        } else if(bits == 2) {
            v = v.yzx + ivec3(0, 1 << i, 1 << i);
        } else if(bits == 3) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(0, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 4) {
            v = v.xyz * ivec3(1, -1, -1) + ivec3(1 << i, (1 << i) - 1, (1 << (i + 1)) - 1);
        } else if(bits == 5) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << (i + 1)) - 1);
        } else if(bits == 6) {
            v = v.yzx * ivec3(-1, 1, -1) + ivec3((1 << (i + 1)) - 1, 1 << i, (1 << i) - 1);
        } else if(bits == 7) {
            v = v.yxz * ivec3(-1, -1, 1) + ivec3((1 << (i + 1)) - 1, (1 << i) - 1, 0);
        }
    }
}

int getHilbert2D(in ivec2 v) {
    int ans = 0;
    for(int i = 15; i >= 0; i--) {
        int xb = v.x & (1 << i);
        int yb = v.y & (1 << i);
        v.x -= xb;
        v.y -= yb;
        if(xb == 0 && yb == 0) {
            v = v.yx;
        } else if(xb == 0 && yb != 0) {
            ans += 1 * (1 << (2 * i));
        } else if(xb != 0 && yb != 0) {
            ans += 2 * (1 << (2 * i));
        } else {
            ans += 3 * (1 << (2 * i));
            v = (1 << i) - 1 - v.yx;
        }
    }
    return ans;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 4096.0);
    int index = (getHilbert2D(coord) + int(32768. * iTime)) & ((1 << 25) - 1);
    index = (((index & (1 << 24)) > 0) ? ((1 << 25) - index) : index);
    ivec3 col;
    getHilbert3D(index, col);
    fragColor = vec4(vec3(col) / 256.0, 1.0);
}
</div>

This technique of converting a cube into a square with space-filling curves has a great potential in creating artworks. I'll be glad if this inspires you in some way.
