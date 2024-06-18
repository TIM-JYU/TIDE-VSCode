import Tide from '../api/tide'
import { Course, Task } from '../common/types'

/**
 * Parses courses from a json string
 *
 * @param data - A JSON string with the data
 * @returns A promise with an array of courses 
 */
export async function parseCoursesFromJsonString(data: string): Promise<Array<Course>> {
    const courses: Array<Course> = JSON.parse(data)
    courses.forEach(c => {
        c.status = 'active'
        c.task_docs.forEach(async (t) => t.tasks = await Tide.getTaskListForTaskSetPath(t.path))
    }
    )
    return courses
}

/**
 * Parses tasks from a json string
 *
 * @param data - A JSON string with the data
 * @returns A promise with an array of tasks 
 */
export async function parseTasksFromJsonString(data: string): Promise<Array<Task>> {
    // TODO: What info on tasks is required? Currently only the length of the array is used else where in code.
    return JSON.parse(data).map((_task: Task) => { })
}
