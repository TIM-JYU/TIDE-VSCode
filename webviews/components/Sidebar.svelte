<script lang="ts">
    import { onMount } from 'svelte';
    let showSidebarWelcome = false;
    
    // Listen for messages from the extension
    onMount(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message && message.type === 'settingValue') {
                showSidebarWelcome = message.value;
            }
        });
    });
    let isLoggedIn = false;

    function handleLogin() {
      isLoggedIn = true;
    }
  
    function handleLogout() {
      isLoggedIn = false;
    }
</script>

<style>
  button {
      text-align: left;
  }
  div {
      color: turquoise;
  }
</style>
  
  {#if !isLoggedIn}
    {#if showSidebarWelcome}
      <div>Welcome to TIDE-extension! Start by logging in.</div>
    {/if}
    <button on:click={handleLogin} style="background: none; border: none; cursor: pointer;">Login</button>
  {:else}
    <nav>
      <ul style="padding: 0; margin: 0;">
        <li style="list-style-type: none;">
          <button on:click={() => { tsvscode.postMessage({
            type: 'showCourses',
            value: ''
          })}} style="background: none; border: none; cursor: pointer;">My Courses</button>
        </li>
        <li style="list-style-type: none;">
          <button on:click={() => { tsvscode.postMessage({
            type: 'openSettings',
            value: ''
          }) }} style="background: none; border: none; cursor: pointer;">Settings</button>
        </li>
        <li style="list-style-type: none;">
          <button on:click={handleLogout} style="background: none; border: none; cursor: pointer;">Logout</button>
        </li>
      </ul>
    </nav>
  {/if}

  <!-- 'Example of how sending a message from webview to VS Code api works' -->
  <button on:click={() => {
      tsvscode.postMessage({
        type: 'showTaskPanel',
        value: ''
      })
  }}>Show task panel</button>
