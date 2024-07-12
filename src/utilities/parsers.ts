import Tide from '../api/tide'
import { Course, Task, TimData } from '../common/types'

/**
 * Parses courses from a json string
 *
 * @param data - A JSON string containing the data
 * @returns A promise with an array of courses
 */
export async function parseCoursesFromJsonString(data: string): Promise<Array<Course>> {
  const courses: Array<Course> = JSON.parse(data)
  courses.forEach((c) => {
    c.status = 'active'
    c.expanded = true
    c.task_docs.forEach(async (t) => (t.tasks = await Tide.getTaskListForTaskSetPath(t.path)))
  })
  return courses
}

/**
 * Parses tasks from a json string
 *
 * @param data - A JSON string containing the data
 * @returns An array of tasks
 */
export function parseTasksFromJsonString(data: string): Array<Task> {
  // TODO: What info on tasks is required? Currently only the length of the array is used elsewhere in code.
  // return JSON.parse(data).map((_task: Task) => {
  //   return { doc_id: _task.doc_id }
  // })
  return JSON.parse(data)
}
