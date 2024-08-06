<script lang="ts">
  /**
   * @author Hannes Koivusipilä
   * @author Stella Palenius
   * @license MIT
   * @date 22.3.2024
   */

  import CourseList from './CourseList.svelte'
  import { onMount } from 'svelte'
  import {
    type Course,
    type CourseStatus,
    type LoginData,
    type WebviewMessage,
  } from '../common/types'

  let downloadPath: string = ''
  let courses: Array<Course> = []
  let loginData: LoginData
  let isLoggedIn: boolean

  $: if (downloadPath == null) {
    directoryNotSet()
  }

  /**
   * Listens for messages from CoursePanel.ts.
   */
  onMount(() => {
    window.addEventListener('message', (event) => {
      const message: WebviewMessage = event.data
      switch (message.type) {
        case 'SetDownloadPathResult': {
          downloadPath = message.value
          break
        }
        case 'CourseData': {
          courses = message.value
          break
        }
        case 'LoginData': {
          loginData = message.value
          break
        }
      }
    })
  })

  /**
   * Updates changes in courses to globalState.
   * @param courses - courses json array.
   */
  function updateCoursesToGlobalState(courses: Array<Course>) {
    tsvscode.postMessage({
      type: 'UpdateCoursesToGlobalState',
      value: courses,
    })
  }

  /**
   * Updates the status of a course to a new status.
   * @param {object} course - The course object to be updated.
   * @param {string} status - The new status for the course.
   */
  function moveCourse(course: Course, status: CourseStatus) {
    const index = courses.findIndex((c) => c.id === course.id)
    if (index !== -1) {
      courses[index] = { ...course, status: status }
      updateCoursesToGlobalState(courses)
    }
  }

  /**
   * Toggles the expanded/collapsed state of a course information panel.
   * @param {string} courseId - - The unique identifier of the course.
   */
  function toggleCourse(courseId: number) {
    // TODO: is it necessary to keep expanded state in permanent storage?

    const courseIndex = courses.findIndex((course) => course.id === courseId)
    if (courseIndex !== -1) {
      courses[courseIndex].expanded = !courses[courseIndex].expanded
      updateCoursesToGlobalState(courses)
    }
  }

  /**
   * Notifies the extension that the user has not chosen a directory for downloading task sets,
   * and posts an error message accordingly.
   */
  function directoryNotSet() {
    tsvscode.postMessage({
      type: 'OnError',
      value: 'Directory for downloading tasks must be set',
    })
  }

  /**
   * Initiates the download of a task set identified by its path.
   * @param {string} taskSetPath - The path of the task set to be downloaded.
   */
  function downloadTaskSet(taskSetPath: string) {
    if (!downloadPath) {
      directoryNotSet()
      return
    }

    tsvscode.postMessage({
      type: 'DownloadTaskSet',
      value: taskSetPath,
    })
  }

  /**
   * Opens a workspace for the specified task set.
   * @param {string} taskSetPath - The path of the task set to open a workspace for.
   */
  function openWorkspace(taskSetPath: string) {
    tsvscode.postMessage({
      type: 'OpenWorkspace',
      value: taskSetPath,
    })
  }

  $: isLoggedIn = loginData?.isLogged ?? false
</script>

<!--
@component
This component manages the display and interaction with a list of courses. It listens for messages from CoursePanel.ts,
updates the courses' status, and handles downloading task sets and opening workspaces.
-->

<h1>My Courses</h1>

<p>Current directory for downloading files: {downloadPath}</p>

<button
  on:click={() => {
    tsvscode.postMessage({
      type: 'SetDownloadPath',
      value: '',
    })
  }}>Set directory</button
>

{#if courses.length === 0}
  <p>No IDE courses were found. Are you sure you have bookmarked an IDE-course in TIM?</p>
{:else}
  <CourseList
    defaultExpandedState={true}
    {toggleCourse}
    status={'active'}
    courses={courses.filter((c) => c.status === 'active')}
    {moveCourse}
    {downloadTaskSet}
    {openWorkspace}
    {isLoggedIn}
  />

  <CourseList
    defaultExpandedState={false}
    {toggleCourse}
    status={'hidden'}
    courses={courses.filter((c) => c.status === 'hidden')}
    {moveCourse}
    {downloadTaskSet}
    {openWorkspace}
    {isLoggedIn}
  />
{/if}

<style>
  :global(body) {
    margin-bottom: 2.5rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
  }
</style>
