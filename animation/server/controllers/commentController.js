import db from "../config/db.js";

export const getCommentsByTaskId = async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await db.query(
      `SELECT 
         c.id, 
         c.task_id, 
         c.user_id, 
         c.content, 
         c.created_at, 
         c.updated_at, 
         u.email AS user_email, 
         u.role AS user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Failed to fetch comments." });
  }
};

export const createComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment text cannot be empty." });
  }

  try {
    // Check if task exists
    const taskCheck = await db.query("SELECT id FROM tasks WHERE id = $1", [
      taskId,
    ]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const insertResult = await db.query(
      `INSERT INTO comments (task_id, user_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [taskId, userId, content.trim()],
    );

    const newComment = insertResult.rows[0];

    const fullCommentResult = await db.query(
      `SELECT 
         c.id, 
         c.task_id, 
         c.user_id, 
         c.content, 
         c.created_at, 
         c.updated_at, 
         u.email AS user_email, 
         u.role AS user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [newComment.id],
    );

    const createdComment = fullCommentResult.rows[0];

    // Broadcast to room
    req.app
      .get("io")
      ?.to(`task_${taskId}`)
      .emit("comment:created", createdComment);

    res.status(201).json(createdComment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Failed to post comment." });
  }
};

export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment text cannot be empty." });
  }

  try {
    const commentCheck = await db.query(
      "SELECT * FROM comments WHERE id = $1",
      [commentId],
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const comment = commentCheck.rows[0];

    // Ownership check: only the comment author can update it
    if (comment.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only edit your own comments." });
    }

    const updateResult = await db.query(
      `UPDATE comments 
       SET content = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [content.trim(), commentId],
    );

    const updatedComment = updateResult.rows[0];

    const fullCommentResult = await db.query(
      `SELECT 
         c.id, 
         c.task_id, 
         c.user_id, 
         c.content, 
         c.created_at, 
         c.updated_at, 
         u.email AS user_email, 
         u.role AS user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [updatedComment.id],
    );

    const finalUpdatedComment = fullCommentResult.rows[0];

    // Broadcast to room
    req.app
      .get("io")
      ?.to(`task_${comment.task_id}`)
      .emit("comment:updated", finalUpdatedComment);

    res.status(200).json(finalUpdatedComment);
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ message: "Failed to update comment." });
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const commentCheck = await db.query(
      "SELECT * FROM comments WHERE id = $1",
      [commentId],
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const comment = commentCheck.rows[0];

    // Ownership check: only the comment author can delete it
    if (comment.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own comments." });
    }

    await db.query("DELETE FROM comments WHERE id = $1", [commentId]);

    // Broadcast to room
    req.app
      .get("io")
      ?.to(`task_${comment.task_id}`)
      .emit("comment:deleted", { commentId: parseInt(commentId, 10) });

    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};
