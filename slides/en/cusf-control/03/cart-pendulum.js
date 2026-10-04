/**
 * Interactive pendulum on a cart.
 *
 * The cart is drawn at a fixed canvas position. Its physical position x drives
 * the horizontal motion of the ground pattern, which is what makes the cart
 * appear to move. The pendulum follows the same angle convention and physics
 * as the simple pendulum in ../01/pendulum.js:
 * theta is measured counterclockwise from the downward vertical.
 *
 * When compareLinear is true, a second cart is drawn to show the evolution of
 * the linearised system around the inverted equilibrium. The ground remains
 * attached to the nonlinear simulation, so the linearised cart can drift away
 * from the centre of the canvas.
 */
export function createCartPendulum(canvas, {
	angle = Math.PI,
	velocity = 0,
	gravity = 9.81,
	length = 1,
	mass = 1,
	cartMass = 1,
	dragGain = 0.004,
	pixelsPerMetre = 72,
	compareLinear = false,
} = {}) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	const step = 1 / 240;

	const groundY = height * 0.78;
	const cartWidth = Math.min(width * 0.25, 96);
	const cartHeight = 30;
	const cartX = width / 2;
	const cartBottom = groundY - 7;
	const cartTop = cartBottom - cartHeight;
	const cartCenterY = (cartTop + cartBottom) / 2;
	const wheelRadius = 7;
	const rodLength = Math.min(width, height) * 0.24;
	const accent = '#1677ff';
	const arrowColor = '#d9480f';
	const nonlinearColor = '#111111';
	const linearColor = '#999999';
	const resetButton = {
		x: width - 104,
		y: 16,
		width: 88,
		height: 34,
	};

	let running = false;
	let frameId;
	let previousTime;
	let remainder = 0;
	let pointerId = null;
	let dragTarget = null;
	let hoverTarget = null;
	let hoverReset = false;
	let lastX = 0;
	let lastMove = 0;
	let mouseForce = 0;
	let mouseTorque = 0;
	let cartPosition = 0;
	let cartVelocity = 0;
	let theta = angle;
	let thetaVelocity = velocity;
	let linearCartPosition = 0;
	let linearCartVelocity = 0;
	let linearAngleDeviation = angle - Math.PI;
	let linearThetaVelocity = velocity;
	let destroyed = false;

	const groundMarks = createGroundMarks();

	function mod(value, modulus) {
		return ((value % modulus) + modulus) % modulus;
	}

	function createGroundMarks() {
		// A small deterministic PRNG keeps the random-looking ground stable
		// between redraws while still varying the dash positions.
		let state = 0x6d2b79f5;
		const random = () => {
			state += 0x6d2b79f5;
			let value = state;
			value = Math.imul(value ^ value >>> 15, value | 1);
			value ^= value + Math.imul(value ^ value >>> 7, value | 61);
			return ((value ^ value >>> 14) >>> 0) / 4294967296;
		};
		return Array.from({ length: 7 }, () => {
			const dash = 10 + random() * 22;
			const gap = 8 + random() * 20;
			return {
				y: groundY + 14 + random() * Math.max(12, height - groundY - 28),
				dash,
				gap,
				phase: random() * (dash + gap),
			};
		});
	}

	function accelerations(currentTheta, currentThetaVelocity, force, torque) {
		// Math.sin(Math.PI) is not exactly zero; preserve exact equilibria.
		const sine = currentTheta % Math.PI === 0 ? 0 : Math.sin(currentTheta);
		const cosine = Math.cos(currentTheta);
		const denominator = cartMass + mass * sine * sine;
		const cartAcceleration = (
			force +
			mass * length * currentThetaVelocity * currentThetaVelocity * sine +
			mass * gravity * sine * cosine -
			torque * cosine / length
		) / denominator;
		const thetaAcceleration = (
			(cartMass + mass) * (torque - mass * gravity * length * sine) -
			mass * length * force * cosine -
			mass * mass * length * length * sine * cosine *
				currentThetaVelocity * currentThetaVelocity
		) / (mass * length * length * denominator);
		return { cartAcceleration, thetaAcceleration };
	}

	function derivatives(state, force, torque) {
		const [, positionVelocity, currentTheta, currentThetaVelocity] = state;
		const acceleration = accelerations(
			currentTheta,
			currentThetaVelocity,
			force,
			torque,
		);
		return [
			positionVelocity,
			acceleration.cartAcceleration,
			currentThetaVelocity,
			acceleration.thetaAcceleration,
		];
	}

	function linearDerivatives(state, force, torque) {
		const [, positionVelocity, angleDeviation, angularVelocity] = state;
		const totalMass = cartMass + mass;
		const cartAcceleration =
			mass * gravity / cartMass * angleDeviation +
			force / cartMass +
			torque / (cartMass * length);
		const thetaAcceleration =
			totalMass * gravity / (cartMass * length) * angleDeviation +
			force / (cartMass * length) +
			totalMass * torque / (cartMass * mass * length * length);
		return [
			positionVelocity,
			cartAcceleration,
			angularVelocity,
			thetaAcceleration,
		];
	}

	function addScaled(state, derivative, scale) {
		return state.map((value, index) => value + scale * derivative[index]);
	}

	function integrate(state, derivative, dt) {
		const k1 = derivative(state);
		const k2 = derivative(addScaled(state, k1, dt / 2));
		const k3 = derivative(addScaled(state, k2, dt / 2));
		const k4 = derivative(addScaled(state, k3, dt));
		return state.map((value, index) =>
			value + dt / 6 * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index])
		);
	}

	function integrateStep(dt) {
		const nonlinearState = [cartPosition, cartVelocity, theta, thetaVelocity];
		const nextNonlinearState = integrate(
			nonlinearState,
			state => derivatives(state, mouseForce, mouseTorque),
			dt,
		);
		[cartPosition, cartVelocity, theta, thetaVelocity] = nextNonlinearState;

		if (compareLinear) {
			const linearState = [
				linearCartPosition,
				linearCartVelocity,
				linearAngleDeviation,
				linearThetaVelocity,
			];
			const nextLinearState = integrate(
				linearState,
				state => linearDerivatives(state, mouseForce, mouseTorque),
				dt,
			);
			[
				linearCartPosition,
				linearCartVelocity,
				linearAngleDeviation,
				linearThetaVelocity,
			] = nextLinearState;
		}
	}

	function prepareCanvas() {
		// Keep drawing coordinates stable on high-DPI displays and scaled slides.
		const ratio = window.devicePixelRatio || 1;
		const targetWidth = Math.round(width * ratio);
		const targetHeight = Math.round(height * ratio);
		if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
			canvas.width = targetWidth;
			canvas.height = targetHeight;
		}
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	function drawGround() {
		ctx.save();
		ctx.lineCap = 'butt';
		ctx.strokeStyle = nonlinearColor;
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.moveTo(-width, groundY);
		ctx.lineTo(width * 2, groundY);
		ctx.stroke();

		// The ground pattern follows the nonlinear simulation only.
		const groundOffset = -cartPosition * pixelsPerMetre;
		for (const mark of groundMarks) {
			const period = mark.dash + mark.gap;
			ctx.strokeStyle = '#777777';
			ctx.lineWidth = 2.5;
			ctx.setLineDash([mark.dash, mark.gap]);
			ctx.lineDashOffset = mod(-groundOffset + mark.phase, period);
			ctx.beginPath();
			ctx.moveTo(-width, mark.y);
			ctx.lineTo(width * 2, mark.y);
			ctx.stroke();
		}
		ctx.restore();
	}

	function drawPendulum(selected, screenX, currentTheta, color) {
		const pivotX = screenX;
		const pivotY = cartTop;
		const bobX = pivotX + rodLength * Math.sin(currentTheta);
		const bobY = pivotY + rodLength * Math.cos(currentTheta);
		const strokeColor = selected ? accent : color;

		ctx.save();
		ctx.strokeStyle = strokeColor;
		ctx.fillStyle = strokeColor;
		ctx.lineCap = 'round';
		ctx.lineWidth = selected ? 5 : 3;
		if (selected) {
			ctx.shadowColor = accent;
			ctx.shadowBlur = 12;
		}

		// The rod is attached directly to the middle of the cart's top edge.
		ctx.beginPath();
		ctx.moveTo(pivotX, pivotY);
		ctx.lineTo(bobX, bobY);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(pivotX, pivotY, selected ? 6 : 5, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(bobX, bobY, selected ? 14 : 13, 0, 2 * Math.PI);
		ctx.fill();
		ctx.restore();
	}

	function drawCart(selected, screenX, color) {
		const bodyLeft = screenX - cartWidth / 2;
		const wheelY = groundY - wheelRadius;
		const strokeColor = selected ? accent : color;
		ctx.save();
		if (selected) {
			ctx.shadowColor = accent;
			ctx.shadowBlur = 12;
		}
		ctx.fillStyle = selected ? '#e7f2ff' : color === linearColor ? '#f7f7f7' : '#f2f2f2';
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = selected ? 4 : 3;
		ctx.fillRect(bodyLeft, cartTop, cartWidth, cartHeight);
		ctx.strokeRect(bodyLeft, cartTop, cartWidth, cartHeight);

		ctx.fillStyle = strokeColor;
		for (const wheelX of [screenX - cartWidth * 0.28, screenX + cartWidth * 0.28]) {
			ctx.beginPath();
			ctx.arc(wheelX, wheelY, wheelRadius, 0, 2 * Math.PI);
			ctx.fill();
		}
		ctx.restore();
	}

	function drawArrow(x1, y1, x2, y2) {
		const angle = Math.atan2(y2 - y1, x2 - x1);
		const headLength = 11;
		ctx.save();
		ctx.strokeStyle = arrowColor;
		ctx.fillStyle = arrowColor;
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(
			x2 - headLength * Math.cos(angle - 0.45),
			y2 - headLength * Math.sin(angle - 0.45),
		);
		ctx.lineTo(
			x2 - headLength * Math.cos(angle + 0.45),
			y2 - headLength * Math.sin(angle + 0.45),
		);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function drawForceArrow(force) {
		if (Math.abs(force) < 0.01) return;
		const direction = Math.sign(force);
		const startX = cartX + direction * cartWidth / 2;
		const length = 20 + Math.min(Math.abs(force) * 1.8, 72);
		drawArrow(startX, cartCenterY, startX + direction * length, cartCenterY);
	}

	function drawTorqueArrow(torque) {
		if (Math.abs(torque) < 0.01) return;
		const direction = -Math.sign(torque);
		const radius = 46;
		const start = Math.PI / 2 - theta - direction * 0.4;
		const end = start + direction * (0.5 + Math.min(Math.abs(torque) / 8, 1.5));
		const pivotX = cartX;
		const pivotY = cartTop;
		const tipX = pivotX + radius * Math.cos(end);
		const tipY = pivotY + radius * Math.sin(end);
		const tangent = end + direction * Math.PI / 2;

		ctx.save();
		ctx.strokeStyle = arrowColor;
		ctx.fillStyle = arrowColor;
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.arc(pivotX, pivotY, radius, start, end, direction < 0);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(tipX, tipY);
		ctx.lineTo(tipX - 11 * Math.cos(tangent - 0.45), tipY - 11 * Math.sin(tangent - 0.45));
		ctx.lineTo(tipX - 11 * Math.cos(tangent + 0.45), tipY - 11 * Math.sin(tangent + 0.45));
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function pointInResetButton(point) {
		return compareLinear &&
			point.x >= resetButton.x &&
			point.x <= resetButton.x + resetButton.width &&
			point.y >= resetButton.y &&
			point.y <= resetButton.y + resetButton.height;
	}

	function resetSimulations() {
		cartPosition = 0;
		cartVelocity = 0;
		theta = angle;
		thetaVelocity = velocity;
		linearCartPosition = 0;
		linearCartVelocity = 0;
		linearAngleDeviation = angle - Math.PI;
		linearThetaVelocity = velocity;
		mouseForce = 0;
		mouseTorque = 0;
		remainder = 0;
		previousTime = undefined;
		draw();
	}

	function drawResetButton() {
		if (!compareLinear) return;
		ctx.save();
		ctx.fillStyle = hoverReset ? '#e7f2ff' : '#ffffff';
		ctx.strokeStyle = hoverReset ? accent : nonlinearColor;
		ctx.lineWidth = hoverReset ? 3 : 2;
		ctx.fillRect(resetButton.x, resetButton.y, resetButton.width, resetButton.height);
		ctx.strokeRect(resetButton.x, resetButton.y, resetButton.width, resetButton.height);
		ctx.fillStyle = hoverReset ? accent : nonlinearColor;
		ctx.font = '600 16px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			'Reset',
			resetButton.x + resetButton.width / 2,
			resetButton.y + resetButton.height / 2,
		);
		ctx.restore();
	}

	function selectedTarget() {
		return dragTarget ?? hoverTarget;
	}

	function draw() {
		prepareCanvas();
		ctx.clearRect(0, 0, width, height);
		drawGround();
		const selected = selectedTarget();

		if (compareLinear) {
			const linearScreenX = cartX + (linearCartPosition - cartPosition) * pixelsPerMetre;
			drawCart(false, linearScreenX, linearColor);
			drawPendulum(false, linearScreenX, Math.PI + linearAngleDeviation, linearColor);
		}

		drawCart(selected === 'cart', cartX, nonlinearColor);
		drawPendulum(selected === 'pendulum', cartX, theta, nonlinearColor);
		if (dragTarget === 'cart') drawForceArrow(mouseForce);
		if (dragTarget === 'pendulum') drawTorqueArrow(mouseTorque);
		drawResetButton();
	}

	function frame(time) {
		if (!running) return;
		if (previousTime !== undefined) remainder += Math.min((time - previousTime) / 1000, 0.05);
		previousTime = time;
		// Pointer events stop when the mouse rests, even with the button held.
		if (time - lastMove > 80) {
			mouseForce = 0;
			mouseTorque = 0;
		}
		while (remainder >= step) {
			integrateStep(step);
			remainder -= step;
		}
		draw();
		frameId = requestAnimationFrame(frame);
	}

	function canvasPoint(event) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (event.clientX - rect.left) * width / rect.width,
			y: (event.clientY - rect.top) * height / rect.height,
		};
	}

	function targetAt(point) {
		return point.y >= cartCenterY ? 'cart' : 'pendulum';
	}

	function pointerDown(event) {
		if (!running || pointerId !== null || event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		const point = canvasPoint(event);
		if (pointInResetButton(point)) {
			resetSimulations();
			draw();
			return;
		}
		const target = targetAt(point);
		pointerId = event.pointerId;
		dragTarget = target;
		hoverTarget = target;
		lastX = point.x;
		lastMove = performance.now();
		mouseForce = 0;
		mouseTorque = 0;
		canvas.setPointerCapture(pointerId);
		canvas.style.cursor = 'grabbing';
		draw();
	}

	function pointerMove(event) {
		if (pointerId !== null && event.pointerId === pointerId) {
			event.preventDefault();
			event.stopPropagation();
			const point = canvasPoint(event);
			const now = performance.now();
			const elapsed = Math.max((now - lastMove) / 1000, 0.001);
			const dragInput = dragGain * (point.x - lastX) / elapsed;
			if (dragTarget === 'cart') mouseForce = dragInput;
			if (dragTarget === 'pendulum') mouseTorque = dragInput;
			lastX = point.x;
			lastMove = now;
			return;
		}

		if (!running) return;
		const point = canvasPoint(event);
		const overReset = pointInResetButton(point);
		const nextTarget = overReset ? null : targetAt(point);
		const changed = overReset !== hoverReset || nextTarget !== hoverTarget;
		hoverReset = overReset;
		hoverTarget = nextTarget;
		canvas.style.cursor = overReset ? 'pointer' : 'grab';
		if (changed) draw();
	}

	function releasePointer() {
		const capturedPointer = pointerId;
		pointerId = null;
		dragTarget = null;
		mouseForce = 0;
		mouseTorque = 0;
		canvas.style.cursor = hoverReset ? 'pointer' : 'grab';
		if (capturedPointer !== null && canvas.hasPointerCapture(capturedPointer)) {
			canvas.releasePointerCapture(capturedPointer);
		}
	}

	function pointerUp(event) {
		if (event.pointerId === pointerId) releasePointer();
	}

	function pointerLeave() {
		if (pointerId === null) {
			hoverTarget = null;
			hoverReset = false;
			canvas.style.cursor = 'grab';
			draw();
		}
	}

	function setRunning(value) {
		if (destroyed || running === value) return;
		running = value;
		previousTime = undefined;
		remainder = 0;
		if (running) frameId = requestAnimationFrame(frame);
		else {
			cancelAnimationFrame(frameId);
			releasePointer();
			draw();
		}
	}

	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.addEventListener('pointerdown', pointerDown);
	canvas.addEventListener('pointermove', pointerMove);
	canvas.addEventListener('pointerup', pointerUp);
	canvas.addEventListener('pointercancel', pointerUp);
	canvas.addEventListener('pointerleave', pointerLeave);
	canvas.addEventListener('lostpointercapture', pointerUp);
	window.addEventListener('blur', releasePointer);
	draw();

	return {
		setRunning,
		reset: resetSimulations,
		destroy() {
			setRunning(false);
			destroyed = true;
			canvas.removeEventListener('pointerdown', pointerDown);
			canvas.removeEventListener('pointermove', pointerMove);
			canvas.removeEventListener('pointerup', pointerUp);
			canvas.removeEventListener('pointercancel', pointerUp);
			canvas.removeEventListener('pointerleave', pointerLeave);
			canvas.removeEventListener('lostpointercapture', pointerUp);
			window.removeEventListener('blur', releasePointer);
		},
	};
}