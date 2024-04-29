<script>
  import { onMount } from 'svelte';
  let showSidebarWelcome = false;
  let isLoggedIn = false;
  let loginData = [];

  /**
  * Listens to messages from the extension
  */
  onMount(() => {
      window.addEventListener('message', (event) => {
          const message = event.data;
          if (message && message.type === 'settingValue') {
              showSidebarWelcome = message.value;
          }
          if (message && message.type ==='json') {
              loginData = message.data;
              if (loginData.login_successful == true) {
                  isLoggedIn = true;
              }
              else {
                isLoggedIn = false;
              }
          }
      });
  });

  /**
   * Posts message for the extension for logging user in
   */
  function handleLogin() {
    tsvscode.postMessage({
      type: 'login',
      value: ''
    })
    isLoggedIn = true;
  }

  /**
   * Posts message fot extension for logging user out
   */
  function handleLogout() {
    tsvscode.postMessage({
      type: 'logout',
      value: ''
    })
    isLoggedIn = false;
  }
</script>
  
{#if !isLoggedIn}
  {#if showSidebarWelcome}
    <div>Welcome to TIDE-extension! Start by logging in.</div>
  {/if}
  <button on:click={handleLogin}>Login</button>
{:else}
  <nav>
    <ul class="nav-list">
      <li>
        <button on:click={() => { tsvscode.postMessage({
          type: 'showCourses',
          value: ''
        })}}>My Courses</button>
      </li>
      <li>
        <button on:click={() => { tsvscode.postMessage({
          type: 'openSettings',
          value: ''
        })}}>Settings</button>
      </li>
      <li>
        <button on:click={handleLogout}>Logout</button>
      </li>
    </ul>
  </nav>
{/if}

<style>
  div {
    color: turquoise;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .nav-list {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>