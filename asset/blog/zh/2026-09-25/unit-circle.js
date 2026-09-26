// Complex multiplication on the unit circle.
//
// Plotly draws the circle and three points. Plotly scatter points are not
// natively editable (plotly/plotly.js#7410), so a small pointer layer maps
// the drag position to an angle, snaps a and b back onto the unit circle,
// and moves ab to the product angle.

export default async function (Plotly, canvas, helpers) {
    const colors = helpers.themeColors;
    const AXIS_LIMIT = 1.45;
    const CIRCLE_STEPS = 512;

    const angles = {
        a: degreesToRadians(35),
        b: degreesToRadians(145),
    };

    const circleX = [];
    const circleY = [];
    for (let i = 0; i <= CIRCLE_STEPS; i++) {
        const theta = (i / CIRCLE_STEPS) * Math.PI * 2;
        circleX.push(Math.cos(theta));
        circleY.push(Math.sin(theta));
    }

    function pointState() {
        const a = { x: Math.cos(angles.a), y: Math.sin(angles.a) };
        const b = { x: Math.cos(angles.b), y: Math.sin(angles.b) };
        const productAngle = angles.a + angles.b;
        const ab = {
            x: Math.cos(productAngle),
            y: Math.sin(productAngle),
        };
        return { a, b, ab };
    }

    const initial = pointState();
    const data = [
        {
            x: circleX,
            y: circleY,
            mode: 'lines',
            line: { color: colors.accentStrong, width: 2 },
            hoverinfo: 'skip',
        },
        {
            x: [initial.a.x, initial.b.x, initial.ab.x],
            y: [initial.a.y, initial.b.y, initial.ab.y],
            mode: 'markers+text',
            text: ['a', 'b', 'ab'],
            textposition: 'top center',
            textfont: { color: colors.text, size: 14 },
            marker: {
                color: [colors.accent, colors.error, colors.heading],
                size: [14, 14, 11],
                line: { color: colors.surface, width: 1.5 },
            },
            hovertemplate: '<b>%{text}</b><br>Re = %{x:.3f}<br>Im = %{y:.3f}<extra></extra>',
            cliponaxis: false,
        },
    ];

    const layout = {
        margin: { t: 20, r: 24, b: 48, l: 52 },
        paper_bgcolor: colors.surface,
        plot_bgcolor: colors.surface,
        font: {
            family: 'Verdana, "Microsoft YaHei", sans-serif',
            color: colors.text,
        },
        xaxis: {
            title: { text: 'Re' },
            range: [-AXIS_LIMIT, AXIS_LIMIT],
            gridcolor: colors.border,
            zeroline: true,
            zerolinecolor: colors.border,
            fixedrange: true,
            constrain: 'domain',
        },
        yaxis: {
            title: { text: 'Im' },
            range: [-AXIS_LIMIT, AXIS_LIMIT],
            gridcolor: colors.border,
            zeroline: true,
            zerolinecolor: colors.border,
            fixedrange: true,
            scaleanchor: 'x',
            scaleratio: 1,
            constrain: 'domain',
        },
        showlegend: false,
        dragmode: false,
        annotations: [
            {
                x: 0.90,
                y: 0.85,
                text: '|z| = 1',
                showarrow: false,
                font: { color: colors.muted, size: 12 },
            },
        ],
    };

    await Plotly.react(canvas, data, layout, {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
        scrollZoom: false,
        doubleClick: false,
    });

    canvas.style.touchAction = 'none';

    function markerNodes() {
        const traces = canvas.querySelectorAll('.scatterlayer .trace');
        if (traces.length < 2) return [];
        return Array.from(traces[1].querySelectorAll('.point'));
    }

    function markerUnderPointer(event) {
        const nodes = markerNodes();
        for (let i = 0; i < Math.min(2, nodes.length); i++) {
            const rect = nodes[i].getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(14, Math.max(rect.width, rect.height) * 0.8);
            if (Math.hypot(event.clientX - centerX, event.clientY - centerY) <= radius) {
                return i;
            }
        }
        return null;
    }

    function dataPointFromPointer(event) {
        const fullLayout = canvas._fullLayout;
        const rect = canvas.getBoundingClientRect();
        const xPixel = event.clientX - rect.left - fullLayout.xaxis._offset;
        const yPixel = event.clientY - rect.top - fullLayout.yaxis._offset;
        return {
            x: fullLayout.xaxis.p2d(xPixel),
            y: fullLayout.yaxis.p2d(yPixel),
        };
    }

    let renderQueued = false;
    function requestRender() {
        if (renderQueued) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false;
            const points = pointState();
            void Plotly.restyle(
                canvas,
                {
                    x: [[points.a.x, points.b.x, points.ab.x]],
                    y: [[points.a.y, points.b.y, points.ab.y]],
                },
                [1],
            );
        });
    }

    let activePoint = null;

    canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const index = markerUnderPointer(event);
        if (index === null) return;

        activePoint = index;
        canvas.setPointerCapture?.(event.pointerId);
        canvas.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
    });

    canvas.addEventListener('pointermove', (event) => {
        if (activePoint === null) {
            const hovered = markerUnderPointer(event);
            canvas.style.cursor = hovered === null ? '' : 'grab';
            return;
        }

        const position = dataPointFromPointer(event);
        angles[activePoint === 0 ? 'a' : 'b'] = Math.atan2(position.y, position.x);
        requestRender();
        event.preventDefault();
        event.stopPropagation();
    });

    function finishDrag(event) {
        if (activePoint === null) return;
        activePoint = null;
        canvas.releasePointerCapture?.(event.pointerId);
        canvas.style.cursor = '';
        event.preventDefault();
        event.stopPropagation();
    }

    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}
