export interface Reminder {
  id: string;
  text: string;
  categoryId?: string;
  dueDate: string; // ISO date
  completed: boolean;
  createdAt: string;
  source: 'ai' | 'user';
}
