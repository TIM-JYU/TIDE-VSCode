export interface LoginData {
    isLogged: boolean
}

export type CourseStatus = 'active' | 'hidden'

/**
 * Represents a course
 */
export interface Course {
    /**
     * Course name.
     */
    name: string

    /**
     * Course ID.
     */
    id: number

    /**
     * Course virtual path in TIM.
     */
    path: string

    /**
     * List of task sets in the course defined in TIM.
     */
    task_docs: Array<TaskSet>

    /**
     * User specific status for the course
     */
    status: CourseStatus

    /**
     * Whether or not the course is expanded in the course list
     */
    expanded: boolean
    // TODO: does the thing above belong here / is it necessary to keep track of ui state over sessions
}

/**
 * Represents a task set
 */
export interface TaskSet {
    /**
     * Task name.
     */
    name: string

    /**
     * Doc ID, where task/csPlugin belongs to.
     */
    docId: number

    /**
     * Task virtual path in TIM.
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

}
