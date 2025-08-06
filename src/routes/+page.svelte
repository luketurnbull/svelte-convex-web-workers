<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../convex/_generated/api.js';
	import { onMount } from 'svelte';
	import * as Comlink from 'comlink';
	import type { CalculatorType } from '$lib/worker/calculator';
	import CalculatorWorker from '$lib/worker/calculator?worker';

	let calculator: Comlink.Remote<CalculatorType>;

	onMount(async () => {
		calculator = Comlink.wrap<CalculatorType>(new CalculatorWorker());
	});

	let number = $state(1);

	async function add(a: number, b: number) {
		const result = await calculator.add(a, b);
		number = result;
	}

	const query = useQuery(api.tasks.get, {});
</script>

<button onclick={() => add(number, 2)}>{number}</button>

{#if query.isLoading}
	Loading...
{:else if query.error}
	failed to load: {query.error.toString()}
{:else}
	<ul>
		{#each query.data as task}
			<li>
				{task.isCompleted ? '☑' : '☐'}
				<span>{task.text}</span>
				<span>assigned by {task.assigner}</span>
			</li>
		{/each}
	</ul>
{/if}
