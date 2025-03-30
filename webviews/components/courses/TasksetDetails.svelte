<script lang="ts">
  import type { TaskSet } from '../../../src/common/types'

  interface Props {
    taskset: TaskSet;
    isLoggedIn: boolean;
  }

  let { taskset, isLoggedIn }: Props = $props();

function formatDate(dateString) {
    const date = new Date(dateString);

    const options = {
        timeZone: "Europe/Helsinki",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false // Use 24-hour format
    };

    const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(date);

    return formattedDate.replace(/(\d{2})\.(\d{2})\.(\d{4}),/, "$1/$2/$3,"); 


}

</script>

<!--
@component
This component creates a nested table that displays information 
about individual tasks in task set. Visibility is toggled by TasksetTableRow.

Deadline is submitted as UTC+3 or UTC+2 based on summertime savings, but saved as UTC+0. 
UTC is therefore not shown.
-->

<tr class="task-details">
    <td colspan="3">
        <table class="task-details-table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Limit of submissions</th>
                <th>Deadline</th>
            </tr>
        </thead>
        <tbody>
            {#each taskset.tasks as task}
                <tr class="details-row">
                    <td>{task.ide_task_id}</td>
                    <td>
                        {#if task.answer_limit != null}
                            {task.answer_limit}
                        {:else}
                            -
                        {/if}
                    </td>
                    <td>
                        {#if task.deadline != null}
                            {formatDate(task.deadline)}
                        {:else}
                            -
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
        </table>
    </td>
</tr>

<style>

.task-details{
    background:rgb(44, 44, 44);
    border-top: 1px solid rgb(25, 25, 25);
}

td {
    border: none;
    text-align: center;
    vertical-align: top;
    padding: 0px;
    color: rgb(197, 197, 197);
    font-size: 14px;
  }

.task-details-table{
    width: 100%;
    table-layout: fixed;
}

.task-details-table th{
    font-weight: normal;
}

.task-details-table td {
    border-top: 1px solid rgb(32, 32, 32);
}


</style>
