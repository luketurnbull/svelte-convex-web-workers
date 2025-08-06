<script lang="ts">
	import { wrap, transfer } from 'comlink';
	import type { Remote } from 'comlink';
	import RenderWorkerConstructor from '$lib/worker/renderEnginer.worker?worker';
	import type { RenderEngineType } from '$lib/worker/renderEnginer.worker';
	import { onMount, onDestroy } from 'svelte';
	import { Vector3 } from 'three';

	let canvas: HTMLCanvasElement;
	let renderEngine: Remote<RenderEngineType>;
	let initialized = $state(false);
	let width = $state(800);
	let height = $state(600);

	onMount(async () => {
		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;

			// Resize the render engine if it's initialized
			if (renderEngine && initialized) {
				renderEngine.resize(width, height);
			}
		};

		window.addEventListener('resize', resize);
		resize();

		// Transfer canvas to worker
		const offscreen = canvas.transferControlToOffscreen();

		// Initialize worker
		renderEngine = wrap<RenderEngineType>(new RenderWorkerConstructor());

		// Initialize the render engine
		const result = await renderEngine.initialize(transfer(offscreen, [offscreen]), {
			width,
			height
		});

		if (result.success) {
			initialized = true;
			await addTestObjects();
		}

		return async () => {
			window.removeEventListener('resize', resize);
			await renderEngine.dispose();
		};
	});

	async function addTestObjects() {
		if (!renderEngine) return;

		// Add a player ship
		await renderEngine.addObject({
			id: 'player_ship',
			type: 'ship',
			position: new Vector3(0, 0, 0),
			rotation: new Vector3(0, 0, 0)
		});

		// Add some asteroids
		for (let i = 0; i < 5; i++) {
			await renderEngine.addObject({
				id: `asteroid_${i}`,
				type: 'asteroid',
				position: new Vector3(
					(Math.random() - 0.5) * 100,
					(Math.random() - 0.5) * 100,
					(Math.random() - 0.5) * 100
				),
				rotation: new Vector3(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				)
			});
		}

		// Add a star in the distance
		await renderEngine.addObject({
			id: 'sun',
			type: 'star',
			position: new Vector3(-200, 50, -200),
			rotation: new Vector3(0, 0, 0)
		});
	}

	async function moveShip() {
		if (!renderEngine) return;

		// Move ship to random position
		await renderEngine.updateObject(
			'player_ship',
			new Vector3(
				(Math.random() - 0.5) * 50,
				(Math.random() - 0.5) * 50,
				(Math.random() - 0.5) * 50
			),
			new Vector3(0, 0, 0)
		);
	}

	onDestroy(async () => {
		if (renderEngine) {
			await renderEngine.dispose();
		}
	});
</script>

<div class="space-canvas-container">
	<canvas bind:this={canvas} class="space-canvas"></canvas>
</div>
