<script lang="ts">
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
          <button on:click={() => { /* Handle My Courses click */ }} style="background: none; border: none; cursor: pointer;">My Courses</button>
        </li>
        <li style="list-style-type: none;">
          <button on:click={() => { /* Handle Settings click */ }} style="background: none; border: none; cursor: pointer;">Settings</button>
        </li>
        <li style="list-style-type: none;">
          <button on:click={handleLogout} style="background: none; border: none; cursor: pointer;">Logout</button>
        </li>
      </ul>
    </nav>
  {/if}
