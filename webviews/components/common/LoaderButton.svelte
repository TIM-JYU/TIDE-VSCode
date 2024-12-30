<script lang="ts">
  import Spinner from "./Spinner.svelte"

  export let onClick: () => void
  export let loading: boolean
  export let text: string
  export let textWhileLoading
</script>

<!--
@component
A button that can be toggled to show a spinner and optionally an alternative 
text.
-->

<button on:click={onClick}>
  {#if loading}
  {textWhileLoading ?? text}
  <Spinner/>
  {:else}
  {text}
  {/if}
</button>
