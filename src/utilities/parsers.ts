import Tide from '../api/tide'
import { Course, CourseDataRaw, Task, TimData } from '../common/types'

/**
 * Parses courses from a json string
 *
 * @param data - A JSON string containing the data
 * @returns A promise with an array of courses
 */
export async function parseCoursesFromJsonString(data: string): Promise<Array<Course>> {
  const courses: Array<CourseDataRaw> = JSON.parse(data)
  const coursesWithTasks = await Promise.all(courses.map(async (c) => {
    const course: Course = {
      status: 'active',
      expanded: false,
      name: c.name,
      id: c.id,
      path: c.path,
      taskSets: await Promise.all(c.tasks.map(async t => {
        const tasks = await Tide.getTaskListForTaskSetPath(t.path)
        return {
          ...t,
          tasks
        }
      })),
    }
    return course
  }))
  console.log(coursesWithTasks)
  return coursesWithTasks
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
