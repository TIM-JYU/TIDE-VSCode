# TIM-IDE - TIM integration for VSCode

Tämän lisäosan avulla on mahdollista ladata ja palauttaa
TIM-ohjelmointitehtäviä suoraan Visual Studio Code -kehitysympäristössä. Ohje
suomeksi:
https://tim.jyu.fi/view/kurssit/tie/proj/2024/tide/dokumentit/kayttoohjeet/tim-vscode-lisaosan-kayttoohjeet

This extension allows you to upload and submit TIM programming tasks directly
in the Visual Studio Code. Guide in English:
https://tim.jyu.fi/view/kurssit/tie/proj/2024/tide/dokumentit/kayttoohjeet/tim-vscode-lisaosan-kayttoohjeet/en-US

## Development

### Quick start guide

1. Clone the repository
2. Install the dependencies
- Normally: run `npm install`
- Workaround for [npm issue #4263](https://github.com/npm/cli/issues/4263):
    - remove node_modules
    - remove package-lock.json
    - run `npm cache clean -f`
    - run `npm install`
3. Compile the Svelte components by running `npm run svelte-compile` or `npm run svelte-watch`
4. Open the project in Visual Studio Code
5. Launch the `Run Extension` configuration from the `Run and Debug` tab

NOTE: When making changes to the code, it is necessary to run either
`Developer: Reload Webviews` or `Developer: Reload Window` in the Visual Studio
Code (the development instance) command palette (ctrl + shift + p) before the
changes have any effect.

NOTE: The Visual Studio Code extension requires
[TIDE-CLI](https://github.com/TIM-JYU/TIDE-CLI) to be installed in order to
function properly.

See the [helpful links](#helpful-links) section for tool documentation and extension user guide.

### Svelte

The extension uses Svelte as its UI framework. The documentation for the
framework can be found [here](https://svelte.dev/docs/svelte).

The codebase uses Svelte 4, and not the latest version 5, i.e. runes syntax
introduced in the latter one can not be used.

#### Creating a new webview

To create a new Svelte component run (while in the project root directory)
`scripts/create-webview.sh` with the desired name as an argument, e.g.
`scripts/create-webview.sh MyGloriousWebview`. This will create the Svelte-file
in `webviews/components` directory and the necessary boilerplate in
`webviews/pages` directory. The name provided as argument will also be used as
the file prefix in `out/compiled`.

#### Compiling Svelte components

Svelte components need to be recompiled in order for any changes made to them
to take place. This can be done by running `npm run svelte-watch` inside the
project directory. This launches a watcher that will, as long as it runs,
automatically compile any components affected by changes made to the source
files. Compiled Svelte-components are saved to `./out/compiled` from where they
can be used inside panels.

In its current state, the `svelte-watch` and `svelte-compile` run configurations cause warnings when
ran, but they do not affect the compiling process. The warnings in question are
about importing svelte components, e.g.

```
bundles webviews/pages/TaskPanel.ts → out/compiled/TaskPanel.js...
(!) [plugin typescript] webviews/pages/TaskPanel.ts (1:17): @rollup/plugin-typescript TS2307: Cannot find module '../components/taskPanel/TaskPanel.svelte' or its corresponding type declarations.
/home/hannes/work/koodi/TIDE-VSCode/webviews/pages/TaskPanel.ts:1:17

1 import App from '../components/taskPanel/TaskPanel.svelte'
```


### Helpful links

- [Svelte documentation](https://svelte.dev/docs/svelte)
- [Visual Studio Code Extension API documentation](https://code.visualstudio.com/api)
- [Tide-extension user guide (Finnish)](https://tim.jyu.fi/view/kurssit/tie/proj/2024/tide/dokumentit/kayttoohjeet/tim-vscode-lisaosan-kayttoohjeet)
