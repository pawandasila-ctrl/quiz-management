import { axiosClient } from "@/hooks/use-axios";
import {
  Quiz,
  Category,
  QuizAttempt,
  PaginatedResponse,
  QuizFilterParams,
} from "@/modules/quiz/types";
import { User, UserRole } from "@/modules/auth/types";
import {
  UpdateUserPayload,
  UserFilterParams,
  CreateQuizPayload,
  CreateCategoryPayload,
  CreateQuestionPayload,
} from "@/modules/admin/types";

// ── Quiz ─────────────────────────────────────────────────────────────────────

export async function getAdminQuizzesRequest(
  params?: QuizFilterParams,
): Promise<PaginatedResponse<Quiz>> {
  const res = await axiosClient.get<PaginatedResponse<Quiz>>("/admin/quiz", {
    params,
  });
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
  const res = await axiosClient.get<QuizAttempt[]>(
    `/admin/quiz/${quizId}/attempts`,
  );
  return res.data;
}

export async function createQuizRequest(
  payload: CreateQuizPayload,
): Promise<Quiz> {
  const res = await axiosClient.post<Quiz>("/admin/quiz", payload);
  return res.data;
}

export async function publishQuizRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/publish`);
}

export async function closeQuizRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/close`);
}

export async function reopenQuizRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/reopen`);
}

export async function releaseResultsRequest(quizId: number): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/release-results`);
}

export async function deleteQuizRequest(quizId: number): Promise<void> {
  await axiosClient.delete(`/admin/quiz/${quizId}`);
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAdminCategoriesRequest(): Promise<Category[]> {
  const res = await axiosClient.get<Category[]>("/admin/categories");
  return res.data;
}

export async function createCategoryRequest(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const res = await axiosClient.post<Category>("/admin/categories", payload);
  return res.data;
}

export async function deleteCategoryRequest(categoryId: number): Promise<void> {
  await axiosClient.delete(`/admin/categories/${categoryId}`);
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function createQuestionRequest(
  quizId: number,
  payload: CreateQuestionPayload,
): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/questions`, payload);
}

export async function bulkUploadQuestionsRequest(
  quizId: number,
  payload: CreateQuestionPayload[],
): Promise<void> {
  await axiosClient.post(`/admin/quiz/${quizId}/questions/bulk`, payload);
}

export async function updateQuestionRequest(
  questionId: number,
  payload: CreateQuestionPayload,
): Promise<void> {
  await axiosClient.put(`/admin/questions/${questionId}`, payload);
}

export async function deleteQuestionRequest(questionId: number): Promise<void> {
  await axiosClient.delete(`/admin/questions/${questionId}`);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getAdminUsersRequest(
  params?: UserFilterParams,
): Promise<PaginatedResponse<User>> {
  const res = await axiosClient.get<PaginatedResponse<User>>("/admin/users", {
    params,
  });
  return res.data;
}

export async function updateUserRoleRequest(
  userId: number,
  role: UserRole,
): Promise<User> {
  const res = await axiosClient.put<User>(`/admin/users/${userId}/role?role=${role}`);
  return res.data;
}

export async function updateUserRequest(
  userId: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const res = await axiosClient.patch<User>(`/admin/users/${userId}`, payload);
  return res.data;
}

export async function toggleUserBlockRequest(userId: number): Promise<User> {
  const res = await axiosClient.patch<User>(`/admin/users/${userId}/block`);
  return res.data;
}

export async function deleteUserRequest(userId: number): Promise<void> {
  await axiosClient.delete(`/admin/users/${userId}`);
}

// ── Attempts ─────────────────────────────────────────────────────────────────

export async function deleteAttemptRequest(attemptId: number): Promise<void> {
  await axiosClient.delete(`/admin/attempts/${attemptId}`);
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadImageRequest(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosClient.post<{ secure_url: string }>(
    "/admin/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.secure_url;
}
