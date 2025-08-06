import { WebGLRenderer, Scene, Camera } from 'three';

export class GameRenderer {
	private renderer: WebGLRenderer;
	private isWebGPU: boolean = false;

	constructor(canvas: OffscreenCanvas, width: number, height: number) {
		console.log('🎮 Creating GameRenderer...');
		this.renderer = this.createRenderer(canvas, width, height);
	}

	private createRenderer(canvas: OffscreenCanvas, width: number, height: number): WebGLRenderer {
		console.log('🎨 Creating WebGL renderer...');

		const webglRenderer = new WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false
		});

		webglRenderer.setSize(width, height, false);
		webglRenderer.setClearColor(0x000011);

		this.isWebGPU = false;
		console.log('✅ WebGL renderer initialized successfully');
		return webglRenderer;
	}

	getRenderer(): WebGLRenderer {
		return this.renderer;
	}

	isWebGPUEnabled(): boolean {
		return this.isWebGPU;
	}

	render(scene: Scene, camera: Camera) {
		try {
			this.renderer.render(scene, camera);
		} catch (error) {
			console.error('❌ Render error:', error);
		}
	}

	resize(width: number, height: number) {
		this.renderer.setSize(width, height, false);
	}

	dispose() {
		this.renderer.dispose();
	}
}
