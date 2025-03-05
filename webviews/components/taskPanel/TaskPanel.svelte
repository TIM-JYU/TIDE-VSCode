<script lang="ts">
  import { run } from 'svelte/legacy'

  /**
   * @author Hannes Koivusipilä
   * @author Stella Palenius
   * @license MIT
   * @date 9.4.2024
   */

  import { onMount } from 'svelte'
  import {
    type LoginData,
    type TaskPoints,
    type TimData,
    type WebviewMessage,
  } from '../../../src/common/types'
  import PointsDisplay from './PointsDisplay.svelte'

  let timData: TimData = $state({
    doc_id: 0,
    header: undefined,
    ide_task_id: '',
    max_points: null,
    path: '',
    stem: undefined,
    task_files: [],
    type: ''
  })
  let loginData: LoginData = $state({
    isLogged: false
  })
  let isLoggedIn = $state(false)
  let workspace: string = $state('')
  let taskPoints: TaskPoints = $state({ current_points: undefined })

  /**
   * Listens for messages from CoursePanel.ts.
   */
  onMount(() => {
    window.addEventListener('message', (event) => {
      const message: WebviewMessage = event.data
      switch (message.type) {
        case 'UpdateTimData': {
          timData = message.value
          break
        }
        case 'LoginData': {
          loginData = message.value
          break
        }
        case 'UpdateWorkspaceName': {
          workspace = message.value
          break
        }
        case 'TaskPoints': {
          taskPoints = message.value
          break
        }
        case 'SubmitResult': {
          // Todo: This tries to show points, but it's not yet implemented
          onTaskSubmitted()
          break
        }
      }
    })
  })

  function onTaskSubmitted() {
    updateTaskPoints()
  }

  /**
   * Resets the task file to it's initial stage from TIM.
   * @param taskId ide task id of the task
   */
  function resetExercise() {
    if (timData) {
      tsvscode.postMessage({
        type: 'ResetExercise',
        value: {
          path: timData.path,
          taskId: timData.ide_task_id,
        },
      })
    }
  }

  function resetNoneditableAreas() {
    tsvscode.postMessage({
      type: 'ResetNoneditableAreas',
      value: undefined,
    })
  }

  function updateTaskPoints() {
    tsvscode.postMessage({
      type: 'UpdateTaskPoints',
      value: {
        taskSetPath: timData.path,
        ideTaskId: timData.ide_task_id,
      },
    })
  }

  run(() => {
    isLoggedIn = loginData?.isLogged ?? false
  });
</script>

<!--
@component
This component manages the display of task information and interaction with tasks, such as submitting exercises and resetting tasks.
-->

{#if timData === undefined}
  <p>
    Task Panel only shows information when you have a TIM task document open in the text editor. If
    you are sure you have a TIM task open, try clicking on the text editor to activate the document.
  </p>
{:else if !timData}
  <p>Loading...</p>
  <span class="loader"></span>
{:else}
  <div class="task-panel">
    {#if timData.header !== null}
      <h2>{timData.header}</h2>
    {:else}
      <h2>{timData.task_files[0].file_name}</h2>
    {/if}
    <div class="instructions">
      {#if timData.stem !== null}
        <p>{timData.stem}</p>
      {:else}
        <p>To see the more instructions, please open the exercise in TIM.</p>
      {/if}
        <a href={'https://tim.jyu.fi/view/' + timData.path}>Open the exercise in TIM</a>
    </div>

    <hr />

    <div class="points-section">
      {#if timData.max_points == undefined}
      <p>This task does not reward points.</p>
      {:else}
      <PointsDisplay {taskPoints} maxPoints={timData.max_points} />
      
      <button onclick={updateTaskPoints}>Update points from TIM</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .task-panel {
    border: none;
  }

  .task-panel h2 {
    margin: 0;
  }

  .task-panel p {
    margin: 0.5em 0 0.5em 0;
  }

  button {
    background-color: #007ACC;
    color: white;
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
    max-width: 20em;
    margin: 5px 0 5px 0;
  }

  button:hover {
    background-color: #005F9E;
  }

  .task-panel hr {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    border-top: 1px inset #ccc;
    width: 100%;
  }

  .loader {
    width: 48px;
    height: 48px;
    border: 5px solid #fff;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
