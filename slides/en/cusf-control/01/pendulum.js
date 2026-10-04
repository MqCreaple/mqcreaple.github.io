/**
 * Angles are in radians, measured from the downward vertical towards the right.
 * Initial velocity is in radians per second.
 * control(angle, dt) returns torque in N m; mouse torque is added to it.
 * dt is the simulation step in seconds (zero for initialization). Angle-only
 * callbacks still work. Stateful controllers update once per physics step.
 * The returned setControl(fn) replaces the controller without resetting motion.
 */
export function createPendulum(canvas, {
	control = angle => 0,
	angle = Math.PI / 4,
	velocity = 0,
	gravity = 9.81,
	length = 1,
	mass = 1,
	dragGain = 0.01,
} = {}) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	const pivot = { x: width / 2, y: height / 2 };
	const rodLength = Math.min(width, height) * 0.36;
	const step = 1 / 240;
	let running = false;
	let frameId;
	let previousTime;
	let remainder = 0;
	let pointerId = null;
	let lastX = 0;
	let lastMove = 0;
	let mouseTorque = 0;
	let destroyed = false;
	let controlTorque = control(angle, 0);

	function acceleration(theta, externalTorque) {
		// Math.sin(Math.PI) is not exactly zero; preserve exact equilibria.
		const sine = theta % Math.PI === 0 ? 0 : Math.sin(theta);
		return -gravity / length * sine +
			(controlTorque + externalTorque) / (mass * length * length);
	}

	function draw(torque) {
		// Keep drawing coordinates stable on high-DPI displays and scaled slides.
		const ratio = window.devicePixelRatio || 1;
		const targetWidth = Math.round(width * ratio);
		const targetHeight = Math.round(height * ratio);
		if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
			canvas.width = targetWidth;
			canvas.height = targetHeight;
		}
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.strokeStyle = '#222';
		ctx.fillStyle = '#222';
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		const bobX = pivot.x + rodLength * Math.sin(angle);
		const bobY = pivot.y + rodLength * Math.cos(angle);
		ctx.beginPath();
		ctx.moveTo(pivot.x - 24, pivot.y);
		ctx.lineTo(pivot.x + 24, pivot.y);
		ctx.moveTo(pivot.x, pivot.y);
		ctx.lineTo(bobX, bobY);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(pivot.x, pivot.y, 5, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(bobX, bobY, 13, 0, 2 * Math.PI);
		ctx.fill();

		if (Math.abs(torque) > 0.01) {
			const direction = -Math.sign(torque);
			const radius = 42;
			const start = Math.PI / 2 - angle - direction * 0.4;
			const end = start + direction * (0.5 + Math.min(Math.abs(torque) / 8, 1.5));
			ctx.strokeStyle = '#2878b5';
			ctx.fillStyle = '#2878b5';
			ctx.beginPath();
			ctx.arc(pivot.x, pivot.y, radius, start, end, direction < 0);
			ctx.stroke();
			const tipX = pivot.x + radius * Math.cos(end);
			const tipY = pivot.y + radius * Math.sin(end);
			const tangent = end + direction * Math.PI / 2;
			ctx.beginPath();
			ctx.moveTo(tipX, tipY);
			ctx.lineTo(tipX - 10 * Math.cos(tangent - 0.45), tipY - 10 * Math.sin(tangent - 0.45));
			ctx.lineTo(tipX - 10 * Math.cos(tangent + 0.45), tipY - 10 * Math.sin(tangent + 0.45));
			ctx.closePath();
			ctx.fill();
		}
	}

	function frame(time) {
		if (!running) return;
		if (previousTime !== undefined) remainder += Math.min((time - previousTime) / 1000, 0.05);
		previousTime = time;
		// Pointer events stop when the mouse rests, even with the button held.
		if (time - lastMove > 80) mouseTorque = 0;
		while (remainder >= step) {
			// Sample feedback once and hold its torque through this physics step.
			controlTorque = control(angle, step);
			// Velocity Verlet preserves undamped oscillation with a small fixed step.
			velocity += acceleration(angle, mouseTorque) * step / 2;
			angle += velocity * step;
			velocity += acceleration(angle, mouseTorque) * step / 2;
			remainder -= step;
		}
		draw(controlTorque + mouseTorque);
		frameId = requestAnimationFrame(frame);
	}

	function pointerDown(event) {
		if (!running || pointerId !== null || event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		pointerId = event.pointerId;
		lastX = event.clientX;
		lastMove = performance.now();
		canvas.setPointerCapture(pointerId);
		canvas.style.cursor = 'grabbing';
	}

	function pointerMove(event) {
		if (event.pointerId !== pointerId) return;
		event.preventDefault();
		event.stopPropagation();
		const now = performance.now();
		const elapsed = Math.max((now - lastMove) / 1000, 0.001);
		const scale = width / canvas.getBoundingClientRect().width;
		mouseTorque = dragGain * (event.clientX - lastX) * scale / elapsed;
		lastX = event.clientX;
		lastMove = now;
	}

	function releasePointer() {
		const capturedPointer = pointerId;
		pointerId = null;
		mouseTorque = 0;
		canvas.style.cursor = 'grab';
		if (capturedPointer !== null && canvas.hasPointerCapture(capturedPointer)) {
			canvas.releasePointerCapture(capturedPointer);
		}
	}

	function pointerUp(event) {
		if (event.pointerId === pointerId) releasePointer();
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
			draw(controlTorque);
		}
	}

	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.addEventListener('pointerdown', pointerDown);
	canvas.addEventListener('pointermove', pointerMove);
	canvas.addEventListener('pointerup', pointerUp);
	canvas.addEventListener('pointercancel', pointerUp);
	canvas.addEventListener('lostpointercapture', pointerUp);
	window.addEventListener('blur', releasePointer);
	draw(controlTorque);

	return {
		setRunning,
		setControl(fn) {
			control = fn;
			controlTorque = control(angle, 0);
		},
		destroy() {
			setRunning(false);
			destroyed = true;
			canvas.removeEventListener('pointerdown', pointerDown);
			canvas.removeEventListener('pointermove', pointerMove);
			canvas.removeEventListener('pointerup', pointerUp);
			canvas.removeEventListener('pointercancel', pointerUp);
			canvas.removeEventListener('lostpointercapture', pointerUp);
			window.removeEventListener('blur', releasePointer);
		},
	};
}
