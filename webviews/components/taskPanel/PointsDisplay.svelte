<script lang="ts">
  import type { TaskPoints } from '../../common/types'

  export let taskPoints: TaskPoints
  export let maxPoints: number | null
</script>

<!--
@component
A component for showing task points data.
-->
<div>
  Task points
  {#if taskPoints.current_points !== undefined && maxPoints !== null}
    <div id="points">
      {taskPoints.current_points} / {maxPoints}
    </div>
    <progress value={taskPoints.current_points} max={maxPoints} />
  {/if}
</div>

<style>
  #points {
    text-align: right;
    width: 100%;
  }
  progress {
    width: 100%;
    height: 2rem;
  }
</style>
