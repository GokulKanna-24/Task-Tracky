import { db } from "@/database/db";
import type { ShareLink } from "./sharing.types";
import { createShareToken } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export const sharingRepository = {
  async get(id: string) {
    return db.shareLinks.get(id);
  },
  async byTask(taskId: string): Promise<ShareLink[]> {
    return db.shareLinks.where("taskId").equals(taskId).toArray();
  },
  async byToken(token: string): Promise<ShareLink | undefined> {
    const links = await db.shareLinks.where("token").equals(token).toArray();
    return links[0];
  },
  async create(link: ShareLink): Promise<void> {
    await db.shareLinks.add(link);
  },
  async update(id: string, changes: Partial<ShareLink>): Promise<void> {
    await db.shareLinks.update(id, changes);
  },
  async delete(id: string): Promise<void> {
    await db.shareLinks.delete(id);
  },
};

export function makeShareLink(taskId: string, expiresInDays?: number): ShareLink {
  const ts = now();
  return {
    id: createShareToken(),
    taskId,
    token: createShareToken(),
    createdAt: ts,
    expiresAt: expiresInDays ? ts + expiresInDays * 86400000 : null,
    isActive: true,
  };
}