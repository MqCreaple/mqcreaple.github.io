var xRange = [-1.2, 1.2];
var yRange = [-1.2, 1.2];

/**
 * @typedef {Object} GLHandle
 * @property {{ program: WebGLProgram, min: WebGLUniformLocation, max: WebGLUniformLocation }} compute
 * @property {{ program: WebGLProgram, input: WebGLUniformLocation, texel: WebGLUniformLocation }} reduce
 * @property {{ program: WebGLProgram, tex: WebGLUniformLocation, minmax: WebGLUniformLocation }} render
 * @property {WebGLTexture} texture
 * @property {WebGLFramebuffer} fbo
 */

/**
 * Handle wheel event on canvas.
 * @param {WheelEvent} event
 * @param {Level} level
 * @param {HTMLCanvasElement} canvasGL
 * @param {WebGLRenderingContext} gl
 * @param {GLHandle} glHandle
 * @param {HTMLCanvasElement} canvas2D 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Float64Array} timeArray 
 * @param {Float64Array} posArray 
 */
function handleCanvasWheelEvent(event, level, canvasGL, gl, glHandle, canvas2D, ctx, timeArray, posArray) {
    event.preventDefault();
    /** @type {HTMLCanvasElement} */
    const rect = canvasGL.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
        return;
    }

    const scrollX = event.clientX - rect.left;
    const scrollY = event.clientY - rect.top;
    const normalizedX = (scrollX / rect.width) * (xRange[1] - xRange[0]) + xRange[0];
    const normalizedY = (1 - scrollY / rect.height) * (yRange[1] - yRange[0]) + yRange[0];  // invert y axis

    const xLeft = normalizedX - xRange[0];
    const xRight = xRange[1] - normalizedX;
    const yLeft = normalizedY - yRange[0];
    const yRight = yRange[1] - normalizedY;
    
    const zoomFactor = Math.exp(event.deltaY * 0.001);
    // console.log(`Old xRange = ${xRange}, yRange = ${yRange}; Zoom factor = ${zoomFactor}`);
    if(!event.shiftKey) {
        xRange = [normalizedX - xLeft * zoomFactor, normalizedX + xRight * zoomFactor];
    }
    if(!event.ctrlKey) {
        yRange = [normalizedY - yLeft * zoomFactor, normalizedY + yRight * zoomFactor];
    }
    // console.log(`New xRange = ${xRange}, yRange = ${yRange}`);

    renderGL(level, canvasGL, gl, glHandle, xRange, yRange);
    renderCanvas(level, canvas2D, ctx, xRange, yRange, timeArray, posArray);
}

/**
 * @param {Level} level 
 * @param {HTMLElement} inputArea 
 * @param {HTMLCanvasElement} canvas2D 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Float64Array} timeArray 
 * @param {Float64Array} posArray 
 * @param {HTMLSpanElement | undefined} actionElement 
 */
function addInputMouseHandler(level, inputArea, canvas2D, ctx, timeArray, posArray, actionElement) {
    const N = posArray.length;
    /** @type {[number, number] | undefined} */
    let lastDraggedPoint = undefined;    // the last dragged point (i, xval)

    let inputAreaDrag = inputArea.querySelector("rect.nsewdrag");
    inputAreaDrag.addEventListener("pointermove", e => {
        if (lastDraggedPoint === undefined) return;

        const rect = inputAreaDrag.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        const tVal = inputArea._fullLayout.xaxis.p2c
            ? inputArea._fullLayout.xaxis.p2c(px)
            : inputArea._fullLayout.xaxis.p2l(px);

        const xVal = inputArea._fullLayout.yaxis.p2c
            ? inputArea._fullLayout.yaxis.p2c(py)
            : inputArea._fullLayout.yaxis.p2l(py);

        updateFunction(tVal, xVal);
        renderCanvas(level, canvas2D, ctx, xRange, yRange, timeArray, posArray, actionElement);
    });

    function updateFunction(tVal, xVal) {
        const i = Math.round(
            (tVal - level.startT) / (level.endT - level.startT) * (N - 1)
        );
        if (i <= 0 || i >= N - 1) return;  // make the two end points fixed

        posArray[i] = xVal;
        let [lastI, lastVal] = lastDraggedPoint;
        if(lastI !== undefined && lastVal !== undefined) {
            //  filling in the interpolated x values for each integer index between lastI and i
            // since the order of lastI and i are not specified, find the starting and ending indices first
            const startIdx = Math.min(lastI, i);
            const endIdx = Math.max(lastI, i);
            for (let j = startIdx + 1; j < endIdx; j++) {
                posArray[j] = lastVal + (xVal - lastVal) * (j - lastI) / (i - lastI);
            }
        }

        Plotly.restyle(inputArea, { y: [posArray] }, [0]);
        lastDraggedPoint = [i, xVal];
    }

    inputAreaDrag.addEventListener("pointerdown", e => {
        e.preventDefault();
        lastDraggedPoint = [];
    });
    window.addEventListener("pointerup", () => lastDraggedPoint = undefined);
}
