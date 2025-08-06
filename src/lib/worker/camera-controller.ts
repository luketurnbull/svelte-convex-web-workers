import { PerspectiveCamera, Vector3, Object3D } from 'three';

export class ThirdPersonCamera {
	private camera: PerspectiveCamera;
	private target: Object3D | null = null;
	private offset: Vector3;
	private lookAtOffset: Vector3;
	private smoothness: number;

	constructor(camera: PerspectiveCamera, offset: Vector3 = new Vector3(0, 10, 20)) {
		this.camera = camera;
		this.offset = offset;
		this.lookAtOffset = new Vector3(0, 2, 0); // Look slightly above ship center
		this.smoothness = 0.1; // Lower = smoother
	}

	setTarget(target: Object3D) {
		this.target = target;
	}

	setOffset(offset: Vector3) {
		this.offset = offset;
	}

	setSmoothness(smoothness: number) {
		this.smoothness = Math.max(0.01, Math.min(1, smoothness));
	}

	update() {
		if (!this.target) return;

		// Calculate desired camera position
		const targetWorldPosition = new Vector3();
		this.target.getWorldPosition(targetWorldPosition);

		const desiredPosition = targetWorldPosition.clone().add(this.offset);

		// Smooth camera movement
		this.camera.position.lerp(desiredPosition, this.smoothness);

		// Look at target with offset
		const lookAtPosition = targetWorldPosition.clone().add(this.lookAtOffset);
		this.camera.lookAt(lookAtPosition);
	}

	// Camera controls for player input
	rotateAroundTarget(horizontalAngle: number, verticalAngle: number) {
		if (!this.target) return;

		const targetWorldPosition = new Vector3();
		this.target.getWorldPosition(targetWorldPosition);

		// Calculate new camera position based on angles
		const distance = this.offset.length();
		const newX = Math.sin(horizontalAngle) * Math.cos(verticalAngle) * distance;
		const newY = Math.sin(verticalAngle) * distance;
		const newZ = Math.cos(horizontalAngle) * Math.cos(verticalAngle) * distance;

		this.offset.set(newX, newY, newZ);
	}

	// Zoom camera in/out
	zoom(factor: number) {
		this.offset.multiplyScalar(factor);
		// Clamp zoom levels
		const minDistance = 5;
		const maxDistance = 50;
		const distance = this.offset.length();

		if (distance < minDistance) {
			this.offset.normalize().multiplyScalar(minDistance);
		} else if (distance > maxDistance) {
			this.offset.normalize().multiplyScalar(maxDistance);
		}
	}
}
