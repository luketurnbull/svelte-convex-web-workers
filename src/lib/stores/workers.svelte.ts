import type { Calculator } from '$lib/worker/calculator';
import CalculatorWorker from '$lib/worker/calculator?worker';
import * as Comlink from 'comlink';
import { browser } from '$app/environment';

export class Workers {
	#calculator: Comlink.Remote<Calculator> | null = null;
	#total = $state(0);

	constructor() {
		// Only create the worker in the browser environment
		if (browser) {
			this.#calculator = Comlink.wrap<Calculator>(new CalculatorWorker());
		}
	}

	async increment() {
		if (!this.#calculator) {
			throw new Error('Calculator worker is not available in SSR environment');
		}

		this.total = await this.#calculator.add(this.total, 1);
	}

	get total() {
		return this.#total;
	}

	set total(value: number) {
		this.#total = value;
	}
}

export const workers = new Workers();
