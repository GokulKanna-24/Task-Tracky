import { db } from "@/database/db";
import type { BucketItem } from "./bucket.types";
import { createBucketItemId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export const bucketRepository = {
  async get(id: string) {
    return db.bucketItems.get(id);
  },
  async list(): Promise<BucketItem[]> {
    return db.bucketItems.reverse().sortBy("createdAt");
  },
  async available(): Promise<BucketItem[]> {
    const all = await this.list();
    return all.filter((b) => b.status === "available");
  },
  async create(item: BucketItem): Promise<void> {
    await db.bucketItems.add(item);
  },
  async update(id: string, changes: Partial<BucketItem>): Promise<void> {
    await db.bucketItems.update(id, { ...changes, updatedAt: now() });
  },
  async delete(id: string): Promise<void> {
    await db.bucketItems.delete(id);
  },
  async put(item: BucketItem): Promise<void> {
    await db.bucketItems.put(item);
  },
};

export function makeBucketItem(
  createdBy: string,
  data: { title: string; description: string; priority?: BucketItem["priority"]; labels?: string[] },
): BucketItem {
  const ts = now();
  return {
    id: createBucketItemId(),
    title: data.title,
    description: data.description,
    priority: data.priority,
    labels: data.labels ?? [],
    createdAt: ts,
    updatedAt: ts,
    createdBy,
    source: "bucket",
    status: "available",
  };
}