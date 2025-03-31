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
  .loader-button-blue {
    background-color:rgb(0, 113, 189);
    color: rgb(230, 230, 230);
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
  }

  .loader-button-blue:hover, .loader-button-blue.loading {
    background-color: #005F9E;
  }

  .loader-button-grey {
    background-color:rgb(54, 54, 54); 
    color: rgb(230, 230, 230);
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
  }

  .loader-button-grey:hover, .loader-button-grey.loading {
    background-color:rgb(44, 44, 44);
  }


</style>


