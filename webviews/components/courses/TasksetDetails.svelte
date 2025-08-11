<script lang="ts">
  import type { TaskSet } from '../../../src/common/types'

  interface Props {
    taskset: TaskSet;
    isLoggedIn: boolean;
  }

  let { taskset, isLoggedIn }: Props = $props();

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
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
                <th>Submission limit</th>
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
    background:rgb(33, 33, 33);
    border-top: 1px solid rgb(21, 21, 21); /* same as .course_box background in CourseListItem*/
    padding: 0px;
    margin: 0px;
}

.task-details-table{
    background:rgb(32, 32, 32);
    color: rgb(197, 197, 197);
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    padding: 0px;
    margin: 0px;
}

.task-details-table th{
    font-weight: normal;
    font-size: 14px;
    background:rgb(30, 30, 30);
    border-collapse: collapse;
    padding-top: 5px;
    padding-bottom: 5px;
}

.task-details-table td {
    text-align: center;
    font-size: 14px;
    border-top: 1px solid rgb(21, 21, 21); /* same as .course_box background in CourseListItem*/
}


</style>
