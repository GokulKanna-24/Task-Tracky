import { timelineRepository } from "./timeline.repository";
import type { TimelineEventType } from "./timeline.types";

export const timelineEngine = {
  add: timelineRepository.add,
  getByTask: timelineRepository.getByTask,
  getByUser: timelineRepository.getByUser,
  getRecent: timelineRepository.getRecent,

  async record(
    taskId: string,
    userId: string,
    type: TimelineEventType,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    return timelineRepository.add({ taskId, userId, type, message, metadata });
  },
};