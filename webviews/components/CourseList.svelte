<script>
    import Menu from './Menu.svelte';
    import MenuItem from './MenuItem.svelte';
    
    export let status; // "active" or "hidden"
    export let courses; // array of courses
    export let moveCourse; // function to move a course between lists
    export let downloadTaskSet; // function to download a task set
    export let openWorkspace; // function to open a workspace for task set
    export let isExpanded; // "true" or "false"
    export let toggle; // function to hide or show "active" or "hidden" category for courses
    export let toggleCourse; // function to collapse or expand the course information
  
    /**
     * Gets the opposite course status.
     */
    function getOppositeStatus() {
      return status === "active" ? "hidden" : "active";
    }

    /**
     * Get's the text according to the course status.
     */
    function statusText() {
        return status == "hidden" ? "Hidden" : "Active";
    }
  </script>
  
  <button class="button-header" on:click={toggle(status)}>
    {statusText()} Courses
    <span class="arrow {!isExpanded ? 'down-arrow' : 'left-arrow'}">&#8250;</span>
  </button>


  {#if isExpanded}
    {#each courses as course (course.id)}
      <div class="course-box">
        <header>
          <p class="courseTitle">{course.name}</p>
            <Menu>
              <span slot='toggle'>&#8942;</span>
              <MenuItem>
                <a href="#?" on:click={() => moveCourse(course, getOppositeStatus())}>
                  Move to {getOppositeStatus()} courses
                </a>
              </MenuItem>
            </Menu>
        </header>
      <div>
        <a class="link" href={"https://tim.jyu.fi/view/" + course.path}>Open material page</a>
      </div>
      <button
        class="expand-collapse-button"
        aria-expanded={course.expanded}
        on:click={() => toggleCourse(course.id)}>
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
                <th></th>
              </tr>
            </thead>
              <tbody>
              {#each course.task_docs as taskset}
                <tr>
                  <td>{taskset.name}</td>
                  <td>{taskset.tasks.length}</td>
                  <td>6/8</td>
                  <td><button class="download-button" on:click={() => downloadTaskSet(taskset.path)}>Download</button></td>
                  <td><button class="open-workspace" on:click={() => openWorkspace(taskset.name)}>Open in workspace</button></td>
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
    max-width: 85%;
    min-width: 24em;
    width: 100%;
    box-sizing: border-box;
  }

  .courseTitle {
    margin-left: 1.5rem;
    margin-top: 1.5rem;
  }

  .link {
    margin-left: 1.5rem;
    font-size: 0.9rem;
    color: #007acc;
  }

  .link:hover {
    text-decoration: underline;
  }

  .download-button, .open-workspace {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    font-size: small;
    cursor: pointer;
  }

  .download-button:active, .open-workspace:active {
    background:#004d80;
  }
  
  *,
  *::before,
  *::after {
    box-sizing: border-box;
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
    max-width: 100%;
    overflow-x: auto;
    box-sizing: content-box;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    box-sizing: content-box;
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
  