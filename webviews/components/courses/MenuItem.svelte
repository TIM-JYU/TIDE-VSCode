<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()
  // without these (empty) tags, svelte language server shows errors else where
</script>

<!--
@component
This component is a li part of hover menu.
From Svelte.dev On Hover Menu: https://svelte.dev/repl/2f5ab01c05f84790bcb94a0f79afee7b?version=3.46.2
-->

<li>
  {@render children?.()}
</li>

<style>
  li {
    position: relative;
    display: block;
    padding: 0.5rem;
    transition-duration: 0.5s;
    inline-size: 100%;
    font-size: 14px;
  }

  li:hover,
  li:focus {
    background-color: grey;
    cursor: pointer;
  }
</style>
