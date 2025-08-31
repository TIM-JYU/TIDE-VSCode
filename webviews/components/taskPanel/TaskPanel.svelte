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
    type TaskInfo,
    type WebviewMessage,
  } from '../../../src/common/types'
  import PointsDisplay from './PointsDisplay.svelte'
  import LoaderButton from '../common/LoaderButton.svelte'

  let taskInfo: TaskInfo = $state({
    doc_id: 0,
    header: undefined,
    ide_task_id: '',
    max_points: null,
    path: '',
    stem: undefined,
    task_files: [],
    type: '',
    deadline: null,
    answer_limit: null,
    supplementary_files: [],
    task_directory: null,
    metadata_path: '',
  })
  let loginData: LoginData = $state({
    isLogged: false,
  })
  let isLoggedIn = $state(false)
  let taskPoints: TaskPoints = $state({ current_points: null })
  let customUrl: string = $state('')
  let pointsUpdating: boolean = $state(false)

  /**
   * Listens for messages from CoursePanel.ts.
   */
  onMount(() => {
    window.addEventListener('message', (event) => {
      const message: WebviewMessage = event.data
      switch (message.type) {
        case 'UpdateTaskInfo': {
          taskInfo = message.value
          break
        }
        case 'LoginData': {
          loginData = message.value
          break
        }
        case 'TaskPoints': {
          taskPoints = message.value
          pointsUpdating = false
          break
        }
        case 'SubmitResult': {
          // Todo: This tries to show points, but it's not yet implemented
          onTaskSubmitted()
          break
        }
        case 'CustomUrl': {
          customUrl = ensureTrailingSlash(message.value)
          break
        }
        case 'SetPointsUpdating': {
          pointsUpdating = message.value
          break
        }
      }
    })
  })

  // Ensure that the URL has a trailing slash
  function ensureTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : url + '/'
  }

  function onTaskSubmitted() {
    updateTaskPoints()
  }

  function updateTaskPoints() {
    pointsUpdating = true
    tsvscode.postMessage({
      type: 'UpdateTaskPoints',
      value: {
        taskSetPath: taskInfo.path,
        ideTaskId: taskInfo.ide_task_id,
      },
    })
  }

  // This function is used to format the date string received from TIM
  // to a more readable format for the user.
  function formatDate(dateString: string): string {
    const date = new Date(dateString)

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Helsinki',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Use 24-hour format
    }

    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date)

    return formattedDate.replace(/(\d{2})\.(\d{2})\.(\d{4}),/, '$1/$2/$3,')
  }

  run(() => {
    isLoggedIn = loginData?.isLogged ?? false
  })
</script>

<!--
@component
This component manages the display of task information and interaction with tasks, such as submitting exercises and resetting tasks.
-->

{#if taskInfo === undefined}
  <p>
    Task Panel only shows information when you have a TIM task document open in the text editor. If
    you are sure you have a TIM task open, try clicking on the text editor to activate the document.
  </p>
{:else if !taskInfo}
  <p>Loading...</p>
  <span class="loader"></span>
{:else}
  <div class="task-panel">
    {#if taskInfo.header !== null}
      <h3>{taskInfo.header}</h3>
    {:else}
      <h3>{taskInfo.task_files[0].file_name}</h3>
    {/if}
    <div class="instructions">
      {#if taskInfo.stem !== null}
        <p>{taskInfo.stem}</p>
      {:else}
        <p>To see the more instructions, please open the exercise in TIM.</p>
      {/if}
      <a href={customUrl + 'view/' + taskInfo.path} title="Open the exercise in TIM"
        >Open exercise in TIM</a
      >
    </div>

    <hr />

    <div class="points-section">
      {#if taskInfo.max_points === undefined && taskPoints.current_points === 0}
        <p>Points data was not found for this task. Check TIM for more information.</p>
      {:else if taskInfo.max_points}
        <PointsDisplay {taskPoints} taskMaxPoints={taskInfo.max_points} />
        <LoaderButton
          class="loader-button-blue"
          text="Update points"
          textWhileLoading="Updating"
          loading={pointsUpdating}
          onClick={updateTaskPoints}
          title="Click to fetch the latest points from TIM"
        />
      {:else}
        <PointsDisplay {taskPoints} taskMaxPoints={null} />
        <LoaderButton
          class="loader-button-blue"
          text="Update points"
          textWhileLoading="Updating"
          loading={pointsUpdating}
          onClick={updateTaskPoints}
          title="Click to fetch the latest points from TIM"
        />
      {/if}
    </div>

    <div>
      {#if taskInfo.answer_limit !== null}
        <p>
          This task has an <strong>answer limit</strong> of {taskInfo.answer_limit}
          {taskInfo.answer_limit > 1 ? 'submissions' : 'submission'}. Any submissions made after the
          limit will be saved in TIM, but won't be considered for points or grading.
        </p>
      {/if}
      {#if taskInfo.deadline !== null}
        <p>The deadline for this task is {formatDate(taskInfo.deadline)}.</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .task-panel {
    border: none;
  }

  .task-panel h3 {
    margin: 0;
    font-weight: bold;
    color: #bcbcbcbc;
  }

  .task-panel p {
    margin: 0.5em 0 0.5em 0;
    font-size: small;
  }

  .task-panel a {
    margin: 0.5em 0 0.5em 0;
    font-size: small;
  }

  .task-panel hr {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    border-top: 1px inset #bcbcbcbc;
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
