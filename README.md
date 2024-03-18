# tide-vscode README

## Development

### Svelte related things

To automatically compile Svelte components along with extension code, run

```
npm run watch-svelte
```

To create a new Svelte component run the following at project root folder (where the script is located)

```
./create-webview KissaIstuu
```

This will create the Svelte-file in ./webviews/components directory and the necessary boilerplate in ./webviews/pages directory.

Compiled Svelte-components are saved to ./out/compiled from where they can be used in panels (see TestPanel.ts)



