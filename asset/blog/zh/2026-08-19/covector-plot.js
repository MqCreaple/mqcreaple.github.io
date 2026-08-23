// Interactive vector & covector plot for the "对偶向量的几何表示" section.
//
// A vector v = (vx, vy) is drawn as an arrow from the origin; the covector
// f(x, y) = a*x + b*y is drawn as its level sets (parallel straight lines),
// each labeled with the level value. Four sliders adjust the vector
// components (vx, vy) and the covector coefficients (a, b).
export default async function (Plotly, canvas, helpers) {
    const { addControlWidget, getControlValue, onControlChange } = helpers;

    addControlWidget({ type: 'range', id: 'vx', label: 'vx', min: -3, max: 3, step: 0.1, value: 1.5 });
    addControlWidget({ type: 'range', id: 'vy', label: 'vy', min: -3, max: 3, step: 0.1, value: 0.5 });
    addControlWidget({ type: 'range', id: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: 1 });
    addControlWidget({ type: 'range', id: 'b', label: 'b', min: -2, max: 2, step: 0.1, value: -0.5 });

    const STEP = 0.5;    // spacing between contour levels
    const MIN_MAX = 2.0; // smallest symmetric level range (keeps the default look)
    const RATIO = 1.8;   // contour segment length relative to |v|
    const X_RANGE = [-6, 6];
    const Y_RANGE = [-3, 3];

    // Formats a number with one decimal.
    const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);

    function build() {
        const vx = getControlValue('vx') ?? 1.5;
        const vy = getControlValue('vy') ?? 0.5;
        const a = getControlValue('a') ?? 1;
        const b = getControlValue('b') ?? -0.5;
        const c = helpers.themeColors;

        const Lv = Math.hypot(vx, vy) || 1;
        const normGrad = Math.hypot(a, b);
        const fv = a * vx + b * vy;

        // Level-set segments: a*x + b*y = c, centered on the origin and
        // running perpendicular to the gradient (a, b). The level range is
        // computed dynamically: it stays symmetric around 0 and always
        // extends one level past the vector tip, so f(v) can be read off
        // the labeled lines.
        const maxAbs = Math.max(
            MIN_MAX,
            (Math.floor(Math.abs(fv) / STEP) + 1) * STEP,
        );
        const count = Math.round(maxAbs / STEP); // lines on each side (incl. 0)
        const cx = [];
        const cy = [];
        const labels = [];
        if (normGrad > 0) {
            const dirX = -b / normGrad;
            const dirY = a / normGrad;
            const lineLen = RATIO * Lv;
            for (let k = -count; k <= count; k++) {
                const val = k * STEP;
                const scale = val / (normGrad * normGrad);
                const p0x = scale * a;
                const p0y = scale * b;
                const sx = p0x - (lineLen / 2) * dirX;
                const sy = p0y - (lineLen / 2) * dirY;
                const ex = p0x + (lineLen / 2) * dirX;
                const ey = p0y + (lineLen / 2) * dirY;
                cx.push(sx, ex, null);
                cy.push(sy, ey, null);
                labels.push({ x: ex, y: ey, text: val.toFixed(1) });
            }
        }

        const data = [
            {
                x: cx, y: cy, mode: 'lines',
                line: { color: c.accentStrong, width: 1.5 },
                name: `f = (${fmt(a)}, ${fmt(b)})`,
                showlegend: true,
                hoverinfo: 'skip',
            },
            {
                // Legend swatch for the vector; the arrow itself is drawn as
                // an annotation below.
                x: [0], y: [0], mode: 'lines',
                line: { color: c.accent, width: 2.5 },
                marker: { color: c.accent, size: 0.1, opacity: 0 },
                name: `v = (${fmt(vx)}, ${fmt(vy)})`,
                showlegend: true,
                hoverinfo: 'skip',
            },
        ];

        const layout = {
            title: { text: `向量与协向量：f(v)=a·vx+b·vy=${fv.toFixed(2)}` },
            margin: { t: 80, r: 20, b: 40, l: 50 },
            paper_bgcolor: c.surface,
            plot_bgcolor: c.surface,
            font: { family: 'Verdana, "Microsoft YaHei", sans-serif', color: c.text },
            xaxis: {
                range: X_RANGE,
                gridcolor: c.border,
                zeroline: true, zerolinecolor: c.border,
            },
            yaxis: {
                range: Y_RANGE,
                scaleanchor: 'x', scaleratio: 1, constrain: 'domain',
                gridcolor: c.border,
                zeroline: true, zerolinecolor: c.border,
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                xanchor: 'left',
                yanchor: 'top',
                bordercolor: helpers.themeColors.border,
                borderwidth: 1,
                font: { size: 12 },
            },
            annotations: [
                {
                    x: vx, y: vy, ax: 0, ay: 0,
                    axref: 'x', ayref: 'y', // arrow tail at the origin (data coords)
                    showarrow: true, arrowhead: 2, arrowsize: 1.2,
                    arrowwidth: 2.5, arrowcolor: c.accent,
                    hovertext: `v = (${fmt(vx)}, ${fmt(vy)})<br>f(v) = ${fv.toFixed(2)}`,
                    hoverlabel: { bgcolor: c.surface },
                },
                ...labels.map((l) => ({
                    x: l.x, y: l.y, text: l.text, showarrow: false,
                    font: { color: c.accentStrong, size: 10 },
                    bgcolor: c.surface, opacity: 0.75,
                })),
            ],
        };

        return { data, layout };
    }

    const render = () => {
        const { data, layout } = build();
        Plotly.react(canvas, data, layout, { responsive: true, displaylogo: false, xaxis_fixedrange: true, yaxis_fixedrange: true });
    };

    render();
    onControlChange('vx', render);
    onControlChange('vy', render);
    onControlChange('a', render);
    onControlChange('b', render);
}