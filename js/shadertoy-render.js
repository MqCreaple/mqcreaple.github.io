// Shadertoy渲染脚本
// 在文档加载完成后初始化
(function() {
    'use strict';

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // 检查jQuery是否可用
        if (typeof jQuery === 'undefined') {
            console.warn('shadertoy-render: jQuery is not loaded. Skipping shadertoy rendering.');
            return;
        }

        // 查找所有shadertoy图形容器
        const containers = document.querySelectorAll('div.shadertoy-figure');
        if (containers.length === 0) {
            console.log("No shadertoy source found.");
            return;
        }

        console.log(`shadertoy-render: Found ${containers.length} shadertoy figure(s)`);

        // 遍历每个容器
        containers.forEach((container, index) => {
            try {
                processContainer(container, index);
            } catch (error) {
                console.error(`shadertoy-render: Error processing container ${index}:`, error);
            }
        });
    }

    function processContainer(container, index) {
        // 1. 验证容器内容是否为纯文本
        if (!isPlainText(container)) {
            console.warn(`shadertoy-render: Container ${index} contains non-text elements. Skipping.`);
            return;
        }

        // 获取原始GLSL源码
        const glslSource = container.textContent.trim();
        if (!glslSource) {
            console.warn(`shadertoy-render: Container ${index} is empty. Skipping.`);
            return;
        }

        // 清理容器内容（移除原始文本）
        $(container).empty();

        // 2. 创建可折叠的代码显示区域
        createCodeView($(container), glslSource, index);

        // 3. 创建canvas
        const canvas = createCanvas(container, index);

        // 4. 设置WebGL渲染
        setupWebGL(canvas, glslSource, index);
    }

    function isPlainText(element) {
        // 检查元素是否只包含文本节点（或空白）
        const children = element.childNodes;
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                return false;
            }
        }
        return true;
    }

    function createCodeView($container, glslSource, index) {
        // 创建代码容器
        const $codeContainer = $('<div>', {
            class: 'shadertoy-code-container'
        });

        // 创建标题栏（可点击展开/折叠）
        const $header = $('<div>', {
            class: 'shadertoy-code-header',
            html: '<i class="fa fa-code"></i> GLSL Source Code <i class="fa fa-chevron-down"></i>'
        });

        // 创建代码内容区域
        const $codeContent = $('<div>', {
            class: 'shadertoy-code-content',
            style: 'display: none;'
        });

        // 创建pre和code元素
        const $pre = $('<pre>');
        const $code = $('<code>', {
            class: 'language-glsl',
            text: glslSource
        });
        $pre.append($code);
        $codeContent.append($pre);

        // 点击标题切换显示/隐藏
        $header.on('click', function() {
            const $chevron = $(this).find('.fa');
            $chevron.last().toggleClass('fa-chevron-down fa-chevron-up');
            $codeContent.slideToggle();
        });

        // 组装
        $codeContainer.append($header, $codeContent);
        $container.append($codeContainer);

        // 触发highlight.js渲染
        if (window.hljs) {
            window.hljs.highlightElement($code[0]);
        }
    }

    function createCanvas(container, index) {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        canvas.className = 'shadertoy-canvas';
        canvas.id = `shadertoy-canvas-${index}`;

        // 获取容器宽度作为canvas宽度
        const containerWidth = container.clientWidth;
        const canvasWidth = containerWidth > 0 ? containerWidth : 640;
        const canvasHeight = Math.round(canvasWidth * 3/4);

        // 支持高DPI显示
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.round(canvasWidth);
        const displayHeight = Math.round(canvasHeight);
        const renderWidth = Math.round(canvasWidth * dpr);
        const renderHeight = Math.round(canvasHeight * dpr);

        // 设置canvas尺寸
        canvas.width = renderWidth;
        canvas.height = renderHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // 在容器最前面插入canvas
        container.insertBefore(canvas, container.firstChild);

        return canvas;
    }

    function setupWebGL(canvas, glslSource, index) {
        // 获取canvas父节点div
        const div = canvas.parentElement;

        // 获取WebGL上下文
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            console.error(`shadertoy-render: WebGL2 not supported for canvas ${index}`);
            showWebGLError(canvas);
            return null;
        }

        // 创建着色器程序
        const program = createShaderProgram(gl, glslSource);
        if (!program) {
            console.error(`shadertoy-render: Failed to create shader program for canvas ${index}`);
            return null;
        }

        // 创建顶点缓冲区（覆盖整个canvas的四边形）
        const vertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // 获取attribute和uniform位置
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
        const timeLocation = gl.getUniformLocation(program, 'iTime');
        const mouseLocation = gl.getUniformLocation(program, 'iMouse');

        // 设置视口
        gl.viewport(0, 0, canvas.width, canvas.height);

        // 状态变量
        let startTime = Date.now();
        let elapsedTime = 0.0;
        let paused = div.classList.contains("shadertoy-pause");
        // 鼠标状态
        let mouseX = 0;                    // 当前鼠标X位置（canvas坐标系）
        let mouseY = 0;                    // 当前鼠标Y位置（canvas坐标系）
        let mouseDown = false;             // 鼠标是否按下
        let mouseClickX = 0;               // 鼠标按下时的X位置
        let mouseClickY = 0;               // 鼠标按下时的Y位置
        let isMouseOverCanvas = false;     // 鼠标是否在canvas上方
        let isDragging = false;            // 是否正在拖动（左键或右键按下且鼠标在canvas内）
        let animationId = null;
        let visible = true;

        // 创建UI控件
        const controls = createControls(canvas, index,
            { paused, visible, warning: div.classList.contains("shadertoy-warning") });
        const container = canvas.parentElement;
        container.appendChild(controls);

        // 处理页面可见性变化
        function handleVisibilityChange() {
            visible = !document.hidden;
            if (!visible && animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            } else if (visible && !paused) {
                render();
            }
        }

        // 鼠标事件处理
        function updateMousePosition(event) {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            mouseX = (event.clientX - rect.left) * dpr;
            mouseY = (event.clientY - rect.top) * dpr;
            render();
        }

        function handleMouseMove(event) {
            // 如果正在拖动（按键按下且鼠标在canvas内），更新拖动状态
            if (isDragging) {
                // 持续更新鼠标位置用于拖动
                updateMousePosition(event);
            } else if (mouseDown) {
                isDragging = true;
            }
        }

        function handleMouseEnter() {
            isMouseOverCanvas = true;
            // 如果鼠标进入canvas时已有按键按下，开始拖动
            if (mouseDown) {
                isDragging = true;
            }
        }

        function handleMouseLeave() {
            isMouseOverCanvas = false;
            // 鼠标离开canvas时停止拖动
            isDragging = false;
        }

        function handleGlobalMouseDown(event) {
            mouseDown = true;
            isDragging = false;
            if (isMouseOverCanvas) {
                // 记录按下时的位置
                updateMousePosition(event);
                mouseClickX = mouseX;
                mouseClickY = mouseY;
            }
        }

        function handleGlobalMouseUp(event) {
            mouseDown = false;
            isDragging = false;
            if (isMouseOverCanvas) {
                updateMousePosition(event);
                mouseClickX = mouseX;
                mouseClickY = mouseY;
            }
        }

        // 添加事件监听器
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseenter', handleMouseEnter);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mousedown', handleGlobalMouseDown);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // 阻止canvas上的右键菜单
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            return false;
        });

        // 渲染函数
        function render() {
            if (!gl || !program) return;

            // 清除画布
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // 使用着色器程序
            gl.useProgram(program);

            // 设置顶点缓冲区
            gl.enableVertexAttribArray(positionLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            // 设置uniform变量
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            
            if (!paused) {
                let now = Date.now();
                elapsedTime += now - startTime;
                startTime = now;
                gl.uniform1f(timeLocation, elapsedTime / 1000.0);
            }
            
            // iMouse: vec4(xy: 按键按下时的位置或当前鼠标位置, zw: 左键/右键按下状态)
            gl.uniform4f(mouseLocation, mouseX, mouseY, 
                         (mouseDown ? 1.0 : -1.0) * mouseClickX, 
                         (isDragging ? -1.0 : 1.0) * mouseClickY);

            // 绘制
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // 继续动画循环
            if (!paused && visible) {
                animationId = requestAnimationFrame(render);
            }
        }

        // 控制函数
        function togglePause() {
            paused = !paused;
            const pauseBtn = document.getElementById(`shadertoy-pause-${index}`);
            if (pauseBtn) {
                pauseBtn.innerHTML = paused ? 
                    '<i class="fa fa-play"></i>' : 
                    '<i class="fa fa-pause"></i>';
            }
            if (!paused && visible) {
                // 如果从暂停恢复，更新开始时间以保持时间连续性
                document.getElementById(`shadertoy-status-${index}`).innerHTML = "正在渲染...";
                startTime = Date.now();
                render();
            } else if (paused) {
                document.getElementById(`shadertoy-status-${index}`).innerHTML = "已暂停";
            }
        }

        function resetMouse() {
            mouseX = 0;
            mouseY = 0;
            mouseClickX = 0;
            mouseClickY = 0;
            mouseDown = false;
            isMouseOverCanvas = false;
            isDragging = false;
            render();
        }

        // 绑定控件事件
        const pauseBtn = document.getElementById(`shadertoy-pause-${index}`);
        const resetBtn = document.getElementById(`shadertoy-reset-mouse-${index}`);

        if (pauseBtn) {
            pauseBtn.addEventListener('click', togglePause);
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', resetMouse);
        }

        // 开始渲染循环
        render();

        // 返回清理函数
        return function cleanup() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleGlobalMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseenter', handleMouseEnter);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            if (pauseBtn) {
                pauseBtn.removeEventListener('click', togglePause);
            }
            if (resetBtn) {
                resetBtn.removeEventListener('click', resetMouse);
            }
        };
    }

    function createShaderProgram(gl, fragmentSource) {
        // 顶点着色器源码（简单的全屏四边形）
        const vertexShaderSource = `#version 300 es
#ifdef GL_ES
precision highp float;
precision highp int;
#endif
in vec2 a_position;
out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
}`;

        // 片元着色器源码（包裹Shadertoy代码）
        const fragmentShaderSource = `#version 300 es
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
in vec2 v_texCoord;
out vec4 fragColor;

// 用户提供的Shadertoy代码
${fragmentSource}

void main() {
    // 计算当前像素坐标（Shadertoy风格）
    vec2 fragCoord = v_texCoord * iResolution;
    
    // 调用用户的mainImage函数
    mainImage(fragColor, fragCoord);
}`;

        // 编译着色器
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }

        // 创建着色器程序
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // 检查链接状态
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('shadertoy-render: Program link failed:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('shadertoy-render: Shader compile failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createControls(canvas, index, props) {
        const controls = document.createElement('div');
        controls.className = 'shadertoy-controls';
        
        controls.innerHTML = `
            <button class="shadertoy-control-btn" id="shadertoy-pause-${index}" title="暂停/继续">
                <i class="fa ${props.paused ? "fa-play" : "fa-pause"}"></i>
            </button>
            <button class="shadertoy-control-btn" id="shadertoy-reset-mouse-${index}" title="重置鼠标位置">
                <i class="fa fa-undo"></i>
            </button>
            ${props.warning ? "<span class='warn'>显卡占用警告！</span>" : ""}
            <span class="shadertoy-status" id="shadertoy-status-${index}">
                正在渲染...
            </span>
        `;

        return controls;
    }

    function showWebGLError(canvas) {
        // 在canvas位置显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'shadertoy-error';
        errorDiv.innerHTML = `
            <p><i class="fa fa-exclamation-triangle"></i> WebGL is not supported in your browser.</p>
            <p>Please try a modern browser like Chrome, Firefox, or Edge.</p>
        `;
        
        // 替换canvas
        const parent = canvas.parentElement;
        if (parent) {
            parent.replaceChild(errorDiv, canvas);
        }
    }
})();