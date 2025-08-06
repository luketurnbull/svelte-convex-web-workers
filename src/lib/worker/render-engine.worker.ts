import { expose } from 'comlink';
import {
	Scene,
	PerspectiveCamera,
	Mesh,
	MeshLambertMaterial,
	BufferGeometry,
	Points,
	PointsMaterial,
	Vector3,
	AmbientLight,
	DirectionalLight,
	Float32BufferAttribute,
	SphereGeometry,
	MeshBasicMaterial,
	Group,
	Object3D,
	ConeGeometry
} from 'three';

import { GameRenderer } from './webgpu-renderer';
import { ThirdPersonCamera } from './camera-controller';
import { ShipController, type ShipMovement } from './ship-controller';

export interface RenderConfig {
	width: number;
	height: number;
}

export interface SceneObject {
	id: string;
	position: Vector3;
	rotation: Vector3;
	type: 'ship' | 'asteroid' | 'star';
}

export class RenderEngine {
	private scene!: Scene;
	private camera!: PerspectiveCamera;
	private renderer!: GameRenderer;
	private canvas!: OffscreenCanvas;
	private animationId: number | null = null;
	private objects = new Map<string, Object3D>();
	private cameraController!: ThirdPersonCamera;
	private shipController!: ShipController;

	async initialize(canvas: OffscreenCanvas, config: RenderConfig) {
		console.log('🚀 Initializing RenderEngine...');
		this.canvas = canvas;

		this.scene = new Scene();
		console.log('✅ Scene created');

		this.camera = new PerspectiveCamera(75, config.width / config.height, 0.1, 10000);
		console.log('✅ Camera created');

		// Use our new WebGPU renderer
		this.renderer = new GameRenderer(canvas, config.width, config.height);
		console.log('✅ Renderer created');

		// Create third-person camera controller
		this.cameraController = new ThirdPersonCamera(this.camera, new Vector3(0, 10, 20));
		console.log('✅ Camera controller created');

		await this.setupInitialScene();
		console.log('✅ Initial scene setup complete');

		this.startRenderLoop();
		console.log('✅ Render loop started');

		return {
			success: true,
			renderer: this.renderer.isWebGPUEnabled() ? 'WebGPU' : 'WebGL'
		};
	}

	private async setupInitialScene() {
		// Add some stars for atmosphere
		this.createStarField();

		// Add basic lighting
		const ambientLight = new AmbientLight(0x404040, 0.4);
		this.scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 1);
		directionalLight.position.set(100, 100, 50);
		this.scene.add(directionalLight);

		// Position camera
		this.camera.position.set(0, 50, 100);
		this.camera.lookAt(0, 0, 0);
	}

	private createStarField() {
		const starsGeometry = new BufferGeometry();
		const starsMaterial = new PointsMaterial({ color: 0xffffff, size: 2 });

		const starsVertices = [];
		for (let i = 0; i < 1000; i++) {
			const x = (Math.random() - 0.5) * 2000;
			const y = (Math.random() - 0.5) * 2000;
			const z = (Math.random() - 0.5) * 2000;
			starsVertices.push(x, y, z);
		}

		starsGeometry.setAttribute('position', new Float32BufferAttribute(starsVertices, 3));
		const starField = new Points(starsGeometry, starsMaterial);
		this.scene.add(starField);
	}

	// Handle keyboard input for ship movement
	handleShipMovement(movement: Partial<ShipMovement>) {
		if (this.shipController) {
			this.shipController.updateMovement(movement);
		}
	}

	private startRenderLoop() {
		console.log('🔄 Starting render loop...');
		let frameCount = 0;

		const animate = () => {
			this.animationId = requestAnimationFrame(animate);
			frameCount++;

			// Update ship controller
			if (this.shipController) {
				this.shipController.update();
			}

			// Update camera controller
			this.cameraController.update();

			// Render the scene
			this.renderer.render(this.scene, this.camera);

			// Log every 60 frames (once per second at 60fps)
			if (frameCount % 60 === 0) {
				console.log(`🎬 Rendered frame ${frameCount}`);
			}
		};
		animate();
	}

	addObject(object: SceneObject) {
		let mesh: Object3D;

		switch (object.type) {
			case 'ship':
				mesh = this.createShip();
				break;
			case 'asteroid':
				mesh = this.createAsteroid();
				break;
			case 'star':
				mesh = this.createStar();
				break;
			default:
				return { success: false, error: 'Unknown object type' };
		}

		mesh.name = object.id;
		mesh.position.set(object.position.x, object.position.y, object.position.z);
		mesh.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z);

		this.scene.add(mesh);
		this.objects.set(object.id, mesh);

		// If this is a ship, set it as camera target and create ship controller
		if (object.type === 'ship' && object.id === 'player_ship') {
			this.cameraController.setTarget(mesh);
			this.shipController = new ShipController(mesh);
			console.log('🎮 Ship controller created for player ship');
		}

		return { success: true };
	}

	updateObject(id: string, position: Vector3, rotation?: Vector3) {
		const object = this.objects.get(id);
		if (!object) return { success: false, error: 'Object not found' };

		// Smooth position interpolation for better movement
		object.position.lerp(new Vector3(position.x, position.y, position.z), 0.1);

		if (rotation) {
			object.rotation.set(rotation.x, rotation.y, rotation.z);
		}

		return { success: true };
	}

	removeObject(id: string) {
		const object = this.objects.get(id);
		if (!object) return { success: false, error: 'Object not found' };

		this.scene.remove(object);
		this.objects.delete(id);

		return { success: true };
	}

	private createShip(): Object3D {
		const group = new Group();

		// Simple ship geometry (you'll replace this with loaded models)
		const bodyGeometry = new ConeGeometry(2, 8, 8);
		const bodyMaterial = new MeshLambertMaterial({ color: 0x00ff00 });
		const body = new Mesh(bodyGeometry, bodyMaterial);
		body.rotation.x = Math.PI / 2;

		// Engine glow
		const engineGeometry = new SphereGeometry(1, 8, 8);
		const engineMaterial = new MeshBasicMaterial({ color: 0x0088ff });
		const engine = new Mesh(engineGeometry, engineMaterial);
		engine.position.z = -5;

		group.add(body);
		group.add(engine);

		return group;
	}

	private createAsteroid(): Object3D {
		// Irregular asteroid shape
		const geometry = new SphereGeometry(
			Math.random() * 5 + 3,
			8 + Math.random() * 8,
			8 + Math.random() * 8
		);

		// Randomly deform vertices for irregular shape
		const positions = geometry.attributes.position;
		for (let i = 0; i < positions.count; i++) {
			const vertex = new Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
			vertex.multiplyScalar(0.8 + Math.random() * 0.4);
			positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
		}

		const material = new MeshLambertMaterial({
			color: 0x8b4513
		});

		return new Mesh(geometry, material);
	}

	private createStar(): Object3D {
		const geometry = new SphereGeometry(20, 16, 16);
		const material = new MeshBasicMaterial({
			color: 0xffff88,
			transparent: true,
			opacity: 0.8
		});

		// Add glow effect
		const glowGeometry = new SphereGeometry(25, 16, 16);
		const glowMaterial = new MeshBasicMaterial({
			color: 0xffff88,
			transparent: true,
			opacity: 0.3
		});

		const star = new Group();
		star.add(new Mesh(geometry, material));
		star.add(new Mesh(glowGeometry, glowMaterial));

		return star;
	}

	setCameraPosition(position: Vector3, lookAt?: Vector3) {
		this.camera.position.set(position.x, position.y, position.z);
		if (lookAt) {
			this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
		}
	}

	resize(width: number, height: number) {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.resize(width, height);

		return { success: true };
	}

	dispose() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
		}
		this.renderer.dispose();

		return { success: true };
	}
}

export type RenderEngineType = RenderEngine;

expose(new RenderEngine());
