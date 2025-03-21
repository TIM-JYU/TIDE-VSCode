<script lang="ts">
  import { onMount } from 'svelte'
  import type { TaskSet, WebviewMessage } from '../../../src/common/types'

  import LoaderButton from '../common/LoaderButton.svelte'

  interface Props {
    taskset: TaskSet;
    isLoggedIn: boolean;
  }

  let { taskset, isLoggedIn }: Props = $props();

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
</script>

<td id="name-cell">{taskset.name}</td>

{#if taskset.tasks.length}
  <td>{taskset.tasks.length}</td>
  <!-- <td>6/8</td> -->
  <td>
    <LoaderButton loading={downloadingTasks} text="Download taskset" textWhileLoading="Downloading..." onClick={downloadTaskSet} />
  </td>
{:else}
  <td colspan="2">Unavailable</td>
{/if}

<style>
  td {
    border: none;
    text-align: center;
    padding: 8px;
  }

  #name-cell {
    text-align: left;
  }

</style>
