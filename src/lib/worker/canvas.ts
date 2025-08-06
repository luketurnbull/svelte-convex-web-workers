import * as Comlink from 'comlink';

export class Calculator {
	async evaluate(equation: string): Promise<number> {
		const result = eval(equation);

		return result;
	}
}

Comlink.expose(new Calculator());
