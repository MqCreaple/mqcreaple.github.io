/**
 * Use binary reduction to find the minimum and maximum of a given texture.
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {{ program: WebGLProgram, input: WebGLUniformLocation, texel: WebGLUniformLocation }} reduceUniform The uniform location of reduction program.
 * @param {WebGLTexture} initTexture Initial texture to find its min and max on.
 * @param {number} initWidth Initial width.
 * @param {number} initHeight Initial height.
 * @returns {WebGLTexture} The returned 1x1 texture, with its red channel as the minimum and green channel as the maximum.
 */
function reduceMinMax(gl, reduceUniform, initTexture, initWidth, initHeight) {
    let w = initWidth; let h = initHeight;
    let inputTex = initTexture;

    while (w > 1 || h > 1) {
        // console.log(`Reducing (${w}, ${h}) to (${Math.max(1, w >> 1 + (w & 1))})`);
        w = Math.max(1, (w >> 1) + (w & 1));  // when the width is odd, add an extra pixel to ensure it does not miss any pixels
        h = Math.max(1, (h >> 1) + (h & 1));

        const outTex = createFloatTexture(gl, w, h);
        const outFBO = createFBO(gl, outTex);

        gl.bindFramebuffer(gl.FRAMEBUFFER, outFBO);
        gl.viewport(0, 0, w, h);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTex);

        gl.useProgram(reduceUniform.program);
        gl.uniform1i(reduceUniform.input, 0);
        gl.uniform2f(reduceUniform.texel, 1 / (w * 2), 1 / (h * 2));

        gl.bindTexture(gl.TEXTURE_2D, inputTex);
        drawQuad(gl, reduceUniform.program);

        inputTex = outTex;
    }

    // // Debug: read back pixels and verify min/max
    // const pixels = new Float32Array(w * h * 4);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, createFBO(gl, inputTex));
    // gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);
    // console.log("Final 1x1 texture pixels:", pixels);
    // console.log("Min (R channel):", pixels[0], "Max (G channel):", pixels[1]);
    // // Read back pixels and find minimum / maximum from the original buffer
    // const originalPixels = new Float32Array(initWidth * initHeight * 4);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, createFBO(gl, initTexture));
    // gl.readPixels(0, 0, initWidth, initHeight, gl.RGBA, gl.FLOAT, originalPixels);
    // let realMin = Infinity;
    // let realMax = -Infinity;
    // for (let i = 0; i < originalPixels.length; i += 4) {
    //     const value = originalPixels[i]; // red channel
    //     realMin = Math.min(realMin, value);
    //     realMax = Math.max(realMax, value);
    // }
    // console.log("Real Min (from buffer):", realMin, "Real Max (from buffer):", realMax);

    return inputTex;
}

/**
 * @typedef {Object} GLHandle
 * @property {{ program: WebGLProgram, min: WebGLUniformLocation, max: WebGLUniformLocation }} compute
 * @property {{ program: WebGLProgram, input: WebGLUniformLocation, texel: WebGLUniformLocation }} reduce
 * @property {{ program: WebGLProgram, tex: WebGLUniformLocation, minmax: WebGLUniformLocation }} render
 * @property {WebGLTexture} texture
 * @property {WebGLFramebuffer} fbo
 */

/**
 * @param {Level} level The level object to render.
 * @param {HTMLCanvasElement} canvasGL The WebGL canvas to render the colormap.
 * @param {WebGLRenderingContext} gl The WebGL context on the canvas.
 * @param {number[]} xRange Initial x range.
 * @param {number[]} vRange Initial v range.
 * @return {GLHandle} The uniform locations, textures and frame buffer of compute and render shader.
 */
function initGL(level, canvasGL, gl, xRange = [-1.0, 1.0], vRange = [-1.0, 1.0]) {
    console.log("Rendering level \"" + level.name + "\"");

    // Shader code
    const quadVS = `
    attribute vec2 a_pos;
    varying vec2 v_uv;

    void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }`;
    
    const computeFS = `
    precision highp float;
    varying vec2 v_uv;

    uniform vec2 u_min;
    uniform vec2 u_max;

    float field(float x, float v) {
        ${level.glslCode}
    }

    void main() {
        vec2 state = mix(u_min, u_max, v_uv);
        float value = field(state.x, state.y);
        gl_FragColor = vec4(value, value, 0.0, 1.0); // duplicate the value on r and g channel for min/max
    }`;

    const mainTexure = createFloatTexture(gl, canvasGL.width, canvasGL.height);
    const mainFBO = createFBO(gl, mainTexure);

    const computeProgram = createProgram(gl, quadVS, computeFS);
    gl.bindFramebuffer(gl.FRAMEBUFFER, mainFBO);
    gl.viewport(0, 0, canvasGL.width, canvasGL.height);
    gl.useProgram(computeProgram);

    const computeUniform = {
        "program": computeProgram,
        "min": gl.getUniformLocation(computeProgram, "u_min"),
        "max": gl.getUniformLocation(computeProgram, "u_max"),
    };
    gl.uniform2f(computeUniform.min, xRange[0], vRange[0]);
    gl.uniform2f(computeUniform.max, xRange[1], vRange[1]);

    drawQuad(gl, computeProgram);

    // Read back pixels and find minimum / maximum
    //// const pixels = new Float32Array(canvasGL.width * canvasGL.height * 4);
    //// gl.readPixels(
    ////     0, 0,
    ////     canvasGL.width, canvasGL.height,
    ////     gl.RGBA, gl.FLOAT, pixels
    //// );
    //// let min = Infinity;
    //// let max = -Infinity;
    //// for (let i = 0; i < pixels.length; i += 4) {
    ////     const v = pixels[i]; // red channel
    ////     min = Math.min(min, v);
    ////     max = Math.max(max, v);
    //// }
    const reduceFS = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_input;
    uniform vec2 u_texel; // 1 / input resolution

    void main() {
        vec2 texel_invert_x = vec2(-u_texel.x, u_texel.y);
        vec4 a = texture2D(u_input, v_uv - u_texel * 0.5);
        vec4 b = texture2D(u_input, v_uv - texel_invert_x * 0.5);
        vec4 c = texture2D(u_input, v_uv + texel_invert_x * 0.5);
        vec4 d = texture2D(u_input, v_uv + u_texel * 0.5);

        float minv = min(min(a.r, b.r), min(c.r, d.r));
        float maxv = max(max(a.g, b.g), max(c.g, d.g));

        gl_FragColor = vec4(minv, maxv, 0.0, 1.0);
    }`;

    const reduceProgram = createProgram(gl, quadVS, reduceFS);
    gl.viewport(0, 0, canvasGL.width, canvasGL.height);
    gl.useProgram(reduceProgram);

    const reduceUniform = {
        "program": reduceProgram,
        "input": gl.getUniformLocation(reduceProgram, "u_input"),
        "texel": gl.getUniformLocation(reduceProgram, "u_texel"),
    };
    const minmaxTex = reduceMinMax(gl, reduceUniform, mainTexure, canvasGL.width, canvasGL.height);

    // render the texture
    const renderFS = `
    precision highp float;
    varying vec2 v_uv;

    uniform sampler2D u_tex;
    uniform sampler2D u_minmax;

    // Simple diverging colormap
    vec3 colormap(float t) {
        vec3 warm = vec3(0.3725, 0.0, 0.0);
        vec3 cold = vec3(0.0, 0.0, 0.3725);
        vec3 zero = vec3(0.7, 0.7, 0.7);
        if(t < 0.0) {
            return mix(zero, cold, -t);
        } else {
            return mix(zero, warm, t);
        }
    }

    void main() {
        float v = texture2D(u_tex, v_uv).r;
        vec2 mm = texture2D(u_minmax, vec2(0.0)).rg;
        float scale = max(abs(mm.x), abs(mm.y)) *0.95;
        float t = clamp(v / scale, -1.0, 1.0);
        gl_FragColor = vec4(colormap(t), 1.0);
    }`;

    const renderProgram = createProgram(gl, quadVS, renderFS);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasGL.width, canvasGL.height);
    gl.useProgram(renderProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mainTexure);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, minmaxTex);

    const renderUniform = {
        "program": renderProgram,
        "tex": gl.getUniformLocation(renderProgram, "u_tex"),
        "minmax": gl.getUniformLocation(renderProgram, "u_minmax"),
    };
    gl.uniform1i(renderUniform.tex, 0);
    gl.uniform1i(renderUniform.minmax, 1);
    
    drawQuad(gl, renderProgram);

    return {
        "compute": computeUniform,
        "reduce": reduceUniform,
        "render": renderUniform,
        "texture": mainTexure,
        "fbo": mainFBO,
    };
}

/**
 * Initialize the input area.
 * @param {Level} level 
 * @param {HTMLDivElement} inputArea
 * @returns {[Float64Array, Float64Array]} The time and position array. 
 */
function initInput(level, inputArea) {
    const NumPoints = 128;
    const timeDiff = level.endT - level.startT;
    const time = Float64Array.from({ length: NumPoints }, (_, i) => {
        return level.startT + timeDiff * i / (NumPoints - 1);
    });
    const pos = time.map(t => {
        return (t - level.startT) * (level.endX - level.startX) / timeDiff + level.startX;
    });
    const trace = {
        x: time,
        y: pos,
        mode: 'lines',
    };
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'black' },
        xaxis: {
            title: 'time',
            gridcolor: '#eeeab9',
            fixedrange: true,
        },
        yaxis: {
            title: 'position',
            gridcolor: '#eeeab9',
            fixedrange: true,
        },
        dragmode: false,
    };
    Plotly.newPlot(inputArea, [trace], layout, {
        displayModeBar: false,
        responsive: true,
    });
    return [time, pos];
}

const GRID_SPACINGS = [0.001, 0.002, 0.004, 0.01, 0.02, 0.04, 0.1, 0.2, 0.4, 1, 2, 4, 10, 20, 40, 100, 200, 400, 1000, 2000, 4000];

/**
 * @param {Level} level
 * @param {HTMLCanvasElement} canvasGL
 * @param {WebGLRenderingContext} gl
 * @param {GLHandle} glHandle
 * @param {[number, number]} xRange 
 * @param {[number, number]} yRange 
 */
function renderGL(level, canvasGL, gl, glHandle, xRange, yRange) {
    gl.useProgram(glHandle.compute.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, glHandle.fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glHandle.texture, 0
    );

    gl.uniform2f(glHandle.compute.min, xRange[0], yRange[0]);
    gl.uniform2f(glHandle.compute.max, xRange[1], yRange[1]);
    gl.viewport(0, 0, canvasGL.width, canvasGL.height);
    drawQuad(gl, glHandle.compute.program);

    const minmaxTex = reduceMinMax(gl, glHandle.reduce, glHandle.texture, canvasGL.width, canvasGL.height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasGL.width, canvasGL.height);
    gl.useProgram(glHandle.render.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glHandle.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, minmaxTex);
    gl.uniform1i(glHandle.render.tex, 0);
    gl.uniform1i(glHandle.render.minmax, 1);
    
    drawQuad(gl, glHandle.render.program);
}

/**
 * @param {Level} level 
 * @param {HTMLCanvasElement} canvas2D 
 * @param {CanvasRenderingContext2D} ctx
 * @param {[number, number]} xRange 
 * @param {[number, number]} vRange 
 * @param {Float64Array} timeArray The array of times. Needs to be sorted and evenly spaced.
 * @param {Float64Array} posArray The array of positions. Each index is corresponding to the time with the same index in tArray.
 */
function renderCanvas(level, canvas2D, ctx, xRange, vRange, timeArray, posArray) {
    // draw grid lines
    const [xMin, xMax] = xRange;
    const [vMin, vMax] = vRange;

    const width = canvas2D.width;
    const height = canvas2D.height;

    // ---------- Binary search helper ----------
    function findSpacing(range) {
        const target = range / 40;
        let lo = 0, hi = GRID_SPACINGS.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (GRID_SPACINGS[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return GRID_SPACINGS[lo];
    }

    const xSpacing = findSpacing(xMax - xMin);
    const vSpacing = findSpacing(vMax - vMin);

    const xMajor = 5 * xSpacing;
    const vMajor = 5 * vSpacing;

    // Coordinate transforms into pixels on canvas
    const xToPx = x => (x - xMin) / (xMax - xMin) * width;
    const yToPx = v => height - (v - vMin) / (vMax - vMin) * height;  // invert y axis

    ctx.clearRect(0, 0, width, height);

    // Helper functions for drawing gridlines
    function drawLines(start, end, spacing, majorSpacing, isVertical) {
        const first = Math.ceil(start / spacing) * spacing;

        for (let value = first; value <= end; value += spacing) {
            const isMajor = Math.abs(value / majorSpacing - Math.round(value / majorSpacing)) < 1e-9;
            const isAxis = Math.abs(value) < 1e-9;

            ctx.beginPath();
            // 2.0 for x and y axes, 1.0 for major gridlines, 0.5 for minor gridlines.
            ctx.lineWidth = isAxis ? 2.0 : (isMajor ? 1.0 : 0.5);
            ctx.strokeStyle = "#c9d19a";

            if (isVertical) {
                const x = xToPx(value);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            } else {
                const y = yToPx(value);
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }

            ctx.stroke();

            if(isAxis) {
                // draw a small arrow tip on the end of the axis
                ctx.save();
                ctx.translate(isVertical ? xToPx(value) : width, isVertical ? 0 : yToPx(value));
                ctx.rotate(isVertical ? -Math.PI / 2 : 0);
                ctx.fillStyle = "#c9d19a";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-8, -4);
                ctx.lineTo(-8, 4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // Draw grids
    drawLines(xMin, xMax, xSpacing, xMajor, true);   // vertical
    drawLines(vMin, vMax, vSpacing, vMajor, false);  // horizontal

    // Draw and label two vertical lines on the canvas at x=level.startX and x=level.endX
    if (level.startX !== undefined && level.endX !== undefined && level.startT !== undefined && level.endT !== undefined) {
        ctx.lineWidth = 2.0;

        // Draw line at startX
        ctx.strokeStyle = "#00dcec";
        const startXPx = xToPx(level.startX);
        ctx.beginPath();
        ctx.moveTo(startXPx, 0);
        ctx.lineTo(startXPx, height);
        ctx.stroke();

        // Draw line at endX
        ctx.strokeStyle = "#5eec00";
        const endXPx = xToPx(level.endX);
        ctx.beginPath();
        ctx.moveTo(endXPx, 0);
        ctx.lineTo(endXPx, height);
        ctx.stroke();

        // Label the lines
        ctx.font = "16px monospace";
        ctx.textAlign = "start";
        const lineHeight = 25;
        let curY = 20;
        const textStart = startXPx + 10;
        const textEnd = endXPx + 10;
        ctx.fillStyle = "#00dcec";
        ctx.fillText("START", textStart, curY);
        ctx.fillStyle = "#5eec00";
        ctx.fillText("END", textEnd, curY);
        curY += lineHeight;
        ctx.fillStyle = "#00dcec";
        ctx.fillText("x = " + level.startX.toPrecision(3), textStart, curY);
        ctx.fillStyle = "#5eec00";
        ctx.fillText("x = " + level.endX.toPrecision(3), textEnd, curY);
        curY += lineHeight;
        ctx.fillStyle = "#00dcec";
        ctx.fillText("t = " + level.startT.toPrecision(3), textStart, curY);
        ctx.fillStyle = "#5eec00";
        ctx.fillText("t = " + level.endT.toPrecision(3), textEnd, curY);
    }

    // draw path
    // Compute velocity array using numerical differentiation
    const velocity = new Float64Array(posArray.length);
    for (let i = 0; i < posArray.length; i++) {
        if (i === 0) {
            // Forward difference for first point
            velocity[i] = (posArray[1] - posArray[0]) / (timeArray[1] - timeArray[0]);
        } else if (i === posArray.length - 1) {
            // Backward difference for last point
            velocity[i] = (posArray[i] - posArray[i - 1]) / (timeArray[i] - timeArray[i - 1]);
        } else {
            // Central difference for interior points
            velocity[i] = (posArray[i + 1] - posArray[i - 1]) / (timeArray[i + 1] - timeArray[i - 1]);
        }
    }

    // Draw the trajectory path
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(xToPx(posArray[0]), yToPx(velocity[0]));
    for (let i = 1; i < posArray.length; i++) {
        ctx.lineTo(xToPx(posArray[i]), yToPx(velocity[i]));
    }
    ctx.stroke();
    // Draw dots at each position and velocity pair
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    for (let i = 0; i < posArray.length; i++) {
        const x = xToPx(posArray[i]);
        const y = yToPx(velocity[i]);
        ctx.moveTo(x + 3, y);
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
    }
    ctx.fill();
}
