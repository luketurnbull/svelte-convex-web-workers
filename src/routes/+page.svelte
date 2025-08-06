<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../convex/_generated/api.js';
	import { workers } from '$lib/stores/game';

	let number = $state(1);

	const query = useQuery(api.tasks.get, {});

	async function add(a: number, b: number) {
		number = await workers.add(a, b);
	}
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
