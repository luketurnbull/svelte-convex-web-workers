<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import { calculator } from '$lib/stores/calculator.svelte';

	const query = useQuery(api.tasks.get, {});
</script>

{#await calculator.result}
	Loading...
{:then result}
	{result}
{/await}

<button
	onclick={() => {
		calculator.setEquation('1 + 1');
	}}
>
	Calculate
</button>

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
