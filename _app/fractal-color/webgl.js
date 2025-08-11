const hilbertShaderSrc = `
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
`;

const mooreShaderSrc = `
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
`;

const peanoShaderSrc = `
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
`

const externVarSrc = `
uniform vec3 iResolution;
`;

const vertexShaderSrc = `#version 300 es
precision highp float;
precision highp int;
in vec2 pos;
void main() { gl_Position = vec4(pos.xy, 0.0, 1.0); }
`;

const hilbert0FragmentShaderSrc = `#version 300 es
precision highp float;
precision highp int;
${externVarSrc}
${hilbertShaderSrc}
out vec4 color;
void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 16.0);
    int index = getHilbert2D(coord);
    float gray = float(index) / 256.0;
    color = vec4(gray, gray, gray, 1.0);
}
`;
const hilbert1FragmentShaderSrc = `#version 300 es
precision highp float;
precision highp int;
${externVarSrc}
${hilbertShaderSrc}
out vec4 color;
void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    int index = int((uv.x) * 256.0 * 256.0 * 256.0);
    ivec3 col;
    getHilbert3D(index, col);
    color = vec4(vec3(col) / 256.0, 1.0);
}
`;
const hilbert2FragmentShaderSrc = `#version 300 es
precision highp float;
precision highp int;
${externVarSrc}
${hilbertShaderSrc}
out vec4 color;
void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 4096.0);
    int index = getHilbert2D(coord);
    ivec3 col;
    getHilbert3D(index, col);
    color = vec4(vec3(col) / 256.0, 1.0);
}
`;
const mooreFragmentShaderSrc = `#version 300 es
precision highp float;
precision highp int;
${externVarSrc}
${mooreShaderSrc}
out vec4 color;
void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 4096.0);
    int index = getMoore2D(coord, 11);
    ivec3 col;
    getMoore3D(index, col);
    color = vec4(vec3(col) / 256.0, 1.0);
}
`;
const peanoFragmentShaderSrc = `#version 300 es
precision highp float;
precision highp int;
${externVarSrc}
${peanoShaderSrc}
out vec4 color;
void main(void) {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    ivec2 coord = ivec2(uv * 729.0);
    int index = getPeano2D(coord);
    ivec3 col;
    getPeano3D(index, col);
    color = vec4(vec3(col) / 81.0, 1.0);
}
`;

function createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders: " + glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
    }
    return shader;
}
function drawOnCanvas(canvas, fragmentShaderSrc, errorMsgNode) {
    let glCtx = canvas.getContext('webgl2');
    if(!glCtx) {
        console.log("WebGL2 not supported. Falling back on experimental WebGL2...");
        glCtx = canvas.getContext("experimental-webgl2");
    }
    if(!glCtx) {
        errorMsgNode.innerHTML = "WebGL2 is not supported on your canvas!";
        return;
    }
    // Create shaders
    const vertexShader = createShader(glCtx, glCtx.VERTEX_SHADER, vertexShaderSrc);
    const fragmentShader = createShader(glCtx, glCtx.FRAGMENT_SHADER, fragmentShaderSrc);

    if (!vertexShader || !fragmentShader) {
        errorMsgNode.innerHTML = "Shader compilation failed. Check the console for errors.";
        return;
    }

    // Create program
    const program = glCtx.createProgram();
    glCtx.attachShader(program, vertexShader);
    glCtx.attachShader(program, fragmentShader);
    glCtx.linkProgram(program);

    if (!glCtx.getProgramParameter(program, glCtx.LINK_STATUS)) {
        errorMsgNode.innerHTML = "Unable to initialize the shader program: " + glCtx.getProgramInfoLog(program);
        return;
    }

    glCtx.useProgram(program);

    // Set up vertex buffer
    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ]);
    const buffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffer);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, vertices, glCtx.STATIC_DRAW);

    const posLoc = glCtx.getAttribLocation(program, "pos");
    glCtx.enableVertexAttribArray(posLoc);
    glCtx.vertexAttribPointer(posLoc, 2, glCtx.FLOAT, false, 0, 0);

    // Set uniform for resolution
    const iResolutionLoc = glCtx.getUniformLocation(program, "iResolution");
    glCtx.uniform3f(iResolutionLoc, canvas.width, canvas.height, 1.0);

    // Draw
    glCtx.viewport(0, 0, canvas.width, canvas.height);
    glCtx.clear(glCtx.COLOR_BUFFER_BIT);
    glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4);
}