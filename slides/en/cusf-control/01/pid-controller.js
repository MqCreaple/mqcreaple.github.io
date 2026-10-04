/** PID feedback from angle alone, with gains for the default 1 kg, 1 m pendulum. */
export function createPIDController({
	target = Math.PI,
	kp = 45,
	ki = 12,
	kd = 12,
	integralLimit = 2,
} = {}) {
	let integral = 0;
	let previousError;
	const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

	return (angle, dt = 0) => {
		const error = wrap(target - angle);
		let derivative = 0;
		if (dt > 0) {
			if (previousError !== undefined) derivative = wrap(error - previousError) / dt;
			integral = Math.max(-integralLimit, Math.min(integralLimit, integral + error * dt));
			previousError = error;
		}
		return kp * error + ki * integral + kd * derivative;
	};
}
