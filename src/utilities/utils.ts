import { Course, TaskSet } from '../common/types'

export const mergeCoursesWithNewData = (
  existingCourses: Array<Course>,
  newCourses: Array<Course>,
) => {
  const newAndUpdatedCourses: Array<Course> = newCourses.map((course: Course): Course => {
    const existingCourse = existingCourses.find((c) => c.id === course.id)
    switch (existingCourse) {
      case undefined:
        return course
      default:
        return mergeCourseWithNewData(existingCourse, course)
    }
  }, [])

  const updatedCourses = newAndUpdatedCourses.concat(
    existingCourses.filter((course) => !newAndUpdatedCourses.map((c) => c.id).includes(course.id)),
  )

  return updatedCourses
}

const mergeCourseWithNewData = (existingCourse: Course, newCourse: Course): Course => {
  const updatedCourse: Course = JSON.parse(JSON.stringify(newCourse))
  updatedCourse.status = existingCourse.status
  updatedCourse.expanded = existingCourse.expanded
  updatedCourse.taskSets = updatedCourse.taskSets.map((taskSet: TaskSet): TaskSet => {
    const existingTaskSet = existingCourse.taskSets.find((ts) => ts.doc_id === taskSet.doc_id)
    switch (existingTaskSet) {
      case undefined:
        return taskSet
      default:
        return mergeTaskSetWithNewData(existingTaskSet, taskSet)
    }
  })
  updatedCourse.taskSets = updatedCourse.taskSets.concat(
    existingCourse.taskSets.filter(
      (taskSet) => !updatedCourse.taskSets.map((ts) => ts.doc_id).includes(taskSet.doc_id),
    ),
  )
  return updatedCourse
}

const mergeTaskSetWithNewData = (existingTaskSet: TaskSet, newTaskSet: TaskSet): TaskSet => {
  const updatedTaskSet: TaskSet = JSON.parse(JSON.stringify(newTaskSet))
  updatedTaskSet.downloadPath = existingTaskSet.downloadPath
  // TODO: check for added/removed tasks
  return updatedTaskSet
}
