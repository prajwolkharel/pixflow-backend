export interface TaskRequest {
  title: string;
  description: string; // Required
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignDate?: string;
  dueDate: string; // Required
  status?: 'TO_DO' | 'IN_PROGRESS' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';
  startDate?: string;
  completeDate?: string | null;
  client: string; // Required
  assignedToId: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string; // Required
  priority: string;
  assignDate: string;
  dueDate: string; // Required
  status: string;
  startDate?: string | null; // Can be null or undefined
  completeDate?: string | null; // Can be null or undefined
  client: string; // Required
  isApproved: boolean;
  assignedToId: string;
  assignedById: string;
  createdAt: string;
  updatedAt: string;
}