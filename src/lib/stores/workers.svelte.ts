import type { Calculator } from '$lib/worker/calculator';
import CalculatorWorker from '$lib/worker/calculator?worker';
import { wrap, type Remote } from 'comlink';

export class Workers {
	#calculator: Remote<Calculator> = wrap<Calculator>(new CalculatorWorker());
	#total = $state(0);

	constructor() {}

	async increment() {
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
