<script lang="ts">
    /**
     * This component manages the display and interaction with a list of courses. It listens for messages from CoursePanel.ts,
     * updates the courses' status, and handles downloading task sets and opening workspaces.
     *
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
        MessageType,
    } from '../common/types'

    let downloadPath: string = ''
    let courses: Array<Course>
    let activeCoursesExpanded = true
    let hiddenCoursesExpanded = false
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
            const message = event.data
            if (message && message.command === 'setPathResult') {
                downloadPath = message.path
            } else if (message && message.type === 'json') {
                courses = message.value
            } else if (message.type === MessageType.LoginData) {
                loginData = message.value
            }
        })
        tsvscode.postMessage({ type: MessageType.RequestLoginData, value: '' })
    })

    /**
     * Toggles the visibility of courses based on their status.
     * @param {string} status - Tells if the course status is "active" or "hidden".
     */
    function toggleVisibility(status: CourseStatus) {
        status === 'active'
            ? (activeCoursesExpanded = !activeCoursesExpanded)
            : (hiddenCoursesExpanded = !hiddenCoursesExpanded)
    }

    /**
     * Updates changes in courses to globalState.
     * @param coursesJson - courses json array.
     */
    function updateCoursesToGlobalState(coursesJson) {
        tsvscode.postMessage({
            type: MessageType.UpdateCoursesToGlobalState,
            value: coursesJson,
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
    function toggleCourse(courseId) {
        const courseIndex = courses.findIndex(
            (course) => course.id === courseId
        )
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
            type: MessageType.OnError,
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
            type: MessageType.DownloadTaskSet,
            value: taskSetPath,
        })
    }

    /**
     * Opens a workspace for the specified task set.
     * @param {string} taskSetName - The name of the task set to open a workspace for.
     */
    function openWorkspace(taskSetName: string, taskSetPath: string) {
        tsvscode.postMessage({
            type: MessageType.OpenWorkspace,
            value: {
                taskSetName,
                taskSetPath,
            },
        })
    }

    $: isLoggedIn = loginData.isLogged ?? false
</script>

<h1>My Courses</h1>

<p>Current directory for downloading files: {downloadPath}</p>

<button
    on:click={() => {
        tsvscode.postMessage({
            type: MessageType.SetDownloadPath,
            value: '',
        })
    }}>Set directory</button
>

{#if courses.length === 0}
    <p>
        No IDE courses were found. Are you sure you have bookmarked an
        IDE-course in TIM?
    </p>
{:else}
    <CourseList
        isExpanded={activeCoursesExpanded}
        toggle={toggleVisibility}
        {toggleCourse}
        status={'active'}
        courses={courses.filter((c) => c.status == 'active')}
        {moveCourse}
        {downloadTaskSet}
        {openWorkspace}
        {isLoggedIn}
    />

    <CourseList
        isExpanded={hiddenCoursesExpanded}
        toggle={toggleVisibility}
        {toggleCourse}
        status={'hidden'}
        courses={courses.filter((c) => c.status == 'hidden')}
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
