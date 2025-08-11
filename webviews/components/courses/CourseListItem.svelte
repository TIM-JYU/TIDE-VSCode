<script lang="ts">
  import { onMount } from 'svelte'
  import type { Course, CourseStatus, WebviewMessage} from '../../../src/common/types'
  import Menu from './Menu.svelte'
  import MenuItem from './MenuItem.svelte'
  import TasksetTableRow from './TasksetTableRow.svelte'
  import LoaderButton from '../common/LoaderButton.svelte'

  interface Props {
    course: Course;
    isLoggedIn: boolean;
    customUrl: String;
  }

  let { course, isLoggedIn, customUrl }: Props = $props();
  let isExpanded: boolean = $state(false)
  let downloadingTasks: boolean = $state(false)
  let oppositeStatus: CourseStatus = $derived(course.status === 'active' ? 'hidden' : 'active')

   onMount(() => 
  {
    window.addEventListener('message', (event) => 
    {
      const message: WebviewMessage = event.data
      switch (message.type) 
      {
        case 'DownloadCourseTasksComplete': 
        {
            downloadingTasks = false
            break
        }
        case 'DownloadCourseTasksFailed':
        {
            downloadingTasks = false
            break
        }
      }
    })
  })

  /**
   * Updates the status of a course to a new status.
   * @param {string} newStatus - The new status for the course.
   */
  function moveCourse(newStatus: CourseStatus) {
    tsvscode.postMessage({
      type: 'SetCourseStatus',
      value: {
        id: course.id,
        status: newStatus,
      },
    })
  }

  /**
   * Toggles the expanded/collapsed state of a course information panel.
   */
  function toggleExpanded() {
    isExpanded = !isExpanded
  }

  /**
   * Initiates the download of a tasks identified by its path.
   */
  function downloadAllCourseTasks() {
    downloadingTasks = true
    tsvscode.postMessage({
      type: 'DownloadCourseTasks',
      value: course.path,
    })
  }
  
</script>

<!--
@component
This component creates displays for individual courses.  
-->

<div class="course-box">
  <header>
    <p class="course-title">{course.name}</p>
    <Menu>
      {#snippet toggle()}
            <span class="menu-toggle">&#8942;</span>
          {/snippet}
      {#snippet menucontent()}
            <MenuItem >
          <a href="#?" onclick={() => moveCourse(oppositeStatus)}>
            Move to {oppositeStatus} courses
          </a>
        </MenuItem>
          {/snippet}
    </Menu>
  </header>
    <a class="link" href={ customUrl + 'view/' + course.path} title="Open the course in TIM">Open material page</a>
  <button
    class="expand-collapse-button"
    aria-expanded={isExpanded}
    onclick={() => toggleExpanded()}
    title={isExpanded ? 'Hide task sets' : 'Show task sets'}
  >
    <span class="arrow {isExpanded ? 'up-arrow' : 'down-arrow'}">&#9660;</span>
  </button>
  {#if isExpanded}
    <div class="course-content">
      <table>
        <thead>
          <tr>
            <th>Task set</th>
            <th>Number of tasks</th>
            <th>
              <LoaderButton 
                class="loader-button-blue" 
                loading={downloadingTasks} 
                text="Download all tasks" 
                textWhileLoading="Downloading..." 
                onClick={downloadAllCourseTasks}
                title="Download all tasks for this course"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {#each course.taskSets as taskset}
            <TasksetTableRow {taskset} {isLoggedIn} />
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .course-box {
    position: relative;
    background-color:rgb(21, 21, 21);
    padding-bottom: 3.5rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    font-size: 1.4em;
    max-width: 85%;
    min-width: 24em;
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgb(21, 21, 21);
  }

  .course-title {
    margin-left: 1.5rem;
    margin-top: 1.5rem;
  }

  .menu-toggle{
    padding-right: 5px;
  }

  .link {
    margin-left: 1.5rem;
    font-size: 0.9rem;
    color:rgb(0, 127, 211);
  }

  .link:hover {
    text-decoration: underline;
  }

  header {
    display: flex;
    justify-content: space-between;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .expand-collapse-button {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgb(197, 197, 197);
    background-color: transparent;
    border: none;
    width: 36px;
    height: 36px;
    position: absolute;
    bottom: 0rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .up-arrow {
    transform: rotate(-180deg);
  }

  .down-arrow {
    transform: rotate(0deg);
  }

  .link::after {
    content: '';
    position: absolute;
    bottom: 2rem;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: gray;
  }

  .course-content {
    margin-top: 2rem;
    max-width: 100%;
    overflow-x: auto;
    box-sizing: content-box;
  }


  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    box-sizing: content-box;
  }

  th {
    border: none;
    text-align: center;
    padding: 8px;
    background-color: rgb(21, 21, 21); /*same as .course-box background */
    font-weight: normal;
    font-size: smaller;
  }

</style>
