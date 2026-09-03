import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";

export function useComments(taskId: string | undefined) {
  return useLiveQuery(async () => {
    if (!taskId) return [];
    return db.comments.where("taskId").equals(taskId).reverse().sortBy("createdAt");
  }, [taskId], []);
}