<script>
    import { onMount } from 'svelte';

    let timData = null;
    /**
     * Listens for messages from CoursePanel.ts.
     */
    onMount(() => {
    window.addEventListener('message', (event) => {
            const message = event.data;
            if (message && message.type === 'updateTimData') {
                timData = message.value;
            }
        });
    });
    

    function submitTask() {
        tsvscode.postMessage({
            type: 'submitTask'
        });
    }

</script>

{#if timData} <!-- Check if timData is not null -->
    <div class="task-panel">
        {#if timData.header !== null}
            <h2>{timData.header}</h2>
        {:else}
            <h2>{timData.task_files[0].file_name}</h2>
        {/if}
        <div class="instructions">
            {#if timData.stem !== null}
            <p>{timData.stem}</p>
            {:else}
            <p>To see the instructions, please open exercise in TIM.</p>
            {/if}
        </div>

        <div>
            <a href={"https://tim.jyu.fi/view/" + timData.path}>Open exercise in TIM</a>
        </div>

        <hr />

        <div class="points-section">
            <p>Points: Number of points user has</p>
            <button class="submit-exercise" on:click={() => submitTask()}>Submit Exercise</button>
            <p>Passed Tests</p>
            <div class="progress-bar">
                <div class="progress" style="width: 75%"></div>
            </div>
        </div>

        <hr />

        <div class="reset-section">
            <button>Reset Exercise</button>
            <button>Fetch Latest Answer</button>
        </div>
    </div>
{:else}
    <p>Loading...</p>
{/if}

<style>
    .task-panel {
        padding: 20px;
        border: none;
        width: 90%;
        max-width: 600px;
        margin: 20px auto;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .task-panel h2 {
        font-size: 20px;
        margin-bottom: 20px;
    }

    .task-panel p {
        margin-bottom: 10px;
    }

    .progress-bar {
        width: 100%;
        height: 20px;
        background-color: #f0f0f0;
        border-radius: 10px;
        overflow: hidden;
    }

    .progress {
        height: 100%;
        background-color: #28a745;
        transition: width 0.3s ease-in-out;
    }

    .points-section {
        margin-top: 20px;
    }

    .reset-section {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
    }

    .reset-section button {
        width: 160px;
        margin-bottom: 10px;
    }

    .points-section button, .reset-section button {
        margin-right: 10px;
        border: none;
        border-radius: 5px;
        padding: 8px 15px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        background-color: turquoise;
    }

    .reset-section button:hover,
    .points-section button:hover {
        background-color: #33b3a6;
    }

    .task-panel hr {
        margin-top: 20px;
        margin-bottom: 20px;
        border: none;
        border-top: 1px inset #ccc;
        width: 100%;
    }
</style>