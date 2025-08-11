import * as vscode from 'vscode'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import Logger from '../../utilities/logger'
import path from 'path'

// Class for handling the treeview items
export default class CourseTaskTreeItem extends vscode.TreeItem {
  readonly path: string
  readonly type: string | undefined
  currentPoints: number
  maxPoints: number

  // children represent branches, which are also items
  public children: CourseTaskTreeItem[] = []

  // the label represent the text which is displayed in the tree
  // and is passed to the base class
  // path = path to file or dir
  // type = type of item (file or dir)
  // TODO: label: vscode.TreeItemLabel
  constructor(label: string, itemPath: string, type: 'file' | 'dir' | 'root') {
    super(label)
    this.label
    this.path = itemPath
    this.type = type
    this.currentPoints = 0
    this.maxPoints = 0
    if (this.type === 'file' || this.type === 'root') {
      this.collapsibleState = vscode.TreeItemCollapsibleState.None
      this.contextValue = ''
    } else {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
      this.contextValue = 'folder'
    }
  }

  // a public method to add childs, and with additional branches
  // we want to make the item collabsible
  public addChild(child: CourseTaskTreeItem) {
    // this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    this.children.push(child)
  }

  /**
   * Checks if the CourseTaskTreeItem is a file or a directory that is a part of a Tide-Course
   * @returns true if the item is a part of a Tide-Course, false otherwise
   */
  public isCourseDirOrFile(): boolean {
    let result = false
    if (this.type === 'file') {
      try {
        const itemTimData = ExtensionStateManager.getTimDataByFilepath(this.path)
        if (itemTimData) {
          itemTimData.task_files.forEach((taskFile) => {
            if (this.label && taskFile.file_name.includes(this.label.toString())) {
              result = true
            }
          })
          if (result === false) {
            itemTimData.supplementary_files.forEach((supFile) => {
              if (this.label && supFile.file_name.includes(this.label.toString())) {
                result = true
              }
            })
          }
        }
        // Java tehtävä tiedostojen tunnistus!
        // C# tehtävien csproj tiedostojen tunnistus!
        if (result === false) {
        }
      } catch (error) {
        Logger.debug(error)
        return result
      }
    } else if (this.type === 'dir') {
      // Search TimData for the directory name in ide_task_id or path
      const timData = ExtensionStateManager.getTimData()
      const labelString = this.label?.toString()

      if (!labelString) {
        return result
      }
      timData.some((element) => {
        Logger.debug(element)
        if (result === true) {
          return
        }
        if (element.ide_task_id === labelString) {
          result = true
        }
        if (element.task_directory === labelString) {
          result = true
        }
        if (element.task_files.some((taskFile) => taskFile.file_name.includes(labelString))) {
          result = true
        }
        const pathParts = element.path.split(path.posix.sep)
        if (pathParts.includes(labelString)) {
          result = true
        }
      })
      if (result === false) {
        const courseData = ExtensionStateManager.getCourses()
        courseData.forEach((element) => {
          if (element.name === labelString) {
            result = true
          }
        })
      }
      // C# tehtävien kansioiden tunnistus?
      if (result === false) {
        timData.some((data) => {
          if (result === true) {
            return
          }
          if (data.supplementary_files.some((file) => file.file_name.includes(labelString))) {
            result = true
          }
        })
      }
    }
    return result
  }

  /**
   * Updates current and max points to the called treeItem and ALL ITS CHILDRENS treeItems recursively
   * Make sure this is never called recursively outside of here!
   * It is recommended to call this with the TreeViews root item/items, so the entire tree updates at once
   */
  public updatePoints() {
    let currentPointsSum = 0
    let maxPointsSum = 0
    if (this.children.length > 0) {
      this.children.forEach((child) => {
        child.updatePoints()
        currentPointsSum += child.currentPoints
        maxPointsSum += child.maxPoints
      })
    } else {
      if (this.type === 'file') {
        const taskTimData = ExtensionStateManager.getTimDataByFilepath(this.path)
        if (taskTimData) {
          // If it turns out there is a possibility of more than 1 task_file, refactor this to take it into account!
          let taskFiles = taskTimData.task_files
          let labelString = this.label?.toString() ?? ''

          // Only give points to the task_file file!
          if (taskFiles.some((taskFile) => taskFile.file_name.includes(labelString))) {
            if (taskTimData.max_points) {
              maxPointsSum = taskTimData.max_points
            }

            const savedPoints = ExtensionStateManager.getTaskPoints(
              taskTimData.path,
              taskTimData.ide_task_id,
            )
            const parsedPoints = savedPoints?.current_points
            if (parsedPoints === null || parsedPoints === undefined) {
              currentPointsSum = 0
            } else {
              currentPointsSum = parsedPoints
            }
          } else {
            currentPointsSum = 0
            maxPointsSum = 0
          }
        }
      } else {
        currentPointsSum = 0
      }
    }
    this.maxPoints = maxPointsSum
    this.currentPoints = currentPointsSum
  }
}
