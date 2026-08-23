export interface Message {
  id: string;
  role: 'user' | 'classmate' | 'system';
  content: string;
  timestamp: number;
}
export interface Evaluation {
  understood: string[];
  struggled: string[];
  weakSpots: string[];
  misconceptions: Misconception[];
  overallScore: number;
  suggestions: string[];
}
export interface Misconception {
  topic: string;
  studentSaid: string;
  correction: string;
}
export type Subject = 'physics' | 'chemistry' | 'biology' | 'maths' | 'computer-science' | 'history' | 'general';
export type Difficulty = 'easy' | 'medium' | 'hard';
export const SUBJECT_LABELS: Record<Subject, string> = {
  'physics': 'Physics', 'chemistry': 'Chemistry', 'biology': 'Biology',
  'maths': 'Mathematics', 'computer-science': 'Computer Science', 'history': 'History', 'general': 'General',
};