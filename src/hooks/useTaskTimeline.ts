import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";

export function useTaskTimeline(taskId: string | undefined) {
  return useLiveQuery(async () => {
    if (!taskId) return [];
    return db.timelineEvents.where("taskId").equals(taskId).reverse().sortBy("timestamp");
  }, [taskId], []);
}

export function useRecentTimeline(limit = 20) {
  return useLiveQuery(async () => {
    const all = await db.timelineEvents.reverse().sortBy("timestamp");
    return all.slice(0, limit);
  }, [limit], []);
}