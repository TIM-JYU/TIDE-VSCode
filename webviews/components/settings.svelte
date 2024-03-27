<script lang="ts">
    const settings = {
        cliPath: "/kissa/istuu/ja/maukuu",
    };

    function saveChanges() {
        tsvscode.postMessage({
            type: "saveSettings",
            value: settings,
        });
    }
</script>

<label>CLI path <input type="text" bind:value={settings.cliPath} /></label>

<button on:click={saveChanges}>Save changes</button>
