<script lang="ts">
    import { onMount } from "svelte";

    let settings = {
        cliPath: "",
    };

    function saveChanges() {
        tsvscode.postMessage({
            type: "saveSettings",
            value: settings,
        });
    }

    function fetchExistingSettings() {
        tsvscode.postMessage({
            type: "fetchCurrentCliPath",
            value: "",
        });
    }


    window.addEventListener("message", (event) => {
        const msg = event.data;
        settings = msg;
    });

    onMount(() => {
        fetchExistingSettings();
    });
</script>

<label>CLI path <input type="text" bind:value={settings.cliPath} /></label>

<button on:click={saveChanges}>Save changes</button>

<h3>DEBUG: Settings object</h3>
<ul>
    {#each Object.entries(settings) as [key, value]}
        <li>{key}: {value}</li>
    {/each}
</ul>
