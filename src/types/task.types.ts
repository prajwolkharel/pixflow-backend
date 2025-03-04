export interface TaskRequest {
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignDate?: string;
  dueDate: string;
  status?: 'TO_DO' | 'IN_PROGRESS' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';
  startDate?: string;
  completeDate?: string | null;
  client: string;
  assignedToId: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  priority: string;
  assignDate: string;
  dueDate: string;
  status: string;
  startDate?: string | null;
  completeDate?: string | null;
  client: string;
  isApproved: boolean;
  assignedToId: string;
  assignedById: string;
  createdAt: string;
  updatedAt: string;
}