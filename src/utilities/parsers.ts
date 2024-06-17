import Tide from '../api/tide'
import { Course, Task } from '../common/types'

export async function parseCoursesFromJsonString(data: string): Promise<Array<Course>> {
    const courses: Array<Course> = JSON.parse(data)
    courses.forEach(c => {
        c.status = 'active'
        c.task_docs.forEach(async (t) => t.tasks = await Tide.getTaskListForTaskSetPath(t.path))
    }
    )
    return courses
}

export async function parseTasksFromJsonString(data: string): Promise<Array<Task>> {
    // TODO: What info on tasks belongs here?
    return JSON.parse(data).map((_task: Task) => {})
}
