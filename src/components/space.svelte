<script lang="ts">
	import { wrap, transfer } from 'comlink';
	import type { Remote } from 'comlink';
	import RenderWorkerConstructor from '$lib/worker/render-engine.worker?worker';
	import type { RenderEngineType } from '$lib/worker/render-engine.worker';
	import type { ShipMovement } from '$lib/worker/ship-controller';
	import { onMount } from 'svelte';
	import { Vector3 } from 'three';

	let canvas: HTMLCanvasElement;
	let renderEngine: Remote<RenderEngineType>;

	let width = $state(800);
	let height = $state(600);

	// Keyboard state
	let keysPressed = $state<Set<string>>(new Set());

	onMount(() => {
		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;

			if (renderEngine) {
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
		renderEngine.initialize(transfer(offscreen, [offscreen]), {
			width,
			height
		});

		addTestObjects();

		// Set up keyboard event listeners
		setupKeyboardControls();

		return () => {
			window.removeEventListener('resize', resize);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			renderEngine.dispose();
		};
	});

	function setupKeyboardControls() {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
	}

	function handleKeyDown(event: KeyboardEvent) {
		keysPressed.add(event.code);
		updateShipMovement();
	}

	function handleKeyUp(event: KeyboardEvent) {
		keysPressed.delete(event.code);
		updateShipMovement();
	}

	function updateShipMovement() {
		if (!renderEngine) return;

		const movement: Partial<ShipMovement> = {
			forward: keysPressed.has('KeyW'),
			backward: keysPressed.has('KeyS'),
			left: keysPressed.has('KeyA'),
			right: keysPressed.has('KeyD'),
			up: keysPressed.has('Space'),
			down: keysPressed.has('ShiftLeft')
		};

		renderEngine.handleShipMovement(movement);
	}

	function addTestObjects() {
		if (!renderEngine) return;

		// Add a player ship
		renderEngine.addObject({
			id: 'player_ship',
			type: 'ship',
			position: new Vector3(0, 0, 0),
			rotation: new Vector3(0, 0, 0)
		});

		// Add some asteroids
		for (let i = 0; i < 5; i++) {
			renderEngine.addObject({
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
		renderEngine.addObject({
			id: 'sun',
			type: 'star',
			position: new Vector3(-200, 50, -200),
			rotation: new Vector3(0, 0, 0)
		});
	}
</script>

<div class="space-canvas-container">
	<canvas bind:this={canvas} class="space-canvas"></canvas>

	<!-- Controls overlay -->
	<div class="controls-overlay">
		<div class="controls-info">
			<h3>Ship Controls</h3>
			<p>W/A/S/D - Move ship</p>
			<p>Space - Move up</p>
			<p>Shift - Move down</p>
		</div>
	</div>
</div>

<style>
	.controls-overlay {
		position: absolute;
		top: 20px;
		left: 20px;
		z-index: 10;
	}

	.controls-info {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 15px;
		border-radius: 8px;
		font-family: monospace;
		font-size: 14px;
	}

	.controls-info h3 {
		margin: 0 0 10px 0;
		color: #00ff00;
	}

	.controls-info p {
		margin: 5px 0;
	}
</style>
