import * as vscode from 'vscode'
import fs from 'fs'
import path from 'path'
import ExtensionStateManager from '../api/ExtensionStateManager'

export const updateStateFromCourseTimDataFiles = () => {
  const tideFileDownloadPath = vscode.workspace
    .getConfiguration()
    .get<string>('TIM-IDE.fileDownloadPath', '')

  // Find all courses with .timdata files and update the extension state
  console.log('Updating state from .timdata files in', tideFileDownloadPath)
  fs.readdirSync(tideFileDownloadPath)
    .reduce((acc: string[], courseName) => {
      const coursePath = path.join(tideFileDownloadPath, courseName)
      // if (fs.existsSync(coursePath)) {
      //   const timDataFiles = fs.readdirSync(coursePath).filter(file => file === '.timdata')
      //     acc.push(...timDataFiles.map(file => path.join(coursePath, file)))
      //   }
      if (fs.existsSync(path.join(coursePath, '.timdata'))) {
        acc.push(path.join(coursePath))
      }
      return acc
    }, [])
    .forEach((coursePath) => {
      ExtensionStateManager.updateStateFromTimData(coursePath)
    })
  vscode.commands.executeCommand('tide.refreshTree')
}

