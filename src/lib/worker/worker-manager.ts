import { expose } from 'comlink';
import type { Remote } from 'comlink';

// Import worker types
import type { RenderEngineType } from './renderer/render-engine';
import type { PhysicsEngineType } from './physics/physics-engine';
import type { AIEngineType } from './ai/ai-engine';

export interface WorkerManager {
	// Renderer
	renderer: Remote<RenderEngineType>;

	// Physics
	physics: Remote<PhysicsEngineType>;

	// AI
	ai: Remote<AIEngineType>;

	// Global state
	getGameState(): Promise<GameState>;
	updateGameState(state: Partial<GameState>): Promise<void>;

	// Worker coordination
	syncWorkers(): Promise<void>;
	dispose(): Promise<void>;
}

export interface GameState {
	// Player data
	playerId: string;
	playerPosition: { x: number; y: number; z: number };
	playerShip: ShipData;

	// World data
	asteroids: AsteroidData[];
	ships: ShipData[];
	resources: ResourceData[];

	// Game state
	time: number;
	market: MarketData;
}

export interface ShipData {
	id: string;
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number };
	velocity: { x: number; y: number; z: number };
	type: 'miner' | 'fighter' | 'transport' | 'explorer';
	stats: {
		speed: number;
		capacity: number;
		miningPower: number;
		health: number;
	};
	cargo: ResourceData[];
	crew: CrewMember[];
}

export interface AsteroidData {
	id: string;
	position: { x: number; y: number; z: number };
	size: number;
	resources: ResourceData[];
	depleted: boolean;
}

export interface ResourceData {
	type: 'iron' | 'gold' | 'platinum' | 'helium' | 'hydrogen';
	amount: number;
	quality: number;
}

export interface MarketData {
	prices: Record<string, number>;
	demand: Record<string, number>;
	supply: Record<string, number>;
}

export interface CrewMember {
	id: string;
	name: string;
	role: 'pilot' | 'engineer' | 'miner' | 'security';
	skills: Record<string, number>;
}

class WorkerManagerImpl implements WorkerManager {
	private renderer!: Remote<RenderEngineType>;
	private physics!: Remote<PhysicsEngineType>;
	private ai!: Remote<AIEngineType>;
	private gameState: GameState;
	private syncInterval: number | null = null;

	constructor() {
		this.gameState = this.getInitialGameState();
		this.initializeWorkers();
		this.startSync();
	}

	private getInitialGameState(): GameState {
		return {
			playerId: '',
			playerPosition: { x: 0, y: 0, z: 0 },
			playerShip: {
				id: 'player_ship',
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				velocity: { x: 0, y: 0, z: 0 },
				type: 'miner',
				stats: {
					speed: 10,
					capacity: 1000,
					miningPower: 5,
					health: 100
				},
				cargo: [],
				crew: []
			},
			asteroids: [],
			ships: [],
			resources: [],
			time: Date.now(),
			market: {
				prices: {},
				demand: {},
				supply: {}
			}
		};
	}

	private async initializeWorkers() {
		// Initialize renderer worker
		const RenderWorker = (await import('./renderer/render-engine.worker')).default;
		this.renderer = new RenderWorker();

		// Initialize physics worker
		const PhysicsWorker = (await import('./physics/physics-engine.worker')).default;
		this.physics = new PhysicsWorker();

		// Initialize AI worker
		const AIWorker = (await import('./ai/ai-engine.worker')).default;
		this.ai = new AIWorker();
	}

	private startSync() {
		// Sync workers every 100ms
		this.syncInterval = setInterval(async () => {
			await this.syncWorkers();
		}, 100);
	}

	async getGameState(): Promise<GameState> {
		return this.gameState;
	}

	async updateGameState(state: Partial<GameState>): Promise<void> {
		this.gameState = { ...this.gameState, ...state };
		await this.syncWorkers();
	}

	async syncWorkers(): Promise<void> {
		// Send updated state to all workers
		await Promise.all([
			this.renderer?.updateGameState?.(this.gameState),
			this.physics?.updateGameState?.(this.gameState),
			this.ai?.updateGameState?.(this.gameState)
		]);
	}

	async dispose(): Promise<void> {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
		}

		await Promise.all([
			this.renderer?.dispose?.(),
			this.physics?.dispose?.(),
			this.ai?.dispose?.()
		]);
	}
}

// Expose the worker manager
expose(new WorkerManagerImpl());
