import { db } from "@/database/db";
import type { Project } from "./project.types";
import { createProjectId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export const projectRepository = {
  async get(id: string) {
    return db.projects.get(id);
  },
  async list(): Promise<Project[]> {
    return db.projects.toArray();
  },
  async create(project: Project): Promise<void> {
    await db.projects.add(project);
  },
  async update(id: string, changes: Partial<Project>): Promise<void> {
    await db.projects.update(id, { ...changes, updatedAt: now() });
  },
  async delete(id: string): Promise<void> {
    await db.projects.delete(id);
  },
};

class ProjectEngine {
  async create(name: string, ownerId: string, description?: string, color?: string): Promise<Project> {
    const ts = now();
    const project: Project = { id: createProjectId(), name, description, color, ownerId, createdAt: ts, updatedAt: ts };
    await db.projects.add(project);
    return project;
  }
  async update(id: string, changes: Partial<Project>): Promise<void> {
    return projectRepository.update(id, changes);
  }
  async delete(id: string): Promise<void> {
    await db.transaction("rw", db.projects, db.tasks, async () => {
      await db.projects.delete(id);
      const tasks = await db.tasks.where("projectId").equals(id).toArray();
      for (const t of tasks) {
        await db.tasks.put({ ...t, projectId: null, updatedAt: now() });
      }
    });
  }
  async getById(id: string) {
    return projectRepository.get(id);
  }
  async list(): Promise<Project[]> {
    return projectRepository.list();
  }
  async tasksFor(id: string) {
    return db.tasks.where("projectId").equals(id).toArray();
  }
}

export const projectEngine = new ProjectEngine();