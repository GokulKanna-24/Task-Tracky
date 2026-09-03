export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}