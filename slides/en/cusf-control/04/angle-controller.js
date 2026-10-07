const TAU = 2 * Math.PI;

function wrapAngle(angle) {
	return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

/**
 * Angle feedback controller for a pendulum.
 *
 * kd and ki default to zero, so supplying only kp creates a proportional
 * controller. The integral value is part of this controller instance and is
 * shared by the pendulum simulation and every point in the state-space field.
 */
export function createAngleController({
	target = 0,
	kp = 0,
	kd = 0,
	ki = 0,
	integralLimit = 10,
	gravity = 9.81,
	length = 1,
	mass = 1,
} = {}) {
	const momentOfInertia = mass * length * length;
	let currentTarget = target;
	let currentKp = kp;
	let currentKd = kd;
	let currentKi = ki;
	let integral = 0;

	function error(angle) {
		return wrapAngle(currentTarget - angle);
	}

	function torque(angle, velocity = 0) {
		return currentKp * error(angle) - currentKd * velocity + currentKi * integral;
	}

	function control(angle, dt = 0, velocity = 0) {
		if (dt > 0) {
			integral = Math.max(
				-integralLimit,
				Math.min(integralLimit, integral + error(angle) * dt),
			);
		}
		return torque(angle, velocity);
	}

	function derivative(theta, velocity) {
		// Math.sin(Math.PI) is not exactly zero; preserve exact equilibria.
		const sine = theta % Math.PI === 0 ? 0 : Math.sin(theta);
		return [
			velocity,
			-gravity / length * sine + torque(theta, velocity) / momentOfInertia,
		];
	}

	return {
		control,
		torque,
		derivative,
		setTarget(value) {
			currentTarget = value;
		},
		setGains({
			kp: nextKp = currentKp,
			kd: nextKd = currentKd,
			ki: nextKi = currentKi,
		} = {}) {
			currentKp = nextKp;
			currentKd = nextKd;
			currentKi = nextKi;
		},
		getTarget() {
			return currentTarget;
		},
		getGains() {
			return { kp: currentKp, kd: currentKd, ki: currentKi };
		},
		getIntegral() {
			return integral;
		},
		resetIntegral() {
			integral = 0;
		},
	};
}
