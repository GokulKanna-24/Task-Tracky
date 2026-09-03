export type BucketItemStatus = "available" | "promoted";
import type { TaskPriority } from "@/engines/task/task.types";

export interface BucketItem {
  id: string;
  title: string;
  description: string;
  priority?: TaskPriority;
  labels: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  source: "bucket";
  status: BucketItemStatus;
}