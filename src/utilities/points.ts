import ExtensionStateManager from "../api/ExtensionStateManager"
import Tide from "../api/tide"

export const updateTaskSetPoints = async (taskSetPath: string) => {
  // Get TaskInfo for reading
  const taskInfo = ExtensionStateManager.getTaskInfo()

  // Fetch Task Points for the newly downloaded tasks from TIM
  await Promise.all(
    taskInfo.map(async (dataObject) => {
      // Only fetch points for new tasks
      if (dataObject.path === taskSetPath && dataObject.max_points) {
        await Tide.getTaskPoints(dataObject.path, dataObject.ide_task_id, null)
      } else if (dataObject.path === taskSetPath && dataObject.max_points === null) {
        // Set the current points of pointless tasks to 0 in order to avoid errors
        ExtensionStateManager.setTaskPoints(dataObject.path, dataObject.ide_task_id, {
          current_points: 0,
        })
      }
    }),
  )
}
