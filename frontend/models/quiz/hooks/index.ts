import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudentQuizzesRequest,
  getStudentAttemptsRequest,
  getStudentQuizDetailsRequest,
  startQuizAttemptRequest,
  submitAnswerRequest,
  finalizeAttemptRequest,
  getQuizLeaderboardRequest,
  getAttemptResultRequest,
  getAdminQuizzesRequest,
  getAdminQuizDetailsRequest,
  getAdminQuizAttemptsRequest,
  getAdminCategoriesRequest,
  getAdminUsersRequest,
  createQuizRequest,
  createCategoryRequest,
  updateUserRoleRequest,
  publishQuizRequest,
  closeQuizRequest,
  releaseResultsRequest,
  createQuestionRequest,
  deleteQuestionRequest,
  SaveAnswerPayload,
  CreateQuizPayload,
  CreateCategoryPayload,
  CreateQuestionPayload,
} from "../actions";
import { Quiz, Category, QuizAttempt, LeaderboardEntry } from "../types";
import { User, UserRole } from "../../auth/types";

// ── Student Hooks ───────────────────────────────────────────────────────────

export function useStudentQuizzes() {
  return useQuery<Quiz[], Error>({
    queryKey: ["student-quizzes"],
    queryFn: getStudentQuizzesRequest,
  });
}

export function useStudentAttempts() {
  return useQuery<QuizAttempt[], Error>({
    queryKey: ["student-attempts"],
    queryFn: getStudentAttemptsRequest,
  });
}

export function useActiveQuizAttempt(quizId: number) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["active-quiz-attempt", quizId],
    queryFn: () => startQuizAttemptRequest(quizId),
    enabled: !isNaN(quizId),
  });
}

export function useStudentQuizDetails(quizId: number) {
  return useQuery<Quiz, Error>({
    queryKey: ["student-quiz-details", quizId],
    queryFn: () => getStudentQuizDetailsRequest(quizId),
    enabled: !isNaN(quizId),
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, number>({
    mutationFn: (quizId: number) => startQuizAttemptRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["active-quiz-attempt", quizId] });
    },
  });
}

export function useSubmitAnswer() {
  return useMutation<void, Error, { attemptId: number; payload: SaveAnswerPayload }>({
    mutationFn: ({ attemptId, payload }) => submitAnswerRequest(attemptId, payload),
  });
}

export function useFinalizeAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, number>({
    mutationFn: (attemptId: number) => finalizeAttemptRequest(attemptId),
    onSuccess: (data) => {
      queryClient.setQueryData(["active-quiz-attempt", quizId], data);
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
    },
  });
}

export function useQuizLeaderboard(quizId: number) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["quiz-leaderboard", quizId],
    queryFn: () => getQuizLeaderboardRequest(quizId),
    enabled: !isNaN(quizId),
  });
}

export function useQuizAttemptResult(attemptId: number, options?: { enabled?: boolean }) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["quiz-attempt-result", attemptId],
    queryFn: () => getAttemptResultRequest(attemptId),
    enabled: options?.enabled !== undefined ? options.enabled : (!isNaN(attemptId) && attemptId > 0),
    retry: false,
  });
}

// ── Admin Hooks ─────────────────────────────────────────────────────────────

export function useAdminQuizzes() {
  return useQuery<Quiz[], Error>({
    queryKey: ["admin-quizzes"],
    queryFn: getAdminQuizzesRequest,
  });
}

export function useAdminQuizDetails(quizId: number) {
  return useQuery<Quiz, Error>({
    queryKey: ["admin-quiz-details", quizId],
    queryFn: () => getAdminQuizDetailsRequest(quizId),
    enabled: !isNaN(quizId),
  });
}

export function useAdminQuizAttempts(quizId: number) {
  return useQuery<QuizAttempt[], Error>({
    queryKey: ["admin-quiz-attempts", quizId],
    queryFn: () => getAdminQuizAttemptsRequest(quizId),
    enabled: !isNaN(quizId),
  });
}

export function useAdminCategories() {
  return useQuery<Category[], Error>({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategoriesRequest,
  });
}

export function useAdminUsers() {
  return useQuery<User[], Error>({
    queryKey: ["admin-users"],
    queryFn: getAdminUsersRequest,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: (payload) => createQuizRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, CreateCategoryPayload>({
    mutationFn: (payload) => createCategoryRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { userId: number; role: UserRole }>({
    mutationFn: ({ userId, role }) => updateUserRoleRequest(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function usePublishQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizId: number) => publishQuizRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useCloseQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizId: number) => closeQuizRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useReleaseResults() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizId: number) => releaseResultsRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useCreateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CreateQuestionPayload>({
    mutationFn: (payload) => createQuestionRequest(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useDeleteQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (questionId: number) => deleteQuestionRequest(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}
