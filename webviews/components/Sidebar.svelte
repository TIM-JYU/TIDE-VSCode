<script lang="ts">
    import { onMount } from 'svelte';
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
    <div>Welcome to TIDE-extension! Start by logging in.</div>
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
            type: 'onError',
            value: 'Settings are not done yet'
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
        type: 'onInfo',
        value: 'This is example of an info message'
      })
  }}>click me</button>