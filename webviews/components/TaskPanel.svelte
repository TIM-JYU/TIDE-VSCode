<script lang="ts">
</script>

<div class="task-panel">
    <h2>Exercise or file name</h2>

    <div class="instructions">
        <p>Exercise instructions</p>
    </div>

    <div>
        <a href="https://tim.jyu.fi/">Open exercise in TIM</a>
    </div>

    <hr />

    <div class="points-section">
        <p>Points: Number of points user has</p>
        <button class="return-exercise">Return Exercise</button>
        <p>Passed Tests</p>
        <div class="progress-bar">
            <div class="progress" style="width: 75%"></div>
        </div>
    </div>

    <hr />

    <div class="reset-section">
        <button>Return to Initial Stage</button>
        <button>Fetch Latest Answer</button>
    </div>
</div>

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