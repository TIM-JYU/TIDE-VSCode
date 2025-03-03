<script lang="ts">
  import Spinner from "./Spinner.svelte";

  interface Props {
    onClick: () => void;
    loading: boolean;
    text: string;
    textWhileLoading: any;
    class?: string; // Accept class as a prop
  }

  let {
    onClick,
    loading,
    text,
    textWhileLoading,
    class: className = ""
  }: Props = $props();
</script>

<button class="loader-button {className}" onclick={onClick}>
  {#if loading}
    {textWhileLoading ?? text}
    <Spinner/>
  {:else}
    {text}
  {/if}
</button>

<style>
  .loader-button {
    background-color: #007ACC;
    color: white;
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
    position: absolute;
    top: 10%;
    right: 16%;
  }

  .loader-button:hover {
    background-color: #005F9E;
  }

  .loader-button.loading {
    background-color: 005F9E;
  }

  @media (max-width: 512px) {
    .loader-button {
      position: relative;  
      top: auto; 
      right: auto;
    }
  }

</style>


