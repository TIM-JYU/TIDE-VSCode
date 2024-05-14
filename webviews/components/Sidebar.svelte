<script lang="ts">
  import { onMount } from 'svelte';
  import type { LoginData } from '../common/types';
  let isLoggedIn = false;
  let loginData: LoginData;

  /**
  * Listens to messages from the extension.
  */
  onMount(() => {
      window.addEventListener('message', (event) => {
          const message = event.data;
          if (message && message.type ==='loginData') {
              loginData = message.value;
          }
      });

      tsvscode.postMessage({ type: 'requestLoggedInStatus', value: '' })
  });

  /**
   * Posts message for the extension for logging user in.
   */
  function handleLogin() {
    tsvscode.postMessage({
      type: 'login',
      value: ''
    })
  }

  /**
   * Posts message for extension for logging user out.
   */
  function handleLogout() {
    tsvscode.postMessage({
      type: 'logout',
      value: ''
    })
  }

  $: isLoggedIn = loginData ? loginData.isLogged : false;
</script>
  
<nav>
  <ul class="nav-list">
    {#if !isLoggedIn}
      <li><button on:click={handleLogin}>Login</button></li>
    {:else}
      <li>
        <button on:click={() => { tsvscode.postMessage({
          type: 'showCourses',
          value: ''
        })}}>My Courses</button>
      </li>
      <li>
        <button on:click={handleLogout}>Logout</button>
      </li>
    {/if}
    <li>
      <button on:click={() => { tsvscode.postMessage({
        type: 'openSettings',
        value: ''
      })}}>Settings</button>
    </li>
  </ul>
</nav>

<style>
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
