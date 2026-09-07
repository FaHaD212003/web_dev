import db from "../config/db.js";
import {
  createAndDispatchNotifications,
  getAdminUserIds,
} from "./notificationHelper.js";

let intervalId = null;

export const startDueTaskScheduler = (io) => {
  if (intervalId) return;

  const checkDueTasks = async () => {
    try {
      const result = await db.query(
        `SELECT id, title, assignee_id, due_date, status
         FROM tasks
         WHERE due_date IS NOT NULL
           AND due_date <= NOW()
           AND status != 'completed'
           AND (due_date_notified IS NULL OR due_date_notified = FALSE)`,
      );

      if (result.rows.length === 0) return;

      const adminIds = await getAdminUserIds();

      for (const task of result.rows) {
        // Mark task as notified to prevent duplicate notifications
        await db.query(
          "UPDATE tasks SET due_date_notified = TRUE WHERE id = $1",
          [task.id],
        );

        const recipientIds = task.assignee_id
          ? [...adminIds, task.assignee_id]
          : adminIds;

        await createAndDispatchNotifications(io, {
          recipientUserIds: recipientIds,
          taskId: task.id,
          title: `Task Due: ${task.title}`,
          message: `Task "${task.title}" has reached its due date and time.`,
          type: "task_due",
        });

        // Broadcast task:due to all connected clients
        if (io) {
          io.emit("task:due", { taskId: task.id });
        }
      }
    } catch (err) {
      console.error("Error in due task notification scheduler:", err);
    }
  };

  // Run initial check immediately, then check every 30 seconds
  checkDueTasks();
  intervalId = setInterval(checkDueTasks, 30000);
};

export const stopDueTaskScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
