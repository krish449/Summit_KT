export type UserRole = 'admin' | 'member';
export type MessageRole = 'user' | 'assistant';
export type QuizAttemptStatus = 'in_progress' | 'submitted';
export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_login_at: string | null;
  is_active?: boolean | null;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
  pass_threshold?: number | null;
  quiz_open_at?: string | null;
  quiz_close_at?: string | null;
}

export interface QuizResetRecord {
  id: string;
  user_id: string;
  project_id: string;
  reset_by: string | null;
  reason: string;
  reset_at: string;
}

export interface DocumentRecord {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string | null;
  uploaded_at: string;
  chunk_count: number;
}

export interface ChatSessionRecord {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  sources: Array<{ documentId?: string; documentName: string; chunkId?: string }> | null;
  created_at: string;
}

export interface QuizSetRecord {
  id: string;
  project_id: string;
  set_name: string;
  set_number: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizQuestionRecord {
  id: string;
  quiz_set_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: QuizOptionKey;
  explanation: string | null;
  marks: number;
}

export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  project_id: string;
  quiz_set_id: string;
  assigned_questions: AssignedQuestion[];
  answers_given: Record<string, QuizOptionKey> | null;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  status: QuizAttemptStatus;
}

export interface AssignedQuestionOption {
  key: QuizOptionKey;
  text: string;
  originalKey: QuizOptionKey;
}

export interface AssignedQuestion {
  questionId: string;
  section: 'functional' | 'technical';
  questionText: string;
  options: AssignedQuestionOption[];
  correctKey: QuizOptionKey;
  explanation: string | null;
  marks: number;
}

export interface QuizReviewQuestion extends AssignedQuestion {
  selectedKey: QuizOptionKey | null;
  isCorrect: boolean;
}

export interface ActivityRecord {
  id: string;
  user_id: string | null;
  project_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectDashboardCard extends ProjectRecord {
  documentCount: number;
  quizStatus: 'Not Started' | 'In Progress' | 'Completed';
  quizScoreLabel: string | null;
}