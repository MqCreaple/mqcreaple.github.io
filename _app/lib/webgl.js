/**
 * @param {WebGLRenderingContext} gl WebGL context.
 * @param {number} type Shader type.
 * @param {string} source Shader source code.
 * @returns {WebGLShader | null} The WebGL shader created.
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

/**
 * 
 * @param {WebGLRenderingContext} gl Webgl Context.
 * @param {string} vsSource Vertex shader source code.
 * @param {string} fsSource Fragment shader source code.
 * @returns {WebGLProgram} The WebGL program created.
 */
function createProgram(gl, vsSource, fsSource) {
    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
}

/**
 * Create a float texture of given width and height.
 * @param {WebGLRenderingContext} gl WebGL context.
 * @param {number} width Texture width.
 * @param {number} height Texture height.
 * @param {number} filter Texture filter method. Default to be NEAREST.
 * @param {number} warp Warping method of the texture. Default to be CLAMP_TO_EDGE.
 * @returns {WebGLTexture} The created texture.
 */
function createFloatTexture(gl, width, height, filter = WebGLRenderingContext.NEAREST, warp = WebGLRenderingContext.CLAMP_TO_EDGE) {
    // create a texture and output the field to the texture
    const ext = gl.getExtension("OES_texture_float");
    if (!ext) throw new Error("Float textures not supported");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, warp);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, warp);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        width, height,
        0, gl.RGBA, gl.FLOAT, null
    );
    return tex;
}

/**
 * Create a frame buffer from a given texture.
 * @param {WebGLRenderingContext} gl WebGL context.
 * @param {WebGLTexture} texture The texture to create frame buffer from.
 */
function createFBO(gl, texture) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    );
    return fbo;
}

/**
 * Draw a quad shape covering the whole canvas.
 * @param {WebGLRenderingContext} gl WebGL context.
 * @param {WebGLProgram} program The program to use.
 */
function drawQuad(gl, program) {
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1,  1,  1, -1,   1, 1
    ]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}