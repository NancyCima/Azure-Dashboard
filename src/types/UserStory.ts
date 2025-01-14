export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  state: string;
  assignedTo?: string;
  priority?: number;
  attachments?: string[];
}