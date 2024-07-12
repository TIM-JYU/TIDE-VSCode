// TODO: snake_case to camelCase conversion (either when parsing in ide code or when sending in cli code) to follow typescript naming conventions
export type CourseStatus = 'active' | 'hidden'

/**
 * Represents a course
 */
export interface Course {
  /**
   * Name of the course.
   */
  name: string

  /**
   * ID of the course.
   */
  id: number

  /**
   * The course's virtual path in TIM.
   */
  path: string

  /**
   * List of task sets that are defined as part of the course in TIM.
   */
  task_docs: Array<TaskSet>

  /**
   * User specific status for the course.
   */
  status: CourseStatus

  /**
   * Whether or not the course is expanded in the course list.
   */
  expanded: boolean
  // TODO: does the thing above belong here / is it necessary to keep track of ui state over sessions
}

/**
 * Represents a task set
 */
export interface TaskSet {
  /**
   * Name of the task.
   */
  name: string

  /**
   * ID of the document containing the task/csPlugin.
   */
  doc_id: number

  /**
   * Task set's virtual path in TIM.
   */
  path: string

  /**
   * Tasks of the taskset
   */
  tasks: Array<Task>
}

/**
 * Represents a single task
 */
export interface Task {
  doc_id: number
  // TODO: what data belongs here? current and max points? Data coming from
  // Following is printed by CLI tool:
  //
  // doc_id:
  // 639244
  // header:
  // null
  // ide_task_id:
  // 't8'
  // path:
  // 'kurssit/tie/ohj2/2024k/demot/DemoC1'
  // stem:
  // null
  // task_files:
  // (1) [{…}]
  // type:
  // 'c++/comtest'
}

/**
 * Data included in .timdata
 */
export interface TimData {
  path: string
  type: string
  doc_id: number
  ide_task_id: string
  task_files: TaskFile[]
  stem: string | null
  header: string | null
}

export interface TaskFile {
  task_id_ext: string
  content: string
  file_name: string
  source: string
  user_input: string
  user_args: string
}

/**
 * Data associated with logged in user
 */
export interface LoginData {
  isLogged: boolean
}

/**
 * Messages sent between panels and webviews
 */
export interface WebviewMessage {
  type: MessageType
  value: any
}

/**
 * "type" values for messages sent between panels and webviews
 */
export type MessageType =
  | 'CourseData'
  | 'DownloadTaskSet'
  | 'Login'
  | 'LoginData'
  | 'Logout'
  | 'OnError'
  | 'OnInfo'
  | 'OpenSettings'
  | 'OpenWorkspace'
  | 'RequestLoginData'
  | 'ResetExercise'
  | 'ResetNoneditableAreas'
  | 'SetDownloadPath'
  | 'SetDownloadPathResult'
  | 'ShowCourses'
  | 'ShowOutput'
  | 'SubmitTask'
  | 'UpdateCoursesToGlobalState'
  | 'UpdateTimData'
