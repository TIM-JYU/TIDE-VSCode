<script>
  import CourseList from './CourseList.svelte';
  import { onMount } from 'svelte';

  let downloadPath = '';
  let coursesJson = [];
  let activeCoursesExpanded = true;
  let hiddenCoursesExpanded = false;

  $: if (downloadPath== null) {
    directoryNotSet();
	}

  /**
  * Listens for messages from CoursePanel.ts.
  */
  onMount(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message && message.command === 'setPathResult') {
        downloadPath = message.path;
      }
      if (message && message.type === 'json') {
          coursesJson = message.value;
          console.log(coursesJson);
      }
    });
  });

  /**
   * Toggles the visibility of courses based on their status.
   * @param {string} status - Tells if the course status is "active" or "hidden".
   */
  function toggleVisibility(status) {
    status === 'active' ? activeCoursesExpanded = !activeCoursesExpanded : hiddenCoursesExpanded = !hiddenCoursesExpanded;
  }

  // Mock data for testing the webview
  // let courses = [
  //   {
  //     "id": "1001",
  //     "name": "Course1",
  //     "task_docs": [
  //       { "name": 1, "tasks": ["Exercise 1", "Exercise 2", "Exercise 3"] },
  //       { "name": 2, "tasks": ["Exercise 4", "Exercise 5"] },
  //       { "name": 3, "tasks": ["Exercise 6", "Exercise 7", "Exercise 8"] }
  //     ],
  //     "status": "active",
  //     "expanded": false
  //   },
  //   {
  //     "id": "1002",
  //     "name": "Course2",
  //     "task_docs": [
  //       { "name": 1, "tasks": ["Exercise 1", "Exercise 2"] },
  //       { "name": 2, "tasks": ["Exercise 3", "Exercise 4"] }
  //     ],
  //     "status": "active",
  //     "expanded": false
  //   },
  //   {
  //     "id": "1003",
  //     "name": "Course3",
  //     "task_docs": [
  //       { "name": 1, "tasks": ["Exercise 1", "Exercise 2", "Exercise 3"] },
  //       { "name": 2, "tasks": ["Exercise 4", "Exercise 5", "Exercise 6"] },
  //       { "name": 3, "tasks": ["Exercise 7", "Exercise 8"] }
  //     ],
  //     "status": "hidden",
  //     "expanded": false
  //   }
  // ];

  /**
   * Updates the status of a course to a new status.
   * @param {object} course - The course object to be updated.
   * @param {string} status - The new status for the course.
   */
  function moveCourse(course, status) {
    const index = coursesJson.findIndex(c => c.id === course.id);
    if (index !== -1) {
        coursesJson[index] = {...course, "status":status};
    }
  }

  /**
   * Toggles the expanded/collapsed state of a course information panel.
   * @param {string} courseId - - The unique identifier of the course.
   */
  function toggleCourse(courseId) {
    const courseIndex = coursesJson.findIndex(course => course.id === courseId);
    if (courseIndex !== -1) {
      coursesJson[courseIndex].expanded = !coursesJson[courseIndex].expanded;
    }
  }

  /**
   * Notifies the extension that the user has not chosen a directory for downloading task sets,
   * and posts an error message accordingly.
   */
  function directoryNotSet() {
    tsvscode.postMessage({
        type: 'onError',
        value: 'Directory for downloading tasks must be set'
      });
  }

  /**
   * Initiates the download of a task set identified by its path.
   * @param {string} taskSetPath - The path of the task set to be downloaded.
   */
  function downloadTaskSet(taskSetPath) {
    if (!downloadPath) {
      directoryNotSet();
      return;
    }
    
    tsvscode.postMessage({
      type: 'downloadTaskSet',
      taskSetPath
    });
  }

  /**
   * Opens a workspace for the specified task set.
   * @param {string} taskSetName - The name of the task set to open a workspace for.
   */
  function openWorkspace(taskSetName) {
    tsvscode.postMessage({
      type: 'openWorkspace',
      taskSetName,
      downloadPath
    });
  }
  
</script>

<h1>My Courses</h1>

<p>Current directory for downloading files: {downloadPath}</p>

<button on:click={() => {
  tsvscode.postMessage({
    type: 'setPath',
    value: ''
  })
}}>Set directory</button>

<CourseList
  isExpanded={activeCoursesExpanded}
  toggle={toggleVisibility}
  toggleCourse={toggleCourse}
  status={"active"}
  courses={coursesJson.filter(c => c.status == "active")}
  moveCourse={moveCourse}
  downloadTaskSet={downloadTaskSet}
  openWorkspace={openWorkspace}/>


<CourseList
  isExpanded={hiddenCoursesExpanded}
  toggle={toggleVisibility}
  toggleCourse={toggleCourse}
  status={"hidden"}
  courses={coursesJson.filter(c => c.status == "hidden")}
  moveCourse={moveCourse}
  downloadTaskSet={downloadTaskSet}
  openWorkspace={openWorkspace}/>

<style>
  :global(body) {
    margin-bottom: 2.5rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
  }
</style>
