<script>
  import Menu from './Menu.svelte'
  import MenuItem from './MenuItem.svelte'
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

  function moveToActive(course) {
    course.status = "active";
    courses = [...courses];
  }

  function moveToHidden(course) {
    course.status = "hidden";
    courses = [...courses];
  }

  //let courseExpanded = new Array(courses.length).fill(false);

  function toggleCourse(courseId) {
  const courseIndex = courses.findIndex(course => course.id === courseId);
  if (courseIndex !== -1) {
    courses[courseIndex].expanded = !courses[courseIndex].expanded;
  }
}
  
</script>
<p>{coursesJson} haloo</p>
<h1>My Courses</h1>

<p>Current download folder: {downloadPath}</p>

<button on:click={() => {
  tsvscode.postMessage({
    type: 'setPath',
    value: ''
  })
}}>Set file download folder</button>

<!-- Active Courses Section -->
<button class="button-header" on:click={toggleActive}>
  Active Courses
  <span class="arrow {!activeCoursesExpanded ? 'down-arrow' : 'left-arrow'}">&#8250;</span>
</button>

{#if activeCoursesExpanded}
  {#each courses.filter(course => course.status === 'active') as course, i}
      <div class="course-box">
          <header>
              <p class="courseTitle">{course.name}</p>
                  <ul>
                      <li>
                          <Menu>
                              <span slot='toggle'>&#8942;</span>
                              <MenuItem>
                                  <a href="#?" on:click={() => moveToHidden(course)}>Move to hidden courses</a>
                              </MenuItem>
                          </Menu>
                      </li>
                  </ul>
          </header>
          <div>
            <a class="link" href="https://tim.jyu.fi/">Open material page</a>
          </div>
          <button
              class="expand-collapse-button"
              aria-expanded={course.expanded}
              on:click={() => toggleCourse(course.id)}
          >
              <span class="arrow {!course.expanded ? 'down-arrow' : 'up-arrow'}">&#9660;</span>
          </button>
          {#if course.expanded}
              <div class="course-content">
                  <table>
                      <thead>
                          <tr>
                              <th>Task set</th>
                              <th>Number of exercises</th>
                              <th>Points</th>
                              <th></th>
                          </tr>
                      </thead>
                      <tbody>
                          {#each course.exerciseWeeks as { week, exercises }}
                              <tr>
                                  <td>{week}</td>
                                  <td>{exercises.length}</td>
                                  <td>6/8</td> <!-- Example user points -->
                                  <td><button class="download-all-button">Download</button></td>
                              </tr>
                          {/each}
                      </tbody>
                  </table>
              </div>
          {/if}
      </div>
  {/each}
{/if}

<!-- Hidden Courses Section -->
<button class="button-header" on:click={toggleHidden}>
  Hidden Courses
  <span class="arrow {!hiddenCoursesExpanded ? 'down-arrow' : 'left-arrow'}">&#8250;</span>
</button>

{#if hiddenCoursesExpanded}
  {#each courses.filter(course => course.status === 'hidden') as course, i}
    <div class="course-box">
      <header>
        <p class="courseTitle">{course.name}</p>
          <ul>
            <li>
              <Menu>
                <span slot='toggle'>&#8942;</span>
                <MenuItem>
                  <a href="#?" on:click={() => moveToActive(course)}>Move to active courses</a>
                </MenuItem>
              </Menu>
            </li>
          </ul>
      </header>
      <div>
        <a class="link" href="https://tim.jyu.fi/">Open material page</a>
      </div>
      <button
      class="expand-collapse-button"
      aria-expanded={course.expanded}
      on:click={() => toggleCourse(course.id)}
  >
      <span class="arrow {!course.expanded ? 'down-arrow' : 'up-arrow'}">&#9660;</span>
  </button>
  {#if course.expanded}
      <div class="course-content">
          <table>
              <thead>
                  <tr>
                    <th>Task set</th>
                    <th>Number of exercises</th>
                    <th>Points</th>
                    <th></th>
                  </tr>
              </thead>
              <tbody>
                  {#each course.exerciseWeeks as { week, exercises }}
                      <tr>
                          <td>{week}</td>
                          <td>{exercises.length}</td>
                          <td>6/8</td> <!-- Example user points -->
                          <td><button class="download-all-button">Download</button></td>
                      </tr>
                  {/each}
              </tbody>
          </table>
      </div>
  {/if}
    </div>
  {/each}
{/if}


<style>
  :global(body) {
    margin-bottom: 2.5rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
  }

  .button-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 1.4rem;
    font-weight: bold;
    margin-top: 1.5rem;
    padding: 0;
    color: white;
  }

  .arrow {
    margin-left: 8px;
    transition: transform 0.3s ease;
  }

  .left-arrow {
    transform: rotate(90deg);
  }

  .down-arrow {
    transform: rotate(0deg);
  }

  .course-box {
    position: relative;
    background-color: #000000;
    padding-bottom: 3.5rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    font-size: 1.4em;
    max-width: 80%;
    width: 100%;
    box-sizing: border-box;
  }

  .courseTitle {
    margin-left: 1.5rem;
    margin-top: 1.5rem;
  }

  .download-button {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: medium;
    cursor: pointer;
    margin-bottom: 1.5rem;
    margin-left: 1.5rem;
  }

  .link {
    margin-left: 1.5rem;
    font-size: 0.9rem;
    color: #007acc;
  }

  .link:hover{
    text-decoration: underline;
  }

  .download-all-button {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    font-size: small;
    cursor: pointer;
}
  
  *,
	*::before,
	*::after {
  	box-sizing: border-box;
	}

	ul,
	li {
  	margin: 0;
		padding: 0;
	}

  header {
    display: flex;
    justify-content: space-between;
  }
	
	ul {
		list-style-type: none;
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
    color: white;
    background-color: transparent;
    border: none;
    width: 36px;
    height: 36px;
    position: absolute;
    bottom: 0rem;
    left: 50%;
    transform: translateX(-50%);
}

.arrow {
  transition: transform 0.5s ease;
}

.down-arrow {
  transform: rotate(0deg);
}

.up-arrow {
  transform: rotate(-180deg);
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
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: none;
  text-align: center;
  padding: 8px;
}

th {
  background-color: black;
  font-weight: normal;
  font-size: smaller;
}

tbody tr:nth-child(odd) {
  background-color: #222222;
}

tbody tr:nth-child(even) {
  background-color: #444444;
}

</style>
