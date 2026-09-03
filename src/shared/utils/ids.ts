// ID generation utilities — opaque, UUID-based.
export function createId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function createTaskId(): string {
  return createId("task");
}

export function createTimeEntryId(): string {
  return createId("time");
}

export function createTimelineEventId(): string {
  return createId("event");
}

export function createBucketItemId(): string {
  return createId("bucket");
}

export function createScheduleEventId(): string {
  return createId("sched");
}

export function createProjectId(): string {
  return createId("proj");
}

export function createShareToken(): string {
  // Opaque random token — does not expose internal IDs.
  return createId("share");
}

export function createCommentId(): string {
  return createId("cmt");
}

export function createBreakEntryId(): string {
  return createId("brk");
}

export function createUserId(): string {
  return createId("user");
}