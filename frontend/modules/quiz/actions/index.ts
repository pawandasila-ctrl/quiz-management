import { axiosClient } from "@/hooks/use-axios";
import {
  Quiz,
  QuizAttempt,
  LeaderboardEntry,
  AnswerState,
  QuizFilterParams,
  PaginatedResponse,
} from "../types";
import { encryptPayload } from "@/lib/crypto";

// ── Student Actions ───────────────────────────────────────────────────────────

export interface SaveAnswerPayload {
  question_id: number;
  selected_option_id: number | null;
  marked_for_review: boolean;
}

export async function getStudentQuizzesRequest(
  params?: QuizFilterParams,
): Promise<PaginatedResponse<Quiz>> {
  const res = await axiosClient.get<PaginatedResponse<Quiz>>("/student/quiz", { params });
  return res.data;
}

export async function getStudentAttemptsRequest(): Promise<QuizAttempt[]> {
  const res = await axiosClient.get<QuizAttempt[]>("/student/attempts");
  return res.data;
}

export async function getStudentQuizDetailsRequest(quizId: number): Promise<Quiz> {
  const res = await axiosClient.get<Quiz>(`/student/quiz/${quizId}`);
  return res.data;
}

export async function startQuizAttemptRequest(quizId: number): Promise<QuizAttempt> {
  const res = await axiosClient.post<QuizAttempt>(`/student/quiz/${quizId}/start`);
  return res.data;
}

export async function submitAnswerRequest(
  attemptId: number,
  payload: SaveAnswerPayload,
): Promise<AnswerState> {
  const encryptionKey =
    process.env.NEXT_PUBLIC_API_ENCRYPTION_KEY ||
    "dev-encryption-key-must-be-32-bytes-long!";
  const encrypted = await encryptPayload(payload, encryptionKey);
  const res = await axiosClient.post<AnswerState>(
    `/student/attempt/${attemptId}/answer`,
    { encrypted_data: encrypted },
  );
  return res.data;
}

export async function finalizeAttemptRequest(attemptId: number): Promise<QuizAttempt> {
  const res = await axiosClient.post<QuizAttempt>(`/student/attempt/${attemptId}/submit`);
  return res.data;
}

export async function getQuizLeaderboardRequest(quizId: number): Promise<LeaderboardEntry[]> {
  const res = await axiosClient.get<LeaderboardEntry[]>(`/student/quiz/${quizId}/leaderboard`);
  return res.data;
}

export async function getAttemptResultRequest(attemptId: number): Promise<QuizAttempt> {
  const res = await axiosClient.get<QuizAttempt>(`/student/attempt/${attemptId}/result`);
  return res.data;
}
