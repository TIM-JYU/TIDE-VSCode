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
    <div id="points-grid">
      <div id="points">
        {taskPoints.current_points} / {maxPoints}
      </div>
      <div id="percentage">
        {(taskPoints.current_points / maxPoints) * 100}%
      </div>
      <div id="progress">
        <progress value={taskPoints.current_points} max={maxPoints} />
      </div>
    </div>
  {/if}
</div>

<style>
  #points-grid {
    width: 100%;
    display: grid;
    grid-template: auto auto / 1fr 1fr;
    grid-template-areas:
      'points percentage'
      'progress progress';
  }

  #points {
    grid-area: 'points';
  }
  #percentage {
    grid-area: 'percentage';
    text-align: right;
  }
  #progress {
    grid-area: 'progress';
    background: red;
  }
  progress {
    width: 100%;
  }
</style>
