export interface ShareLink {
  id: string;
  taskId: string;
  token: string;
  createdAt: number;
  expiresAt: number | null;
  isActive: boolean;
}