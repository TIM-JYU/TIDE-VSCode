<script lang="ts">
  /**
   * @author Hannes Koivusipilä
   * @author Stella Palenius
   * @license MIT
   * @date 22.3.2024
   */

  import CourseList from './CourseList.svelte'
  import { onMount } from 'svelte'
  import { type Course, type LoginData, type WebviewMessage } from '../common/types'

  let downloadPath: string = ''
  let courses: Array<Course> = []
  let loginData: LoginData
  let isLoggedIn: boolean

  $: if (downloadPath === null) {
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
   * Notifies the extension that the user has not chosen a directory for downloading task sets,
   * and posts an error message accordingly.
   */
  function directoryNotSet() {
    tsvscode.postMessage({
      type: 'OnError',
      value: 'Directory for downloading tasks has not been set.',
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

{#if isLoggedIn}
  <div>
    <button
      on:click={() => {
        tsvscode.postMessage({
          type: 'RefreshCourseData',
          value: undefined,
        })
      }}>Refresh</button
    >
  </div>

  {#if downloadPath === null}
  <button
    on:click={() => {
      tsvscode.postMessage({
        type: 'SetDownloadPath',
        value: undefined,
      })
    }}>Set directory</button
  >
  {/if}

  {#if courses.length === 0}
    <p>No IDE courses were found. Are you sure you have bookmarked an IDE-course in TIM?</p>
  {:else}
    <CourseList
      defaultExpandedState={true}
      statusOfCourses={'active'}
      courses={courses.filter((c) => c.status === 'active')}
      {isLoggedIn}
    />

    <CourseList
      defaultExpandedState={false}
      statusOfCourses={'hidden'}
      courses={courses.filter((c) => c.status === 'hidden')}
      {isLoggedIn}
    />
  {/if}
{:else}
  Login to view your courses.
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
