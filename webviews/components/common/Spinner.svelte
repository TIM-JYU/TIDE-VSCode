<script lang="ts"></script>

<div class="spinner"></div>

<style>
  .spinner {
    width: 0.8em;
    height: 0.8em;
    border: 0.25em solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
