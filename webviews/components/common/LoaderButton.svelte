<script lang="ts">
  // TODO: this component needs styling
  import Spinner from "./Spinner.svelte"

  interface Props {
    onClick: () => void;
    loading: boolean;
    text: string;
    textWhileLoading: any;
  }

  let {
    onClick,
    loading,
    text,
    textWhileLoading
  }: Props = $props();
</script>

<!--
@component
A button that can be toggled to show a spinner and optionally an alternative 
text.
-->

<button onclick={onClick}>
  {#if loading}
  {textWhileLoading ?? text}
  <Spinner/>
  {:else}
  {text}
  {/if}
</button>

