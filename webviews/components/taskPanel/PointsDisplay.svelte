<script lang="ts">
  import type { TaskPoints } from '../../../src/common/types'

  interface Props {
    taskPoints: TaskPoints;
    max_points: number | null;
  }

  let { taskPoints, max_points }: Props = $props();
</script>

<!--
@component
A component for showing task points data.
-->
<div>
  {#if taskPoints && taskPoints.current_points !== undefined && max_points !== null}
    <div id="points">
      <span>Task points</span>
      <span>{taskPoints.current_points} / {max_points}</span>
    </div>
    <progress value={taskPoints.current_points} max={max_points} aria-label="Task progress"></progress>
  {/if}
</div>

<style>
  #points {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  progress {
    width: 100%;
    height: 2rem;
  }
</style>