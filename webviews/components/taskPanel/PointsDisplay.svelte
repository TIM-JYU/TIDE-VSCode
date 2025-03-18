<script lang="ts">
  import type { TaskPoints } from '../../../src/common/types'

  interface Props {
    taskPoints: TaskPoints;
    taskMaxPoints: number | null;
  }

  let { taskPoints, taskMaxPoints }: Props = $props();
</script>

<!--
@component
A component for showing task points data.
-->
<div>
  {#if taskPoints && taskPoints.current_points !== undefined && taskMaxPoints !== null}
    <div id="points">
      <span>Task points</span>
      <span>{taskPoints.current_points} / {taskMaxPoints}</span>
    </div>
    <progress value={taskPoints.current_points} max={taskMaxPoints} aria-label="Task progress"></progress>
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