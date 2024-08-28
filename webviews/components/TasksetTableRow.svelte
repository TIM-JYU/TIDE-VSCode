<script lang="ts">
  import type { TaskSet } from '../common/types'

  export let taskset: TaskSet
  export let isLoggedIn: boolean

  /**
   * Initiates the download of a task set identified by its path.
   */
  function downloadTaskSet() {
    tsvscode.postMessage({
      type: 'DownloadTaskSet',
      value: taskset.path,
    })
  }

  /**
   * Opens a workspace for the specified task set.
   */
  function openWorkspace() {
    tsvscode.postMessage({
      type: 'OpenWorkspace',
      value: taskset.downloadPath,
    })
  }
</script>

<td id="name-cell">{taskset.name}</td>

{#if taskset.tasks.length}
  <td>{taskset.tasks.length}</td>
  <!-- <td>6/8</td> -->
  <td>
    {#if taskset.downloadPath === undefined}
      <button on:click={downloadTaskSet}>Download taskset</button>
    {:else}
      <button on:click={openWorkspace}>Open in workspace</button>
    {/if}
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
