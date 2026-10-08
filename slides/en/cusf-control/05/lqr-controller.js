const DEFAULT_EQUILIBRIUM = [0, 0, Math.PI, 0];
const DEFAULT_GAINS = [-1, -2.47837907, 49.74828959, 12.35241468];

function clamp(value, limit) {
	return Math.max(-limit, Math.min(limit, value));
}

/**
 * State feedback for the linearised cart-pendulum around the upright
 * equilibrium. The callback returns a force command for the cart.
 */
export function createLQRController({
	gains = DEFAULT_GAINS,
	equilibrium = DEFAULT_EQUILIBRIUM,
	forceLimit = Infinity,
} = {}) {
	const K = [...gains];
	const xEquilibrium = [...equilibrium];

	return (state) => {
		const error = [
			state.position - xEquilibrium[0],
			state.velocity - xEquilibrium[1],
			state.angle - xEquilibrium[2],
			state.angularVelocity - xEquilibrium[3],
		];
		const force = -error.reduce(
			(total, value, index) => total + K[index] * value,
			0,
		);
		return {
			force: Number.isFinite(forceLimit) ? clamp(force, forceLimit) : force,
			torque: 0,
		};
	};
}
