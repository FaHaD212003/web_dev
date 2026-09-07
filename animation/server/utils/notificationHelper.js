import db from "../config/db.js";

/**
 * Fetch all active admin IDs
 */
export const getAdminUserIds = async () => {
  try {
    const result = await db.query(
      "SELECT id FROM users WHERE role = 'admin' AND (is_revoked IS NULL OR is_revoked = FALSE)",
    );
    return result.rows.map((row) => row.id);
  } catch (err) {
    console.error("Error fetching admin IDs for notifications:", err);
    return [];
  }
};

/**
 * Create notification rows in database and emit them via Socket.IO
 *
 * @param {Object} io - Socket.IO server instance
 * @param {Object} payload
 * @param {Array<number>} payload.recipientUserIds - Array of user IDs to receive the notification
 * @param {number|null} payload.taskId - Related task ID
 * @param {string} payload.title - Notification title
 * @param {string} payload.message - Notification message body
 * @param {string} payload.type - Notification type ('task_assigned' | 'task_updated' | 'task_due')
 */
export const createAndDispatchNotifications = async (
  io,
  {
    recipientUserIds = [],
    taskId = null,
    title,
    message,
    type = "task_assigned",
  },
) => {
  if (!recipientUserIds || recipientUserIds.length === 0) return [];

  // Deduplicate and ensure integer IDs
  const uniqueRecipientIds = [
    ...new Set(
      recipientUserIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id > 0),
    ),
  ];

  if (uniqueRecipientIds.length === 0) return [];

  const createdNotifications = [];

  for (const userId of uniqueRecipientIds) {
    try {
      const result = await db.query(
        `INSERT INTO notifications (user_id, task_id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
         RETURNING *`,
        [userId, taskId, title, message, type],
      );

      const notification = result.rows[0];
      createdNotifications.push(notification);

      // Emit real-time notification to user's dedicated socket room
      if (io) {
        const room = `user_${userId}`;
        console.log(
          `[Notification Engine] Emitting notification:new to room "${room}" for user #${userId}: "${title}"`,
        );
        io.to(room).emit("notification:new", notification);
      }
    } catch (err) {
      console.error(`Error saving notification for user #${userId}:`, err);
    }
  }

  return createdNotifications;
};
