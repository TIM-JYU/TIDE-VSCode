<script lang="ts">
    /**
     * This component manages the sidebar navigation and user authentication.
     * It listens for messages from the extension to handle login and logout functionalities.
     *
     * @author Hannes Koivusipilä
     * @author Stella Palenius
     * @license MIT
     * @date 16.3.2024
     */

    import { onMount } from 'svelte'
    import { type LoginData, MessageType } from '../common/types'
    let isLoggedIn = false
    let loginData: LoginData

    /**
     * Listens to messages from the extension.
     */
    onMount(() => {
        window.addEventListener('message', (event) => {
            const message = event.data
            if (message && message.type === MessageType.LoginData) {
                loginData = message.value
            }
        })

        tsvscode.postMessage({ type: MessageType.RequestLoginData, value: '' })
    })

    /**
     * Posts message for the extension for logging user in.
     */
    function handleLogin() {
        tsvscode.postMessage({
            type: MessageType.Login,
            value: '',
        })
    }

    /**
     * Posts message for extension for logging user out.
     */
    function handleLogout() {
        tsvscode.postMessage({
            type: MessageType.Logout,
            value: '',
        })
    }

    $: isLoggedIn = loginData ? loginData.isLogged : false
</script>

<nav>
    <ul class="nav-list">
        {#if !isLoggedIn}
            <li><button on:click={handleLogin}>Login</button></li>
        {:else}
            <li>
                <button
                    on:click={() => {
                        tsvscode.postMessage({
                            type: MessageType.ShowCourses,
                            value: '',
                        })
                    }}>My Courses</button
                >
            </li>
            <li>
                <button on:click={handleLogout}>Logout</button>
            </li>
        {/if}
        <li>
            <button
                on:click={() => {
                    tsvscode.postMessage({
                        type: MessageType.OpenSettings,
                        value: '',
                    })
                }}>Settings</button
            >
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
