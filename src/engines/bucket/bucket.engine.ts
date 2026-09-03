import { db } from "@/database/db";
import { bucketRepository, makeBucketItem } from "./bucket.repository";
import { taskEngine } from "@/engines/task";
import { timelineEngine } from "@/engines/timeline";
import type { BucketItem } from "./bucket.types";
import type { TaskPriority } from "@/engines/task/task.types";

export interface CreateBucketInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  labels?: string[];
}

class BucketEngine {
  async create(input: CreateBucketInput, userId: string): Promise<BucketItem> {
    const item = makeBucketItem(userId, input);
    await db.bucketItems.add(item);
    return item;
  }
  async update(id: string, changes: Partial<CreateBucketInput>): Promise<void> {
    return bucketRepository.update(id, changes);
  }
  async delete(id: string): Promise<void> {
    return bucketRepository.delete(id);
  }
  async getById(id: string) {
    return bucketRepository.get(id);
  }
  async list(): Promise<BucketItem[]> {
    return bucketRepository.list();
  }
  async available(): Promise<BucketItem[]> {
    return bucketRepository.available();
  }

  async promote(bucketItemId: string, assignTo: string[], actorId: string): Promise<{ task: import("@/engines/task/task.types").Task; bucket: BucketItem }> {
    const bucket = await bucketRepository.get(bucketItemId);
    if (!bucket) throw new Error("Bucket item not found");
    if (bucket.status === "promoted") throw new Error("Bucket item already promoted");

    const task = await taskEngine.create(
      {
        title: bucket.title,
        description: bucket.description,
        priority: bucket.priority,
        labels: bucket.labels,
        assignedUserIds: assignTo,
        source: "bucket",
        bucketItemId: bucket.id,
        status: "todo",
      },
      actorId,
    );

    await db.transaction("rw", db.bucketItems, db.timelineEvents, async () => {
      await bucketRepository.put({ ...bucket, status: "promoted", updatedAt: now() });
      await timelineEngine.record(task.id, actorId, "bucket_promoted", "Task created from bucket list", { bucketItemId });
    });
    return { task, bucket: { ...bucket, status: "promoted" } };
  }
}

import { now } from "@/shared/utils/time";
export const bucketEngine = new BucketEngine();