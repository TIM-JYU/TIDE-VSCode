import * as vscode from 'vscode'
import Tide from '../api/tide'

export async function initCsharpProjects(coursePath: string): Promise<void> {
  if (!(await checkCsharpDevkitExistsOrPromptInstall())) {
    vscode.window.showErrorMessage(
      'TIM-IDE expects C# Dev Kit to be installed for working with C# projects. Please install it for running and managing C# projects.',
    )
    return
  }

  Tide.initDotnetProjects(coursePath).then(() => {
    vscode.commands.executeCommand('csdevkit.openSolution')
  })
}

export async function checkCsharpDevkitExistsOrPromptInstall(): Promise<boolean> {
  // check if vs code has C# Dev Kit installed
  const csharpDevKit = vscode.extensions.getExtension('ms-dotnettools.csdevkit')
  if (!csharpDevKit) {
    const install = await vscode.window.showInformationMessage(
      'C# Dev Kit is required to work with C# projects. Do you want to install it?',
      'Install',
      'Cancel',
    )
    if (install === 'Install') {
      const terminal = vscode.window.createTerminal('Install C# Dev Kit')
      terminal.sendText('code --install-extension ms-dotnettools.csdevkit')
      terminal.show()

      // wait for the user to install the extension
      const extensionInstalled = await new Promise<boolean>((resolve) => {
        const disposable = vscode.extensions.onDidChange(() => {
          const updatedCsharpDevKit = vscode.extensions.getExtension('ms-dotnettools.csdevkit')
          if (updatedCsharpDevKit) {
            disposable.dispose()
            resolve(true)
          }
        })
      })
      if (extensionInstalled) {
        vscode.window.showInformationMessage('C# Dev Kit has been installed successfully. Please reload the window to activate it.')
        // reload the window to activate the extension
        await vscode.commands.executeCommand('workbench.action.reloadWindow')
      } else {
        vscode.window.showErrorMessage('Failed to install C# Dev Kit. Please try installing it manually from the Extensions view.')
        return false
      }
    } else {
      // user cancelled the installation
      return false
    }
  }

  return true
}
