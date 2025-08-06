import type { Calculator } from '$lib/worker/calculator';
import CalculatorWorker from '$lib/worker/calculator?worker';
import { wrap, type Remote } from 'comlink';

export class Workers {
	#calculator: Remote<Calculator> = wrap<Calculator>(new CalculatorWorker());

	constructor() {}

	get calculator() {
		return this.#calculator;
	}
}

export const workers = new Workers();
