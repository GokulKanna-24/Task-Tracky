import { db } from "@/database/db";
import type { Comment } from "./comment.types";
import { createCommentId } from "@/shared/utils/ids";
import { timelineEngine } from "@/engines/timeline";
import { now } from "@/shared/utils/time";

export const commentRepository = {
  async getByTask(taskId: string): Promise<Comment[]> {
    return db.comments.where("taskId").equals(taskId).reverse().sortBy("createdAt");
  },
  async create(comment: Comment): Promise<void> {
    await db.comments.add(comment);
  },
  async update(id: string, changes: Partial<Comment>): Promise<void> {
    await db.comments.update(id, { ...changes, updatedAt: now() });
  },
  async delete(id: string): Promise<void> {
    await db.comments.delete(id);
  },
  async countByTask(taskId: string): Promise<number> {
    return db.comments.where("taskId").equals(taskId).count();
  },
};

class CommentEngine {
  async add(taskId: string, userId: string, body: string, visibility: "private" | "public" = "private"): Promise<Comment> {
    const ts = now();
    const comment: Comment = {
      id: createCommentId(),
      taskId,
      userId,
      body,
      visibility,
      createdAt: ts,
      updatedAt: ts,
    };
    await db.transaction("rw", db.comments, db.timelineEvents, async () => {
      await db.comments.add(comment);
      await timelineEngine.record(taskId, userId, "comment_added", "Comment added", { visibility });
    });
    return comment;
  }
  async getByTask(taskId: string): Promise<Comment[]> {
    return commentRepository.getByTask(taskId);
  }
  async update(id: string, body: string): Promise<void> {
    return commentRepository.update(id, { body });
  }
  async delete(id: string): Promise<void> {
    return commentRepository.delete(id);
  }
  async countByTask(taskId: string): Promise<number> {
    return commentRepository.countByTask(taskId);
  }
}

export const commentEngine = new CommentEngine();