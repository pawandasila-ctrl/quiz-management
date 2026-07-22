export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export type QuizStatus = "draft" | "published" | "closed";
export type QuestionType = "mcq" | "true_false";

export interface Option {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
  order: number;
}

export interface Question {
  id: number;
  quiz_id: number;
  text: string;
  type: QuestionType;
  marks: number;
  order: number;
  explanation: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  options: Option[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  time_limit_minutes: number | null;
  pass_mark: number;
  total_marks: number;
  shuffle_questions: boolean;
  max_attempts: number;
  results_visible: boolean;
  status: QuizStatus;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  questions?: Question[];
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export type AttemptStatus = "in_progress" | "submitted" | "graded";

export type AnswerStatus =
  | "not_visited"
  | "not_answered"
  | "answered"
  | "marked_for_review"
  | "answered_marked_for_review";

export interface Answer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id: number | null;
  is_correct: boolean;
  marks_awarded: number;
  answered_at: string;
  question?: Question;
  selected_option?: Option;
}

/** Live in-progress answer state — no grading fields, since the attempt isn't graded yet. */
export interface AnswerState {
  question_id: number;
  selected_option_id: number | null;
  status: AnswerStatus;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  attempt_number: number;
  status: AttemptStatus;
  score: number | null;
  total_marks: number;
  passed: boolean | null;
  time_taken_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  quiz?: Quiz;
  /** Rich detail (post-grading review) or lightweight live state (in-progress attempt) depending on the endpoint. */
  answers?: (Answer | AnswerState)[];
  student?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  student_name: string;
  student_image: string | null;
  score: number;
  total_marks: number;
  time_taken_seconds: number;
  submitted_at: string;
}

export interface QuizFilterParams {
  category_id?: number | null;
  status?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
