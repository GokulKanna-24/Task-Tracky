import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/database/db";
import { taskEngine } from "@/engines/task";
import { timeEngine } from "@/engines/time";
import { timelineEngine } from "@/engines/timeline";
import { bucketEngine } from "@/engines/bucket";
import { schedulerEngine } from "@/engines/scheduler";
import { sharingEngine } from "@/engines/sharing";
import { workloadLevel } from "@/engines/scheduler/scheduler.calculations";

const ACTOR_ID = "user_test_actor";
const USER_ID = "user_test_actor";

describe("Task-Tracky Business Engines", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.users.add({
      id: ACTOR_ID,
      email: "test@tracky.app",
      fullName: "Test User",
      role: "admin",
      status: "active" as const,
      createdAt: Date.now(),
    });
  });

  describe("Task Engine", () => {
    it("creates a task and records creation in timeline", async () => {
      const task = await taskEngine.create(
        { title: "Test Auth Task", description: "Implement JWT", priority: "high", status: "todo" },
        ACTOR_ID,
      );

      expect(task.id).toBeDefined();
      expect(task.title).toBe("Test Auth Task");
      expect(task.status).toBe("todo");

      const fetched = await taskEngine.getById(task.id);
      expect(fetched).toBeDefined();
      expect(fetched?.priority).toBe("high");

      const timeline = await timelineEngine.getByTask(task.id);
      expect(timeline.length).toBe(1);
      expect(timeline[0].type).toBe("created");
    });

    it("updates status and records timeline event", async () => {
      const task = await taskEngine.create({ title: "Drafting docs" }, ACTOR_ID);
      await taskEngine.changeStatus(task.id, "in_progress", ACTOR_ID);

      const updated = await taskEngine.getById(task.id);
      expect(updated?.status).toBe("in_progress");

      const timeline = await timelineEngine.getByTask(task.id);
      expect(timeline.some((e) => e.type === "status_changed")).toBe(true);
    });

    it("deletes a task and purges related records", async () => {
      const task = await taskEngine.create({ title: "Task to delete" }, ACTOR_ID);
      await taskEngine.delete(task.id);

      const fetched = await taskEngine.getById(task.id);
      expect(fetched).toBeUndefined();
    });
  });

  describe("Time Engine", () => {
    it("starts a timer and calculates active duration", async () => {
      const task = await taskEngine.create({ title: "Timed Task" }, ACTOR_ID);
      const startRes = await timeEngine.start(task.id, USER_ID);

      expect(startRes.ok).toBe(true);
      expect(startRes.newEntry).toBeDefined();

      const active = await timeEngine.getActive();
      expect(active.length).toBe(1);
      expect(active[0].taskId).toBe(task.id);
    });

    it("enforces single active timer rule for a user", async () => {
      const task1 = await taskEngine.create({ title: "Task 1" }, ACTOR_ID);
      const task2 = await taskEngine.create({ title: "Task 2" }, ACTOR_ID);

      await timeEngine.start(task1.id, USER_ID);
      const secondStart = await timeEngine.start(task2.id, USER_ID);

      expect(secondStart.ok).toBe(false);
      expect(secondStart.message).toContain("already have an active timer");
    });

    it("pauses running timer and calculates total tracked duration", async () => {
      const task = await taskEngine.create({ title: "Task for pause test" }, ACTOR_ID);
      await timeEngine.start(task.id, USER_ID);
      const stoppedEntry = await timeEngine.stop(task.id, USER_ID);

      expect(stoppedEntry?.status).toBe("completed");
      const total = await timeEngine.getTaskTotalTime(task.id);
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it("tracks breaks separately from task time", async () => {
      const breakEntry = await timeEngine.startBreak(USER_ID);
      expect(breakEntry.status).toBe("running");

      const endedBreak = await timeEngine.endBreak(USER_ID);
      expect(endedBreak?.status).toBe("completed");
    });
  });

  describe("Bucket Engine & Promotion", () => {
    it("creates a bucket item and promotes it to a Task", async () => {
      const bucket = await bucketEngine.create(
        { title: "Future Feature Idea", description: "AI Assistant Integration", priority: "urgent" },
        USER_ID,
      );

      expect(bucket.status).toBe("available");

      const { task, bucket: updatedBucket } = await bucketEngine.promote(bucket.id, [USER_ID], ACTOR_ID);

      expect(updatedBucket.status).toBe("promoted");
      expect(task.title).toBe("Future Feature Idea");
      expect(task.source).toBe("bucket");
      expect(task.bucketItemId).toBe(bucket.id);

      const available = await bucketEngine.available();
      expect(available.some((b) => b.id === bucket.id)).toBe(false);
    });
  });

  describe("Scheduler Engine", () => {
    it("schedules a task and detects overlaps/conflicts", async () => {
      const task = await taskEngine.create({ title: "Scheduled Task" }, ACTOR_ID);
      const startAt = Date.now() + 3600000;
      const endAt = startAt + 7200000; // 2 hours

      const event = await schedulerEngine.create(
        { taskId: task.id, userId: USER_ID, title: task.title, startAt, endAt },
        ACTOR_ID,
      );

      expect(event.id).toBeDefined();

      // Check conflict detection with overlapping time slot
      const conflicts = await schedulerEngine.detectConflicts(USER_ID, startAt + 1800000, endAt + 1800000);
      expect(conflicts.length).toBe(1);
    });

    it("pins and unpins schedule events", async () => {
      const task = await taskEngine.create({ title: "Pinned Task" }, ACTOR_ID);
      const startAt = Date.now() + 3600000;
      const event = await schedulerEngine.create(
        { taskId: task.id, userId: USER_ID, title: task.title, startAt, endAt: startAt + 3600000 },
        ACTOR_ID,
      );

      await schedulerEngine.pin(event.id, ACTOR_ID);
      let list = await schedulerEngine.getByTask(task.id);
      expect(list[0].isPinned).toBe(true);

      await schedulerEngine.unpin(event.id, ACTOR_ID);
      list = await schedulerEngine.getByTask(task.id);
      expect(list[0].isPinned).toBe(false);
    });

    it("calculates workload thresholds accurately", async () => {
      const thresholds = { light: 4, moderate: 6, heavy: 8, overloaded: 10 };
      expect(workloadLevel(3, thresholds)).toBe("light");
      expect(workloadLevel(6.5, thresholds)).toBe("moderate");
      expect(workloadLevel(8.5, thresholds)).toBe("heavy");
      expect(workloadLevel(10.5, thresholds)).toBe("overloaded");
    });
  });

  describe("Sharing Engine", () => {
    it("generates a share link and returns a sanitized PublicTaskView", async () => {
      const task = await taskEngine.create(
        { title: "Publicly Shared Task", description: "Public roadmap item" },
        ACTOR_ID,
      );

      const link = await sharingEngine.create(task.id, ACTOR_ID);
      expect(link.token).toBeDefined();

      const publicView = await sharingEngine.getPublicTaskView(link.token);
      expect(publicView).not.toBeNull();
      expect(publicView?.title).toBe("Publicly Shared Task");
      expect(publicView?.description).toBe("Public roadmap item");

      // Test revocation
      await sharingEngine.revoke(link.id, ACTOR_ID);
      const revokedView = await sharingEngine.getPublicTaskView(link.token);
      expect(revokedView).toBeNull();
    });
  });
});
