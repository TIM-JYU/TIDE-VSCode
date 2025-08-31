import * as vscode from 'vscode'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import Logger from '../../utilities/logger'
import path from 'path'
import Tide from '../../api/tide'

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
  public async isCourseDirOrFile(): Promise<boolean> {
    let result = false
    if (this.type === 'file') {
      try {
        const itemTaskInfo = await Tide.getTaskInfo(this.path, true)
        if (itemTaskInfo) {
          itemTaskInfo.task_files.forEach((taskFile) => {
            if (this.label && taskFile.file_name.includes(this.label.toString())) {
              result = true
            }
          })
          if (result === false) {
            itemTaskInfo.supplementary_files.forEach((supFile) => {
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
      // Search TaskInfo for the directory name in ide_task_id or path
      const taskInfo = ExtensionStateManager.getTaskInfo()
      const labelString = this.label?.toString()

      if (!labelString) {
        return result
      }
      taskInfo.some((element) => {
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
        taskInfo.some((data) => {
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
  public async updatePoints() {
    if (this.type !== 'dir' || !(await this.isCourseDirOrFile())) {
      this.currentPoints = 0
      this.maxPoints = 0
      return
    }

    let currentPointsSum = 0
    let maxPointsSum = 0

    const taskInfo = await Tide.getTaskInfo(this.path, true)
    if (taskInfo) {
      const savedPoints = ExtensionStateManager.getTaskPoints(
        taskInfo.path,
        taskInfo.ide_task_id,
      )
      currentPointsSum = savedPoints?.current_points ?? 0
      maxPointsSum = taskInfo.max_points ?? 0
    }

    await Promise.all(
      this.children.filter(child => child.type === 'dir').map(async (child) => {
        await child.updatePoints()
        currentPointsSum += child.currentPoints
        maxPointsSum += child.maxPoints
      }),
    )

    this.maxPoints = maxPointsSum
    this.currentPoints = currentPointsSum
  }
}
