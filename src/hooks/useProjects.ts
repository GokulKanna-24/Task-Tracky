import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";

export function useProjects() {
  return useLiveQuery(() => db.projects.toArray(), [], []);
}

export function useProject(id: string | undefined) {
  return useLiveQuery(async () => (id ? await db.projects.get(id) : undefined), [id]);
}

export function useProjectTasks(projectId: string | undefined) {
  return useLiveQuery(async () => (projectId ? await db.tasks.where("projectId").equals(projectId).toArray() : []), [projectId], []);
}