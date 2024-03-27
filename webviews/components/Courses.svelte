<script>
  import Menu from './Menu.svelte'
  import MenuItem from './MenuItem.svelte'

  let activeCoursesExpanded = true;
  let archivedCoursesExpanded = false;

  function toggleActive() {
    activeCoursesExpanded = !activeCoursesExpanded;
  }

  function toggleArchived() {
    archivedCoursesExpanded = !archivedCoursesExpanded;
  }

  // Arrays that store course data
  let activeCourses = [
    { title: "Course 1" },
    { title: "Course 2" },
    { title: "Course 5" }
  ];

  let archivedCourses = [
    { title: "Course 3" },
    { title: "Course 4" },
  ];

  function moveToActive(course) {
    archivedCourses = archivedCourses.filter(c => c !== course);
    activeCourses = [...activeCourses, course];
  }

  function moveToArchived(course) {
    activeCourses = activeCourses.filter(c => c !== course);
    archivedCourses = [...archivedCourses, course];
  }
</script>

<style>
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
    padding: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    font-size: 1.4em;
    max-width: 80%;
    width: 100%;
    box-sizing: border-box;
  }

  .course-box p {
  margin-top: 0;
  padding-top: 0.3rem;
  }

  .download-button {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: medium;
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
</style>

<h1>My Courses</h1>

<!-- Active Courses Section -->
<button class="button-header" on:click={toggleActive}>
  Active Courses
  <span class="arrow {!activeCoursesExpanded ? 'down-arrow' : 'left-arrow'}">&#8250;</span>
</button>

{#if activeCoursesExpanded}
  {#each activeCourses as course}
    <div class="course-box">
      <header>
        <p>{course.title}</p>
        <nav>
          <ul>
            <li>
              <Menu>
                <span slot='toggle'>&#8942;</span>
                <MenuItem>
                  <a href="#?" on:click={() => moveToArchived(course)}>Move to archived courses</a>
                </MenuItem>
              </Menu>
            </li>
          </ul>
        </nav>
      </header>
      <button class="download-button">Download</button>
    </div>
  {/each}
{/if}

<!-- Archived Courses Section -->
<button class="button-header" on:click={toggleArchived}>
  Archived Courses
  <span class="arrow {!archivedCoursesExpanded ? 'down-arrow' : 'left-arrow'}">&#8250;</span>
</button>

{#if archivedCoursesExpanded}
  {#each archivedCourses as course}
    <div class="course-box">
      <header>
        <p>{course.title}</p>
        <nav>
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
        </nav>
      </header>
      <button class="download-button">Download</button>
    </div>
  {/each}
{/if}
