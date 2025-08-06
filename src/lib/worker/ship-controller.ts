import { Vector3, Object3D } from 'three';

export interface ShipMovement {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	up: boolean;
	down: boolean;
}

export class ShipController {
	private ship: Object3D | null = null;
	private movement: ShipMovement = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		up: false,
		down: false
	};
	private speed: number = 0.5;
	private rotationSpeed: number = 0.02;

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

		const deltaTime = 1 / 60; // Assuming 60fps
		const moveDistance = this.speed * deltaTime * 60;

		// Calculate movement direction
		const moveVector = new Vector3();

		if (this.movement.forward) {
			moveVector.z -= moveDistance;
		}
		if (this.movement.backward) {
			moveVector.z += moveDistance;
		}
		if (this.movement.left) {
			moveVector.x -= moveDistance;
		}
		if (this.movement.right) {
			moveVector.x += moveDistance;
		}
		if (this.movement.up) {
			moveVector.y += moveDistance;
		}
		if (this.movement.down) {
			moveVector.y -= moveDistance;
		}

		// Apply movement relative to ship's rotation
		if (moveVector.length() > 0) {
			moveVector.applyQuaternion(this.ship.quaternion);
			this.ship.position.add(moveVector);
		}

		// Add some visual feedback - slight rotation when moving
		if (this.movement.forward || this.movement.backward) {
			const rotationDirection = this.movement.forward ? 1 : -1;
			this.ship.rotation.x += rotationDirection * this.rotationSpeed;
		}

		if (this.movement.left || this.movement.right) {
			const rotationDirection = this.movement.left ? 1 : -1;
			this.ship.rotation.y += rotationDirection * this.rotationSpeed;
		}
	}

	getPosition(): Vector3 {
		return this.ship ? this.ship.position.clone() : new Vector3();
	}

	getRotation(): Vector3 {
		return this.ship ? this.ship.rotation.clone() : new Vector3();
	}

	setSpeed(speed: number) {
		this.speed = speed;
	}

	setRotationSpeed(speed: number) {
		this.rotationSpeed = speed;
	}
}
