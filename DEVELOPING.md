# Developing

When cloning the repository, run `npm run watch-svelte` to compile the webviews.

## Developing webviews using Svelte

To create a new Svelte component run the script in `/scripts` with the desired name as argument.
This will create the Svelte-file in ./webviews/components directory and the necessary boilerplate in ./webviews/pages directory.
The name provided as argument will also be used as the file prefix in `/out/compiled`.

```sh
./create-webview KissaIstuu
```

To automatically compile Svelte components on when saving, run

```sh
npm run watch-svelte
```

Compiled Svelte-components are saved to ./out/compiled from where they can be used in panels.
