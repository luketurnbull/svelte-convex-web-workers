import { Vector3, Object3D } from 'three';

export interface ShipMovement {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	thrust: boolean;
}

export class ShipController {
	private ship: Object3D | null = null;
	private movement: ShipMovement = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		thrust: false
	};

	// Physics properties
	private velocity = new Vector3();
	private thrustPower = 0.1;
	private drag = 0.98; // Air resistance in space (very low)
	private rotationSpeed = 0.03;
	private maxSpeed = 2.0;

	constructor(ship: Object3D) {
		this.ship = ship;
	}

	setShip(ship: Object3D) {
		this.ship = ship;
	}

	updateMovement(input: Partial<ShipMovement>) {
		this.movement = { ...this.movement, ...input };
	}

	update() {
		if (!this.ship) return;

		// Handle rotation (W/S for pitch, A/D for yaw)
		if (this.movement.forward) {
			// Pitch up - always relative to world Y axis
			this.ship.rotateOnAxis(new Vector3(1, 0, 0), this.rotationSpeed);
		}
		if (this.movement.backward) {
			// Pitch down - always relative to world Y axis
			this.ship.rotateOnAxis(new Vector3(1, 0, 0), -this.rotationSpeed);
		}
		if (this.movement.left) {
			this.ship.rotation.y += this.rotationSpeed; // Turn left
		}
		if (this.movement.right) {
			this.ship.rotation.y -= this.rotationSpeed; // Turn right
		}

		// Handle thrust (Shift key)
		if (this.movement.thrust) {
			// Apply thrust in the direction the ship is facing
			const thrustVector = new Vector3(0, 0, -this.thrustPower);
			thrustVector.applyQuaternion(this.ship.quaternion);
			this.velocity.add(thrustVector);
		}

		// Apply velocity to position
		this.ship.position.add(this.velocity);

		// Apply drag (space resistance)
		this.velocity.multiplyScalar(this.drag);

		// Clamp velocity to max speed
		if (this.velocity.length() > this.maxSpeed) {
			this.velocity.normalize().multiplyScalar(this.maxSpeed);
		}

		// Keep ship upright (prevent rolling)
		this.ship.rotation.z *= 0.9; // Dampen roll
	}

	getPosition(): Vector3 {
		return this.ship ? this.ship.position.clone() : new Vector3();
	}

	getRotation(): Vector3 {
		return this.ship
			? new Vector3(this.ship.rotation.x, this.ship.rotation.y, this.ship.rotation.z)
			: new Vector3();
	}

	getVelocity(): Vector3 {
		return this.velocity.clone();
	}

	setThrustPower(power: number) {
		this.thrustPower = power;
	}

	setMaxSpeed(speed: number) {
		this.maxSpeed = speed;
	}

	setRotationSpeed(speed: number) {
		this.rotationSpeed = speed;
	}

	// Emergency stop
	stop() {
		this.velocity.set(0, 0, 0);
	}
}
