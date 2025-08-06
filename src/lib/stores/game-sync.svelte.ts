import { wrap, type Remote } from 'comlink';
import type { WorkerManager, GameState, ShipData } from '$lib/worker/worker-manager';
import WorkerManagerConstructor from '$lib/worker/worker-manager?worker';

export class GameSync {
	// Svelte runes for reactive state
	private _gameState = $state<GameState | null>(null);
	private _isLoading = $state(true);
	private _error = $state<string | null>(null);
	private _rendererType = $state<'webgpu' | 'webgl'>('webgl');

	// Worker manager
	private workerManager!: Remote<WorkerManager>;

	// Derived state
	public readonly gameState = $derived(this._gameState);
	public readonly isLoading = $derived(this._isLoading);
	public readonly error = $derived(this._error);
	public readonly rendererType = $derived(this._rendererType);

	// Player state
	public readonly playerShip = $derived(this._gameState?.playerShip);
	public readonly playerPosition = $derived(this._gameState?.playerPosition);
	public readonly asteroids = $derived(this._gameState?.asteroids || []);
	public readonly ships = $derived(this._gameState?.ships || []);
	public readonly market = $derived(this._gameState?.market);

	constructor() {
		this.initialize();
	}

	private async initialize() {
		try {
			this._isLoading = true;
			this._error = null;

			// Initialize worker manager
			this.workerManager = wrap<WorkerManager>(new WorkerManagerConstructor());

			// Get initial game state
			this._gameState = await this.workerManager.getGameState();

			// Set up reactive updates
			this.setupReactiveUpdates();

			this._isLoading = false;
		} catch (error) {
			this._error = error instanceof Error ? error.message : 'Failed to initialize game';
			this._isLoading = false;
		}
	}

	private setupReactiveUpdates() {
		// Update game state every 100ms
		const updateInterval = setInterval(async () => {
			if (this.workerManager) {
				try {
					this._gameState = await this.workerManager.getGameState();
				} catch (error) {
					console.error('Failed to update game state:', error);
				}
			}
		}, 100);

		// Cleanup on component unmount
		return () => {
			clearInterval(updateInterval);
		};
	}

	// Player actions
	async movePlayerShip(direction: { x: number; y: number; z: number }) {
		if (!this._gameState?.playerShip) return;

		const newPosition = {
			x: this._gameState.playerShip.position.x + direction.x,
			y: this._gameState.playerShip.position.y + direction.y,
			z: this._gameState.playerShip.position.z + direction.z
		};

		await this.updateGameState({
			playerPosition: newPosition,
			playerShip: {
				...this._gameState.playerShip,
				position: newPosition
			}
		});
	}

	async mineAsteroid(asteroidId: string) {
		if (!this._gameState?.playerShip) return;

		// Find asteroid
		const asteroid = this._gameState.asteroids.find((a) => a.id === asteroidId);
		if (!asteroid || asteroid.depleted) return;

		// Calculate mining yield based on ship stats
		const miningYield = Math.min(
			asteroid.resources[0]?.amount || 0,
			this._gameState.playerShip.stats.miningPower
		);

		if (miningYield > 0) {
			// Update asteroid
			const updatedAsteroids = this._gameState.asteroids.map((a) =>
				a.id === asteroidId
					? {
							...a,
							resources: [{ ...a.resources[0], amount: a.resources[0].amount - miningYield }]
						}
					: a
			);

			// Update ship cargo
			const updatedShip: ShipData = {
				...this._gameState.playerShip,
				cargo: [
					...this._gameState.playerShip.cargo,
					{ ...asteroid.resources[0], amount: miningYield }
				]
			};

			await this.updateGameState({
				asteroids: updatedAsteroids,
				playerShip: updatedShip
			});
		}
	}

	async sellResources(resourceType: string, amount: number) {
		if (!this._gameState?.playerShip) return;

		// Find resource in cargo
		const cargoIndex = this._gameState.playerShip.cargo.findIndex((r) => r.type === resourceType);
		if (cargoIndex === -1) return;

		const resource = this._gameState.playerShip.cargo[cargoIndex];
		const sellAmount = Math.min(amount, resource.amount);

		if (sellAmount > 0) {
			// Calculate price
			const price = this._gameState.market.prices[resourceType] || 1;
			const totalValue = sellAmount * price * resource.quality;

			// Update cargo
			const updatedCargo = [...this._gameState.playerShip.cargo];
			updatedCargo[cargoIndex] = { ...resource, amount: resource.amount - sellAmount };

			// Remove empty cargo slots
			const filteredCargo = updatedCargo.filter((r) => r.amount > 0);

			const updatedShip: ShipData = {
				...this._gameState.playerShip,
				cargo: filteredCargo
			};

			await this.updateGameState({
				playerShip: updatedShip
			});

			// TODO: Update player money in Convex
		}
	}

	// Worker management
	async updateGameState(state: Partial<GameState>) {
		if (!this.workerManager) return;

		try {
			await this.workerManager.updateGameState(state);
		} catch (error) {
			console.error('Failed to update game state:', error);
		}
	}

	async dispose() {
		if (this.workerManager) {
			try {
				await this.workerManager.dispose();
			} catch (error) {
				console.error('Failed to dispose worker manager:', error);
			}
		}
	}

	// Convex integration (to be implemented)
	async syncWithConvex() {
		// TODO: Sync game state with Convex
		// This will be implemented when we add Convex integration
	}
}

// Global instance
export const gameSync = new GameSync();
