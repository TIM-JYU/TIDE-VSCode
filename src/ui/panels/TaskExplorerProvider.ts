import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import { Course } from '../../common/types'
import CourseTaskTreeItem from './CourseTaskTreeItem'
import { getProgressSvgRectangle } from '../utils'
import { initCsharpProjects } from '../../utilities/csharp'
import Tide from '../../api/tide'

// Class for handling TreeView data
export class CourseTaskProvider implements vscode.TreeDataProvider<CourseTaskTreeItem> {
  // courseData holds the parent nodes for each course
  // each parent node holds the directories and tasks of the courses as children
  private courseData: CourseTaskTreeItem[] = []
  // TreeView either shows downloaded courses or tasks from a selected course
  private treeViewMode: 'Courses' | 'Tasks' = 'Courses'

  // with the vscode.EventEmitter we can refresh our  tree view
  private m_onDidChangeTreeData: vscode.EventEmitter<CourseTaskTreeItem | undefined> =
    new vscode.EventEmitter<CourseTaskTreeItem | undefined>()
  // and vscode will access the event by using a readonly onDidChangeTreeData (this member has to be named like here, otherwise vscode doesnt update our treeview.
  readonly onDidChangeTreeData?: vscode.Event<CourseTaskTreeItem | undefined> =
    this.m_onDidChangeTreeData.event

  // Initialize icon paths for treeItems
  private iconWarningStatus = path.join(
    __filename,
    '..',
    '..',
    '..',
    '..',
    'media',
    'status-warning.svg',
  )
  private iconTimCourse = path.join(
    __filename,
    '..',
    '..',
    '..',
    '..',
    'media',
    'timlogovscode.png',
  )
  private iconTaskFile = path.join(
    __filename,
    '..',
    '..',
    '..',
    '..',
    'media',
    'ph-icons',
    'file-text-light.svg',
  )
  private iconSupplementaryStatus = path.join(
    __filename,
    '..',
    '..',
    '..',
    '..',
    'media',
    'ph-icons',
    'file-plus-thin.svg',
  )

  private iconPathByProgress(currentPoints: number, maxPoints: number): string | undefined {
    if (!maxPoints) {
      return
    } else {
      const progress = Math.max(0, Math.min(Math.floor((100 * currentPoints) / maxPoints), 100))
      const iconSvg = getProgressSvgRectangle(progress, 100)
      const tmpIconPath = path.join(
        __filename,
        '..',
        '..',
        '..',
        '..',
        'media',
        `progress-rectangle-${progress}.svg`,
      )
      // TODO: check if this works in prod and can be done without temporary files
      // For debugging, comment out the file exists check
      if (!fs.existsSync(tmpIconPath)) {
        fs.writeFileSync(tmpIconPath, iconSvg)
      }
      return tmpIconPath
    }
  }

  // Register commands required to handle the treeview
  constructor() {
    // Treeview commands
    vscode.commands.registerCommand('tide.itemClicked', (item) => this.itemClicked(item))
    vscode.commands.registerCommand('tide.refreshTree', () => this.refreshTree())
    vscode.commands.registerCommand('tide.wipeTreeAndEditors', () => this.wipeTreeAndEditors())

    vscode.commands.registerCommand('tide.treeviewShowCourses', () => this.showCourses())

    // Context menu commands (right-click menu)
    vscode.commands.registerCommand('tide.treeviewMenuOpenTasks', (item) =>
      this.openTasksInThisDir(item),
    )
  }

  // Refresh the current treeview items
  private async refreshTree() {
    // When the treeView is in Course browsing mode
    let loginData = ExtensionStateManager.getLoginData()

    if (loginData.isLogged) {
      if (this.treeViewMode === 'Courses') {
        this.showCourses()
      } else {
        const treeRootItem = this.courseData.at(0)
        if (treeRootItem) {
          treeRootItem.children = []
          this.readCourseDirectory(treeRootItem.path, this.courseData.at(0))
          await treeRootItem.updatePoints()
        }
        this.m_onDidChangeTreeData.fire(undefined)
      }
    } else {
      vscode.window.showErrorMessage('Login to browse courses and tasks!')
    }
  }

  // Set the treeView to course browsing mode
  private showCourses() {
    // TreeView is reset -> Mode = Courses
    this.treeViewMode = 'Courses'

    let loginData = ExtensionStateManager.getLoginData()
    if (loginData.isLogged) {
      this.courseData = []
      this.readRootDirectory()
      // This needs to be called in order to show the data in the treeview
      this.m_onDidChangeTreeData.fire(undefined)
    } else {
      vscode.window.showErrorMessage('Login to browse courses and tasks!')
    }
  }

  // Empty treeview and close files after a user logs out
  private async wipeTreeAndEditors() {
    this.courseData = []
    this.m_onDidChangeTreeData.fire(undefined)

    // Closes open editors
    const tabGroups = vscode.window.tabGroups.all
    tabGroups.forEach(async (group) => {
      await vscode.window.tabGroups.close(group)
    })
  }

  // Right-click Option
  // Opens all tasks found in the children of the given item
  private openTasksInThisDir(item: CourseTaskTreeItem) {
    let currentItem = item
    // item might be a dir or a file
    if (currentItem.type === 'dir') {
      currentItem.children.forEach((child) => {
        this.openTasksInThisDir(child)
      })
    } else {
      try {
        // Open the document
        vscode.workspace.openTextDocument(item.path).then((document) => {
          // Using this we can open multiple files on the same window
          const showOptions: vscode.TextDocumentShowOptions = {
            preserveFocus: false,
            preview: false,
          }
          // Open the document in the editor
          vscode.window.showTextDocument(document, showOptions).then((editor) => {
            // first 2 rows are informational, task code starts at row 3(index 2)
            let pos = new vscode.Position(2, 0)
            // set cursos
            editor.selection = new vscode.Selection(pos, pos)
            // set focus to opened editor
            editor.revealRange(new vscode.Range(pos, pos))
          })
        })
      } catch {
        vscode.window.showErrorMessage('Error opening documents. Refreshing treeview')
        this.refreshTree()
      }
    }
  }
  // OBSOLETE
  // Reads downloaded course directories, creates the parent nodes into courseData,
  // and starts reading each courses contents with the recursive function readCourseDirectory
  // ACTUAL
  // Reads the download path set by the user in settings and created course nodes for each course directory
  // does not create nodes for non-tide-course directories or files
  // shows only active courses, ignores hidden courses
  private readRootDirectory() {
    const rootDir: string | undefined = vscode.workspace
      .getConfiguration()
      .get('TIM-IDE.fileDownloadPath')
    if (!rootDir) {
      vscode.window.showErrorMessage(
        'File Download Path is not set! Please set it in the settings.',
      )
      return
    }

    const extensionCourseData = ExtensionStateManager.getCourses()
    if (!extensionCourseData) {
      vscode.window.showInformationMessage(
        'Course data was not found. Make sure you have TIDE courses added in TIM, and refresh course data from the My Courses- page!',
      )
      return
    }

    extensionCourseData
      .filter((course) => course.status === 'active')
      .forEach((course) => {
        // Find all files and directories in the File Download Path set by the user
        const coursePath = path.join(rootDir, course.name)
        if (!coursePath || !fs.existsSync(coursePath)) {
          return
        }
        // If a course was found, create a root node
        this.courseData.push(new CourseTaskTreeItem('Course: ' + course.name, coursePath, 'root'))
      })
  }

  /**
   * Reads the given path and adds found files and directories as the given parents children
   * recursively until all nodes have been added
   * All files and directories are added whether they are a part of a course or not
   * @param dir Current directory path
   * @param parent TreeItem to be given new nodes as children
   */
  private readCourseDirectory(dir: string, parent: CourseTaskTreeItem | undefined) {
    let containsCsproj = false
    if (dir === undefined) {
      vscode.window.showErrorMessage('Error while reading course path!')
    } else if (parent === undefined) {
      vscode.window.showErrorMessage('Error reading course directory: Undefined parent')
    } else {
      let courseDirPath: string = dir
      if (this.pathExists(courseDirPath)) {
        // Find all elements in the directory and go through them in a loop
        fs.readdirSync(courseDirPath).forEach((element) => {
          let current = path.join(courseDirPath, element)
          // If the current element is a file, add it to the parents children and stop the recursion
          if (fs.statSync(current).isFile()) {
            if (current.endsWith('.timdata')) {
              // .timdata files are read when task sets are downloaded so we can ignore them here
            } else {
              // Create a new node and add it to its parents children
              let newNode = new CourseTaskTreeItem(element, current, 'file')
              parent.addChild(newNode)

              if (current.endsWith('.csproj')) {
                containsCsproj = true
              }
            }
            // If the current element is a directory, add it to the parents children and continue the recursion
          } else {
            // Create a new node and add it to its parents children
            let newNode = new CourseTaskTreeItem(element, current, 'dir')
            parent.addChild(newNode)
            // Continue recursion
            this.readCourseDirectory(current, newNode)
          }
        })
      } else {
        vscode.window.showErrorMessage("Directory path doesn't exist!")
      }
    }

    if (containsCsproj) {
      initCsharpProjects(dir)
    }
  }

  // Checks if a given path exists
  // Returns true if succeeds, false on error
  private pathExists(path: string): boolean {
    try {
      fs.accessSync(path)
    } catch (_error) {
      return false
    }
    return true
  }

  // Handles clicks on treeview items
  public async itemClicked(item: CourseTaskTreeItem) {
    // When the treeView is in Course browsing mode:
    // Show the taskSets and their statuses for the clicked course
    if (this.treeViewMode === 'Courses') {
      this.treeViewMode = 'Tasks'
      this.courseData = []
      let newLabel = item.label?.toString().replace('Course: ', '') ?? ''
      let newPath = item.path
      this.courseData.push(new CourseTaskTreeItem(newLabel, newPath, 'dir'))
      let rootItem = this.courseData.at(0)
      if (rootItem) {
        // Automaticly expand the root folder when opening a course from the treeView
        rootItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
      }
      this.readCourseDirectory(item.path, this.courseData.at(0))
      const treeRootItem = this.courseData.at(0)
      if (treeRootItem) {
        await treeRootItem.updatePoints()
      }
      this.m_onDidChangeTreeData.fire(undefined)

      vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.file(item.path),
        name: item.label?.toString().replace('Course: ', '') ?? '',
      })
    } else {
      // When the treeView is in TaskSet browsing mode:
      // Open the clicked task file, ignore clicks on directories

      // Try to open the document
      try {
        // When a dir is clicked do nothing
        if (item.type === 'dir') {
          return
        }
        // When a file is clicked
        // Open the document
        vscode.workspace.openTextDocument(item.path).then((document) => {
          // After opening the document
          vscode.window.showTextDocument(document).then((editor) => {
            // first 2 rows are informational, task code starts at row 3(index 2)
            let pos = new vscode.Position(2, 0)
            // set cursos
            editor.selection = new vscode.Selection(pos, pos)
            // set focus to opened editor
            editor.revealRange(new vscode.Range(pos, pos))
          })
        })
      } catch (_error) {
        // Catch errors trying to open a document and refresh tree
        vscode.window.showErrorMessage('Error, document might be deleted. Refreshing...')
        this.refreshTree()
      }
    }
  }

  /**
   * This method needs to be implemented in order to show the TreeItems in the TreeView
   * The result is given the information inside our implementation of a TreeviewItem (CourseTaskTreeItem)
   * and a status icon is calculated based on current task points and max points
   * @param item The item that is going to be shown
   * @returns a vscode.TreeItem that can be shown in a treeview component
   */
  public async getTreeItem(item: CourseTaskTreeItem): Promise<vscode.TreeItem> {
    let title = item.label ? item.label.toString() : ''
    let result = new vscode.TreeItem(title, item.collapsibleState)

    // If TreeView Mode is Courses, give all TIDE Courses the tim logo icon
    if (this.treeViewMode === 'Courses') {
      // Set the tim icon for all courses
      result.iconPath = this.iconTimCourse
      const itemCourse = ExtensionStateManager.getCourses().find(
        (course) => course.name === item.label?.toString().replace(/^Course:\s+/, ''),
      )
      if (itemCourse) {
        const taskSetAmount = itemCourse.taskSets.length
        let downloadedTaskSetsAmount = 0
        itemCourse.taskSets.forEach((taskSet) => {
          if (taskSet.downloadPath) {
            downloadedTaskSetsAmount++
          }
        })
        result.description = downloadedTaskSetsAmount + '/' + taskSetAmount + ' TaskSets Downloaded'
      }
    } else {
      const fileCheck = await item.isCourseDirOrFile()

      if (fileCheck) {
        if (item.type === 'file') {
          const taskInfo = await Tide.getTaskInfo(item.path, true)
          if (taskInfo) {
            let taskFiles = taskInfo.task_files
            let labelString = item.label?.toString() ?? ''

            // Only give points icons to the task_file files!
            if (taskFiles.some((taskFile) => taskFile.file_name.includes(labelString))) {
              result.tooltip = 'Submittable file'
              result.iconPath = this.iconTaskFile
            } else {
              // Give supplementary file icon to supplementary files
              result.tooltip = 'Supplementary file'
              result.iconPath = this.iconSupplementaryStatus
            }
          }
        } else {
          result.tooltip =
            item.currentPoints !== undefined && item.maxPoints
              ? `${item.currentPoints} / ${item.maxPoints} points received for TIM-IDE tasks`
              : 'No points available'
          result.iconPath = this.iconPathByProgress(item.currentPoints, item.maxPoints)
        }
      } else {
        const itemType = item.type === 'dir' ? 'directory' : item.type
        result.tooltip = `Not a Tide ${itemType}`
      }
    }

    result.command = {
      command: 'tide.itemClicked',
      title: title,
      arguments: [item],
    }
    result.contextValue = item.contextValue
    return result
  }

  // Returns treeview items children
  public getChildren(
    element: CourseTaskTreeItem | undefined,
  ): vscode.ProviderResult<CourseTaskTreeItem[]> {
    if (element === undefined) {
      return this.courseData
    } else {
      return element.children
    }
  }

  // TODO: rename, fix or remove
  public isCourse(dirName: string): Course | undefined {
    let result = undefined
    const courseData = ExtensionStateManager.getCourses()
    courseData.forEach((element) => {
      // Are course directories always lowercase only?
      if (element.name.toLocaleLowerCase() === dirName) {
        result = element
      }
    })
    return result
  }
}
