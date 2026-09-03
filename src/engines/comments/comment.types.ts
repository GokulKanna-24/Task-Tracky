export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  visibility: "private" | "public";
  createdAt: number;
  updatedAt: number;
}