const COLOR = {
	axis: '#000',
	field: '#000',
	state: '#2878b5',
	target: '#d62728',
};

const HISTORY_SIZE = 256;
const COLUMNS = 15;
const ROWS = 11;
const LABEL_HEIGHT = 44;
const THETA_RANGE = Math.PI;

function wrapAngle(angle) {
	return ((angle + THETA_RANGE) % (2 * THETA_RANGE) + 2 * THETA_RANGE) %
		(2 * THETA_RANGE) - THETA_RANGE;
}

export function createPendulumStateSpace(canvas, {
	getState,
	getTarget,
	getIntegral,
	derivative,
	gravity = 9.81,
	length = 1,
	velocityRange = 9,
} = {}) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	const margin = { top: 50, right: 52, bottom: 30, left: 48 };
	const plot = {
		x: margin.left,
		y: margin.top,
		width: width - margin.left - margin.right,
		height: height - margin.top - margin.bottom,
	};
	const origin = {
		x: plot.x + plot.width / 2,
		y: plot.y + plot.height / 2,
	};
	const pixelsPerTheta = plot.width / (2 * THETA_RANGE);
	const pixelsPerVelocity = plot.height / (2 * velocityRange);
	const historyTheta = new Float64Array(HISTORY_SIZE);
	const historyVelocity = new Float64Array(HISTORY_SIZE);
	const labels = {
		theta: new Image(),
		thetaDot: new Image(),
	};
	let historyHead = 0;
	let historyLength = 0;
	let running = false;
	let frameId;
	let destroyed = false;

	labels.theta.src = '../02/theta.svg';
	labels.thetaDot.src = '../02/theta-dot.svg';
	labels.theta.addEventListener('load', draw);
	labels.thetaDot.addEventListener('load', draw);

	function thetaToX(theta) {
		return origin.x + theta * pixelsPerTheta;
	}

	function velocityToY(velocity) {
		return origin.y - velocity * pixelsPerVelocity;
	}

	function evaluateDerivative(theta, velocity) {
		if (derivative !== undefined) return derivative(theta, velocity);
		return [velocity, -gravity / length * Math.sin(theta)];
	}

	function appendHistory(theta, velocity) {
		historyTheta[historyHead] = theta;
		historyVelocity[historyHead] = velocity;
		historyHead = (historyHead + 1) % HISTORY_SIZE;
		historyLength = Math.min(historyLength + 1, HISTORY_SIZE);
	}

	function drawArrow(x, y, dx, dy) {
		const vectorLength = Math.hypot(dx, dy);
		if (vectorLength < 0.5) return;

		const ux = dx / vectorLength;
		const uy = dy / vectorLength;
		const endX = x + dx;
		const endY = y + dy;
		const headLength = Math.min(6, vectorLength * 0.45);
		const headWidth = headLength * 0.55;
		const baseX = endX - ux * headLength;
		const baseY = endY - uy * headLength;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(baseX, baseY);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(endX, endY);
		ctx.lineTo(baseX - uy * headWidth, baseY + ux * headWidth);
		ctx.lineTo(baseX + uy * headWidth, baseY - ux * headWidth);
		ctx.closePath();
		ctx.fill();
	}

	function drawVectorField() {
		const cellWidth = plot.width / COLUMNS;
		const cellHeight = plot.height / ROWS;
		const vectors = [];
		let longestScreenVector = 0;

		for (let row = 0; row < ROWS; row += 1) {
			for (let column = 0; column < COLUMNS; column += 1) {
				const x = plot.x + (column + 0.5) * cellWidth;
				const y = plot.y + (row + 0.5) * cellHeight;
				const theta = (x - origin.x) / pixelsPerTheta;
				const velocity = (origin.y - y) / pixelsPerVelocity;
				const [thetaDerivative, velocityDerivative] =
					evaluateDerivative(theta, velocity);
				const dx = thetaDerivative * pixelsPerTheta;
				const dy = -velocityDerivative * pixelsPerVelocity;
				const screenLength = Math.hypot(dx, dy);
				longestScreenVector = Math.max(longestScreenVector, screenLength);
				vectors.push({ x, y, dx, dy });
			}
		}

		// Scaling by the longest vector guarantees that no arrow exceeds half a cell.
		const scale = longestScreenVector === 0
			? 0
			: 0.8 * Math.min(cellWidth, cellHeight) / longestScreenVector;

		ctx.strokeStyle = COLOR.field;
		ctx.fillStyle = COLOR.field;
		ctx.lineWidth = 1;
		ctx.lineCap = 'round';
		vectors.forEach(({ x, y, dx, dy }) => {
			drawArrow(x, y, dx * scale, dy * scale);
		});
	}

	function drawAxisArrow(x, y, dx, dy) {
		const size = 6;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x - dx * size + dy * size * 0.5, y - dy * size - dx * size * 0.5);
		ctx.lineTo(x - dx * size - dy * size * 0.5, y - dy * size + dx * size * 0.5);
		ctx.closePath();
		ctx.fill();
	}

	function drawAxes() {
		const right = plot.x + plot.width;
		const top = plot.y;

		ctx.strokeStyle = COLOR.axis;
		ctx.fillStyle = COLOR.axis;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(plot.x, origin.y);
		ctx.lineTo(right, origin.y);
		ctx.moveTo(origin.x, plot.y + plot.height);
		ctx.lineTo(origin.x, top);
		ctx.stroke();
		drawAxisArrow(right, origin.y, 1, 0);
		drawAxisArrow(origin.x, top, 0, -1);
	}

	function drawImageLabel(image, x, y, labelHeight) {
		if (!image.complete || image.naturalWidth === 0) return;
		const labelWidth = labelHeight * image.naturalWidth / image.naturalHeight;
		ctx.drawImage(image, x, y, labelWidth, labelHeight);
	}

	function drawLabels() {
		drawImageLabel(
			labels.theta,
			plot.x + plot.width + 6,
			origin.y - LABEL_HEIGHT / 2,
			LABEL_HEIGHT,
		);
		drawImageLabel(
			labels.thetaDot,
			origin.x + 7,
			plot.y - LABEL_HEIGHT,
			LABEL_HEIGHT,
		);
	}

	function drawHistory() {
		if (historyLength < 2) return;

		const start = (historyHead - historyLength + HISTORY_SIZE) % HISTORY_SIZE;
		ctx.strokeStyle = COLOR.state;
		ctx.lineWidth = 2.5;
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.beginPath();

		let previousTheta;
		for (let index = 0; index < historyLength; index += 1) {
			const historyIndex = (start + index) % HISTORY_SIZE;
			const theta = historyTheta[historyIndex];
			const x = thetaToX(theta);
			const y = velocityToY(historyVelocity[historyIndex]);

			if (
				previousTheta === undefined ||
				Math.abs(theta - previousTheta) > THETA_RANGE
			) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
			previousTheta = theta;
		}
		ctx.stroke();
	}

	function drawState() {
		const { angle, velocity } = getState();
		const x = thetaToX(wrapAngle(angle));
		const y = velocityToY(velocity);

		ctx.fillStyle = COLOR.state;
		ctx.beginPath();
		ctx.arc(x, y, 6, 0, 2 * Math.PI);
		ctx.fill();
	}

	function drawTarget() {
		if (getTarget === undefined) return;

		const x = thetaToX(wrapAngle(getTarget()));
		const y = velocityToY(0);
		ctx.strokeStyle = COLOR.target;
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, 2 * Math.PI);
		ctx.stroke();
	}

	function drawIntegral() {
		if (getIntegral === undefined) return;

		ctx.fillStyle = COLOR.state;
		ctx.font = '600 16px sans-serif';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'top';
		ctx.fillText(`Integral e dt = ${getIntegral().toFixed(3)}`, width - 10, 8);
	}

	function draw() {
		// Match the simulation canvas's device-pixel-ratio handling.
		const ratio = window.devicePixelRatio || 1;
		const targetWidth = Math.round(width * ratio);
		const targetHeight = Math.round(height * ratio);
		if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
			canvas.width = targetWidth;
			canvas.height = targetHeight;
		}
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.save();
		ctx.beginPath();
		ctx.rect(plot.x, plot.y, plot.width, plot.height);
		ctx.clip();
		drawVectorField();
		drawAxes();
		drawHistory();
		drawState();
		drawTarget();
		ctx.restore();
		drawLabels();
		drawIntegral();
	}

	function frame() {
		if (!running) return;
		const { angle, velocity } = getState();
		appendHistory(wrapAngle(angle), velocity);
		draw();
		frameId = requestAnimationFrame(frame);
	}

	function setRunning(value) {
		if (destroyed || running === value) return;
		running = value;
		if (running) frameId = requestAnimationFrame(frame);
		else cancelAnimationFrame(frameId);
	}

	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	const initialState = getState();
	appendHistory(wrapAngle(initialState.angle), initialState.velocity);
	draw();

	return {
		setRunning,
		redraw: draw,
		destroy() {
			setRunning(false);
			destroyed = true;
			labels.theta.removeEventListener('load', draw);
			labels.thetaDot.removeEventListener('load', draw);
		},
	};
}
