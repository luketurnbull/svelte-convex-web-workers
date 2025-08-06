import * as Comlink from 'comlink';

export class Calculator {
	async add(a: number, b: number): Promise<number> {
		const result = a + b;

		return result;
	}
}

export type CalculatorType = Calculator;

// Create an instance and expose it
const calculator = new Calculator();
Comlink.expose(calculator);
