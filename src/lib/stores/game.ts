import type { Calculator } from '$lib/worker/calculator';
import CalculatorWorker from '$lib/worker/calculator?worker';
import * as Comlink from 'comlink';
import { browser } from '$app/environment';

export class Workers {
	#calculator: Comlink.Remote<Calculator> | null = null;

	constructor() {
		// Only create the worker in the browser environment
		if (browser) {
			this.#calculator = Comlink.wrap<Calculator>(new CalculatorWorker());
		}
	}

	async add(a: number, b: number) {
		if (!this.#calculator) {
			throw new Error('Calculator worker is not available in SSR environment');
		}

		return await this.#calculator.add(a, b);
	}
}

export const workers = new Workers();
