import db from "../config/db.js";

export const getUserNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const [notificationsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, user_id, task_id, title, message, type, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId],
      ),
      db.query(
        `SELECT COUNT(*) AS unread_count
         FROM notifications
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId],
      ),
    ]);

    const unreadCount = parseInt(countResult.rows[0]?.unread_count || "0", 10);

    res.status(200).json({
      notifications: notificationsResult.rows,
      unreadCount,
    });
  } catch (err) {
    console.error("Error fetching user notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({
      message: "Notification marked as read.",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Failed to update notification." });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [userId],
    );

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Failed to update notifications." });
  }
};

export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Failed to delete notification." });
  }
};

export const clearAllNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
    res
      .status(200)
      .json({ message: "All notifications cleared successfully." });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ message: "Failed to clear notifications." });
  }
};
