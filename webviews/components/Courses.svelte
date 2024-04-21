<script>
  import Menu from './Menu.svelte'
  import MenuItem from './MenuItem.svelte'
  import CourseList from './CourseList.svelte';
  import { onMount } from 'svelte';

  let downloadPath = '';
  let coursesJson = [];

  $: if (downloadPath== null) {
    tsvscode.postMessage({
    type: 'onError',
    value: 'Folder for downloading tasks must be set'
  })
	}

  onMount(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message && message.command === 'setPathResult') {
        downloadPath = message.path;
      }
      if (message && message.command === 'updatePath') {
        downloadPath = message.path || '';
      }
      if (message && message.type === 'json') {
          coursesJson = message.value;
          console.log(coursesJson);
      }
    });
  });

  let activeCoursesExpanded = true;
  let hiddenCoursesExpanded = false;

  function toggleActive() {
    activeCoursesExpanded = !activeCoursesExpanded;
  }

  function toggleHidden() {
    hiddenCoursesExpanded = !hiddenCoursesExpanded;
  }

  let courses = [
    {
      "id": "1001",
      "name": "Course1",
      "exerciseWeeks": [
        { "week": 1, "exercises": ["Exercise 1", "Exercise 2", "Exercise 3"] },
        { "week": 2, "exercises": ["Exercise 4", "Exercise 5"] },
        { "week": 3, "exercises": ["Exercise 6", "Exercise 7", "Exercise 8"] }
      ],
      "status": "active",
      "expanded": false
    },
    {
      "id": "1002",
      "name": "Course2",
      "exerciseWeeks": [
        { "week": 1, "exercises": ["Exercise 1", "Exercise 2"] },
        { "week": 2, "exercises": ["Exercise 3", "Exercise 4"] }
      ],
      "status": "active",
      "expanded": false
    },
    {
      "id": "1003",
      "name": "Course3",
      "exerciseWeeks": [
        { "week": 1, "exercises": ["Exercise 1", "Exercise 2", "Exercise 3"] },
        { "week": 2, "exercises": ["Exercise 4", "Exercise 5", "Exercise 6"] },
        { "week": 3, "exercises": ["Exercise 7", "Exercise 8"] }
      ],
      "status": "hidden",
      "expanded": false
    }
  ];

  //TODO: keksi parempi
  function moveCourse(course, status) {
    const index = coursesJson.findIndex(c => c.id === course.id);
    if (index !== -1) {
        // Create a new array with the updated status
        // coursesJson = [
        //     ...coursesJson.slice(0, index),
        //     { ...course, status },
        //     ...coursesJson.slice(index + 1)
        // ];
        coursesJson[index] = {...course, "status":status};
    }
  }

  function toggleCourse(courseId) {
    const courseIndex = coursesJson.findIndex(course => course.id === courseId);
    if (courseIndex !== -1) {
      coursesJson[courseIndex].expanded = !coursesJson[courseIndex].expanded;
    }
  }

  function downloadTaskSet(taskSetPath) {
    // Check if downloadPath is set
    if (!downloadPath) {
      tsvscode.postMessage({
        type: 'onError',
        value: 'Folder for downloading tasks must be set'
      });
      return;
    }
    
    // Send a message to the extension with the courseId and taskSetPath
    tsvscode.postMessage({
      type: 'downloadTaskSet',
      taskSetPath
    });
  }

  function openWorkspace(taskSetName) {
    //Send a message to extension with taskset's name and downloadpath
    tsvscode.postMessage({
      type: 'openWorkspace',
      taskSetName,
      downloadPath
    });
}
  
</script>
<h1>My Courses</h1>

<p>Current download folder: {downloadPath}</p>

<button on:click={() => {
  tsvscode.postMessage({
    type: 'setPath',
    value: ''
  })
}}>Set file download folder</button>

<CourseList
  isExpanded={activeCoursesExpanded}
  toggle={toggleActive}
  toggleCourse={toggleCourse}
  status={"active"}
  courses={coursesJson.filter(c => c.status == "active")}
  moveCourse={moveCourse}
  downloadTaskSet={downloadTaskSet}
  openWorkspace={openWorkspace}/>


<CourseList
  isExpanded={hiddenCoursesExpanded}
  toggle={toggleHidden}
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
