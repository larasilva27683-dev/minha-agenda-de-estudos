export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  topic: string;
  subjectId: string;
  estimatedTime: number; // in minutes
  completed: boolean;
  date: string;
}

export interface StudyStats {
  totalMinutes: number;
  completedTasks: number;
  totalTasks: number;
}
