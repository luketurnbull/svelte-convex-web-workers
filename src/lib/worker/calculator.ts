import * as Comlink from 'comlink';

export class Calculator {
	async add(a: number, b: number): Promise<number> {
		const result = a + b;

		return result;
	}
}

Comlink.expose(new Calculator());
