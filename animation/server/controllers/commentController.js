import db from "../config/db.js";
import minioClient, { BUCKET_NAME } from "../config/minio.js";
import {
  createAndDispatchNotifications,
  getAdminUserIds,
} from "../utils/notificationHelper.js";

export const getCommentsByTaskId = async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await db.query(
      `SELECT 
         c.id, 
         c.task_id, 
         c.user_id, 
         c.content, 
         c.file_url,
         c.file_name,
         c.file_size,
         c.file_type,
         c.file_key,
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
  const file = req.file;

  if ((!content || !content.trim()) && !file) {
    return res
      .status(400)
      .json({ message: "Comment must have text or an attached file." });
  }

  try {
    // Check if task exists and retrieve title/assignee/creator info
    const taskCheck = await db.query(
      "SELECT id, title, creator_id, assignee_id FROM tasks WHERE id = $1",
      [taskId],
    );
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = taskCheck.rows[0];

    let file_url = null;
    let file_name = null;
    let file_size = null;
    let file_type = null;
    let file_key = null;

    if (file) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      file_key = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedName}`;
      file_name = file.originalname;
      file_size = file.size;
      file_type = file.mimetype;

      await minioClient.putObject(
        BUCKET_NAME,
        file_key,
        file.buffer,
        file.size,
        {
          "Content-Type": file.mimetype,
        },
      );

      file_url = `http://localhost:3000/tasks/comments/attachment/${encodeURIComponent(file_key)}`;
    }

    const insertResult = await db.query(
      `INSERT INTO comments (task_id, user_id, content, file_url, file_name, file_size, file_type, file_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        taskId,
        userId,
        content ? content.trim() : "",
        file_url,
        file_name,
        file_size,
        file_type,
        file_key,
      ],
    );

    const newComment = insertResult.rows[0];

    const fullCommentResult = await db.query(
      `SELECT 
         c.id, 
         c.task_id, 
         c.user_id, 
         c.content, 
         c.file_url,
         c.file_name,
         c.file_size,
         c.file_type,
         c.file_key,
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
    const io = req.app.get("io");

    // Broadcast to task discussion room
    io?.to(`task_${taskId}`).emit("comment:created", createdComment);

    // Real-Time Notifications to Admins, Creator, and Assignee (excluding the commenter)
    const adminIds = await getAdminUserIds();
    const recipientIds = [
      ...adminIds,
      task.creator_id,
      task.assignee_id,
    ].filter((id) => id && id !== userId);

    const commenterEmail = req.user.email || "A user";
    let commentSnippet = "";
    if (content && content.trim()) {
      const cleanContent = content.trim();
      commentSnippet = `"${cleanContent.length > 60 ? cleanContent.substring(0, 60) + "..." : cleanContent}"`;
    }
    if (file_name) {
      commentSnippet = commentSnippet
        ? `${commentSnippet} (with attachment "${file_name}")`
        : `attached file "${file_name}"`;
    }

    await createAndDispatchNotifications(io, {
      recipientUserIds: recipientIds,
      taskId: task.id,
      title: `New Comment on Task #${task.id}`,
      message: `${commenterEmail} commented on "${task.title}": ${commentSnippet}`,
      type: "comment_created",
    });

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

    // Ownership check: only comment author can edit
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
         c.file_url,
         c.file_name,
         c.file_size,
         c.file_type,
         c.file_key,
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
    const io = req.app.get("io");

    // Broadcast update to discussion room
    io?.to(`task_${comment.task_id}`).emit(
      "comment:updated",
      finalUpdatedComment,
    );

    // Real-Time Notifications for Admins, Creator, and Assignee (excluding the editor)
    const taskResult = await db.query(
      "SELECT id, title, creator_id, assignee_id FROM tasks WHERE id = $1",
      [comment.task_id],
    );
    const task = taskResult.rows[0];

    if (task) {
      const adminIds = await getAdminUserIds();
      const recipientIds = [
        ...adminIds,
        task.creator_id,
        task.assignee_id,
      ].filter((id) => id && id !== userId);

      const commenterEmail = req.user.email || "A user";
      const cleanContent = content.trim();
      const updatedSnippet =
        cleanContent.length > 60
          ? cleanContent.substring(0, 60) + "..."
          : cleanContent;

      await createAndDispatchNotifications(io, {
        recipientUserIds: recipientIds,
        taskId: task.id,
        title: `Comment Edited on Task #${task.id}`,
        message: `${commenterEmail} edited their comment on "${task.title}": "${updatedSnippet}"`,
        type: "comment_updated",
      });
    }

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

    // Ownership check: comment author or admin can delete
    if (comment.user_id !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own comments." });
    }

    // Clean up MinIO file if attached
    if (comment.file_key) {
      try {
        await minioClient.removeObject(BUCKET_NAME, comment.file_key);
        console.log(`[MinIO] Removed object: ${comment.file_key}`);
      } catch (minioErr) {
        console.error("Failed to delete object from MinIO:", minioErr);
      }
    }

    await db.query("DELETE FROM comments WHERE id = $1", [commentId]);

    // Broadcast deletion to room
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

export const serveAttachment = async (req, res) => {
  const { fileKey } = req.params;

  try {
    const stat = await minioClient.statObject(BUCKET_NAME, fileKey);
    if (stat.metaData && stat.metaData["content-type"]) {
      res.setHeader("Content-Type", stat.metaData["content-type"]);
    }
    if (stat.size) {
      res.setHeader("Content-Length", stat.size);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    const stream = await minioClient.getObject(BUCKET_NAME, fileKey);
    stream.pipe(res);
  } catch (err) {
    console.error("Error serving attachment from MinIO:", err);
    if (err.code === "NotFound" || err.message?.includes("Not Found")) {
      return res.status(404).json({ message: "Attachment not found." });
    }
    res.status(500).json({ message: "Failed to stream attachment." });
  }
};
