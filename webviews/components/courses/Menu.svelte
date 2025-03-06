<script lang="ts">
  interface Props {
    toggle?: import('svelte').Snippet;
    menucontent?: import('svelte').Snippet;
  }

  let { toggle, menucontent }: Props = $props();
  // without these (empty) tags, svelte language server shows errors else where
</script>
<!-- 
@component
This component creates a on hover menu with a toggle button and menu content.
From Svelte.dev On Hover Menu: https://svelte.dev/repl/2f5ab01c05f84790bcb94a0f79afee7b?version=3.46.2
 -->

<div>
  <button>
    {@render toggle?.()}
  </button>
  <menu>
    {@render menucontent?.()}
  </menu>
</div>

<style>
  div {
    transition: all 0.5s ease;
  }

  button {
    border: none;
    background-color: inherit;
    color: white;
    font-size: medium;
  }

  menu {
    position: absolute;
    display: none;
    margin-block-start: 0;
    padding: 0;
    border: 1px solid black;
    background-color: #272626;
    visibility: hidden;
    opacity: 0;
    right: 1%;
    overflow: hidden;
  }

  div:hover,
  div:focus,
  div:hover > menu,
  div:focus > menu {
    display: block;
    visibility: visible;
    opacity: 1;
  }
</style>
