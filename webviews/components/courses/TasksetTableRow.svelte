<script lang="ts">
  import { onMount } from 'svelte'
  import type { TaskSet, WebviewMessage } from '../../../src/common/types'
  import TasksetDetails from './TasksetDetails.svelte'
  import LoaderButton from '../common/LoaderButton.svelte'

  interface Props {
    taskset: TaskSet;
    isLoggedIn: boolean;
  }

  let { taskset, isLoggedIn }: Props = $props();
  let showDetails: boolean = $state(false);

  let downloadingTasks: boolean = $state(false)
  
  /* 
   * Listens for messages from CoursePanel.ts.
   */
  onMount(() => 
  {
    window.addEventListener('message', (event) => 
    {
      const message: WebviewMessage = event.data
      switch (message.type) 
      {
        case 'DownloadTaskSetComplete': 
        {
            downloadingTasks = false
            break
        }
      }
    })
  })


  /**
   * Initiates the download of a task set identified by its path.
   */
  function downloadTaskSet() {
    downloadingTasks = true
    tsvscode.postMessage({
      type: 'DownloadTaskSet',
      value: taskset.path,
    })
  }

  function toggleDetails() {
    showDetails = !showDetails
  }

</script>

<!--
@component
This component creates a row in a table containing information about task set. 
Enables downloading task set.  
-->

<tr>
  <td>
    <button class="button-taskname" onclick={toggleDetails}>
      <span class="button-taskname-span">{taskset.name}</span>
      <span class="arrow {showDetails ? 'left-arrow' : 'down-arrow'}">&#8250;</span>
    </button>
  </td>
  {#if taskset.tasks.length}
    <td>{taskset.tasks.length}</td>
    <td>
      <LoaderButton loading={downloadingTasks} text="Download taskset" textWhileLoading="Downloading..." onClick={downloadTaskSet} />
    </td>
  {:else}
    <td colspan="2">Unavailable</td>
  {/if}
</tr>

{#if showDetails}
  <TasksetDetails {taskset} {isLoggedIn}/>
{/if}

<style>

  tr{
   background:rgb(27, 27, 27);
   border-top: 1px solid rgb(21, 21, 21); /* same as .course_box background in CourseListItem*/
  }

  td {
    border: none;
    text-align: center;
    vertical-align: top;
    padding: 8px;
    color: rgb(195, 195, 195);
    font-size: 14px;
  }

  button {
    background-color:rgb(0, 111, 185);
    color: white;
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
  }

  button:hover {
    background-color:rgb(0, 83, 138);
  }

  .button-taskname {
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    background-color: transparent;
    color: rgb(197, 197, 197);
  }

  .button-taskname-span{
    font-size: 14px;
  }

  .button-taskname:hover{
    background-color: transparent;
  }

  .arrow {
    margin-left: 5px;
    display: inline-block;
    transition: transform 0s;
  }

  .left-arrow {
    transform: rotate(90deg);
  }

  .down-arrow {
    transform: rotate(0deg);
  }

</style>
