import { axiosClient } from "@/hooks/use-axios";
import { Quiz, Category, QuizAttempt, LeaderboardEntry, AnswerState } from "../types";
import { User, UserRole } from "../../auth/types";
import { encryptPayload } from "@/lib/crypto";

export async function getStudentQuizzesRequest(): Promise<Quiz[]> {
  const res = await axiosClient.get<Quiz[]>("/student/quiz");
  return res.data;
}

export async function getStudentAttemptsRequest(): Promise<QuizAttempt[]> {
  const res = await axiosClient.get<QuizAttempt[]>("/student/attempts");
  return res.data;
}

export async function getStudentQuizDetailsRequest(
  quizId: number,
): Promise<Quiz> {
  const res = await axiosClient.get<Quiz>(`/student/quiz/${quizId}`);
  return res.data;
}

export async function startQuizAttemptRequest(
  quizId: number,
): Promise<QuizAttempt> {
  const res = await axiosClient.post<QuizAttempt>(
    `/student/quiz/${quizId}/start`,
  );
  return res.data;
}

export interface SaveAnswerPayload {
  question_id: number;
  selected_option_id: number | null;
  marked_for_review: boolean;
}

export async function submitAnswerRequest(
  attemptId: number,
  payload: SaveAnswerPayload,
): Promise<AnswerState> {
  const encryptionKey = process.env.NEXT_PUBLIC_API_ENCRYPTION_KEY || "dev-encryption-key-must-be-32-bytes-long!";
  const encrypted = await encryptPayload(payload, encryptionKey);
  const res = await axiosClient.post<AnswerState>(`/student/attempt/${attemptId}/answer`, {
    encrypted_data: encrypted,
  });
  return res.data;
}

export async function finalizeAttemptRequest(
  attemptId: number,
): Promise<QuizAttempt> {
  const res = await axiosClient.post<QuizAttempt>(
    `/student/attempt/${attemptId}/submit`,
  );
  return res.data;
}

export async function getQuizLeaderboardRequest(
  quizId: number,
): Promise<LeaderboardEntry[]> {
  const res = await axiosClient.get<LeaderboardEntry[]>(
    `/student/quiz/${quizId}/leaderboard`,
  );
  return res.data;
}

export async function getAttemptResultRequest(
  attemptId: number,
): Promise<QuizAttempt> {
  const res = await axiosClient.get<QuizAttempt>(
    `/student/attempt/${attemptId}/result`,
  );
  return res.data;
}

// ── Admin Actions ───────────────────────────────────────────────────────────

export async function getAdminQuizzesRequest(): Promise<Quiz[]> {
  const res = await axiosClient.get<Quiz[]>("/admin/quiz");
  return res.data;
}

export async function getAdminQuizDetailsRequest(
  quizId: number,
): Promise<Quiz> {
  const res = await axiosClient.get<Quiz>(`/admin/quiz/${quizId}`);
  return res.data;
}

export async function getAdminQuizAttemptsRequest(
  quizId: number,
): Promise<QuizAttempt[]> {
  const res = await axiosClient.get<QuizAttempt[]>(`/admin/quiz/${quizId}/attempts`);
  return res.data;
}

export async function getAdminCategoriesRequest(): Promise<Category[]> {
  const res = await axiosClient.get<Category[]>("/admin/categories");
  return res.data;
}

export async function getAdminUsersRequest(): Promise<User[]> {
  const res = await axiosClient.get<User[]>("/admin/users");
  return res.data;
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

export async function createQuizRequest(
  payload: CreateQuizPayload,
): Promise<Quiz> {
  const res = await axiosClient.post<Quiz>("/admin/quiz", payload);
  return res.data;
}

export interface CreateCategoryPayload {
  name: string;
  description: string | null;
}

export async function createCategoryRequest(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const res = await axiosClient.post<Category>("/admin/categories", payload);
  return res.data;
}

export async function updateUserRoleRequest(
  userId: number,
  role: UserRole,
): Promise<void> {
  await axiosClient.put(`/admin/users/${userId}/role?role=${role}`);
}

export async function publishQuizRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/publish`);
}

export async function closeQuizRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/close`);
}

export async function releaseResultsRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/release-results`);
}

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

export async function createQuestionRequest(
  quizId: number,
  payload: CreateQuestionPayload,
): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/questions`, payload);
}

export async function deleteQuestionRequest(questionId: number): Promise<void> {
  await axiosClient.delete(`/admin/questions/${questionId}`);
}
