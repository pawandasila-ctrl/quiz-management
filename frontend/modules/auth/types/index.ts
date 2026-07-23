import { UserRole } from "@/security-rules";
export type { UserRole };

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface UserLoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateQuizPayload {
  title: string;
  description: string | null;
  category_id: number | null;
  time_limit_minutes: number | null;
  pass_mark: number;
  shuffle_questions: boolean;
  max_attempts: number;
}
