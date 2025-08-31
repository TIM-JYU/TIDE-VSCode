<script lang="ts">
  import Spinner from './Spinner.svelte'

  interface Props {
    onClick: () => void
    loading: boolean
    text?: string
    icon?: string
    title?: string
    textWhileLoading?: string
    class?: string // Accept class as a prop
  }

  let {
    onClick,
    loading,
    text,
    icon,
    textWhileLoading,
    class: className = '',
    title = '',
  }: Props = $props()
</script>

<button class="loader-button {className}" onclick={onClick} {title}>
  {#if loading}
    {textWhileLoading ?? text}
    <Spinner />
  {:else}
    {#if icon}
      <i class={icon} style="margin-right: 0.5em;"></i>
    {/if}
    {#if text}
      {text}
    {/if}
  {/if}
</button>

<style>
  .loader-button-plain {
    background-color: transparent;
    text-align: left;
    color: rgb(197, 197, 197);
    border: none;
    transition: background 0.3s;
  }

  .loader-button-blue {
    background-color: rgb(0, 113, 189);
    color: rgb(230, 230, 230);
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
  }

  .loader-button-blue:hover,
  .loader-button-blue.loading {
    background-color: #005f9e;
  }

  .loader-button-grey {
    background-color: rgb(54, 54, 54);
    color: rgb(230, 230, 230);
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
    min-width: 10em;
  }

  .loader-button-grey:hover,
  .loader-button-grey.loading {
    background-color: rgb(44, 44, 44);
  }

  .fit-content {
    width: fit-content;
  }

  .reload-button {
    background-color: rgb(54, 54, 54);
    color: rgb(230, 230, 230);
    border: none;
    padding: 5px;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 3px;
    min-width: 10em;
  }

  .reload-button:hover,
  .reload-button.loading {
    background-color: rgb(44, 44, 44);
  }
</style>
