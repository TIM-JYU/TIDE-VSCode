/**
 * Utility functions for managing webviews.
 *
 * This module provides helper functions to generate secure webview content and options within
 * a VSCode extension, including nonce generation for security, webview option configuration,
 * and default HTML content creation for webviews.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 2.5.2024
 */

import * as vscode from 'vscode'

/**
 * From https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts
 */
export function getNonce(): string {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Returns the default options for a webview
 *
 * @param extensionUri - extensionUri used for generating the options
 * @returns Default webview options
 */
export function getWebviewOptions(
  extensionUri: vscode.Uri,
): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,
    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out/compiled')],
  }
}

/**
 * Generates the default html for a webview.
 *
 * @param webview - webview used for generating the html string
 * @param extensionUri - extensionUri used for generating the html string
 * @param fileNamePrefix - file name  prefix of the compiled components in "/out/compiled/" directory
 * @returns [TODO:description]
 */
export function getDefaultHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  fileNamePrefix: string,
): string {
  const styleResetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'reset.css'),
  )
  const styleVSCodeUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'),
  )

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', `compiled/${fileNamePrefix}.js`),
  )
  const styleMainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', `compiled/${fileNamePrefix}.css`),
  )

  // Use a nonce to only allow a specific script to be run.
  const nonce = getNonce()

  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
    <script nonce="${nonce}">
    const tsvscode = acquireVsCodeApi();
    </script>
        </head>
  <body>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`
}
