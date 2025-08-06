import { workers } from './workers';

class Calculator {
	#equation = $state('');
	#result = $state(0);

	constructor() {}

	async setEquation(value: string) {
		this.#equation = value;
		this.#result = await workers.calculator.evaluate(value);
	}

	get equation() {
		return this.#equation;
	}

	get result() {
		return this.#result;
	}
}

export const calculator = new Calculator();
