import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";

export function useBucketItems(includePromoted = false) {
  return useLiveQuery(async () => {
    const all = await db.bucketItems.reverse().sortBy("createdAt");
    return includePromoted ? all : all.filter((b) => b.status === "available");
  }, [includePromoted], []);
}

export function useBucketItem(id: string | undefined) {
  return useLiveQuery(async () => (id ? await db.bucketItems.get(id) : undefined), [id]);
}