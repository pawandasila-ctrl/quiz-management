import { UserRole } from "@/modules/auth/types";

// ── User ──────────────────────────────────────────────────────────────────────

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  image?: string | null;
}

export interface UserFilterParams {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface CreateQuizPayload {
  title: string;
  description: string | null;
  category_id: number | null;
  time_limit_minutes: number | null;
  pass_mark: number;
  shuffle_questions: boolean;
  max_attempts: number;
}

// ── Category ──────────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string;
  description: string | null;
}

// ── Question ──────────────────────────────────────────────────────────────────

export interface CreateQuestionPayload {
  text: string;
  type: "mcq" | "true_false";
  marks: number;
  order: number;
  explanation: string | null;
  image_url: string | null;
  options: Array<{
    text: string;
    is_correct: boolean;
    order: number;
  }>;
}
