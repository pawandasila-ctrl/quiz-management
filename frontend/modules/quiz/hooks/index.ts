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
  updateUserRequest,
  toggleUserBlockRequest,
  deleteUserRequest,
  publishQuizRequest,
  closeQuizRequest,
  reopenQuizRequest,
  releaseResultsRequest,
  createQuestionRequest,
  bulkUploadQuestionsRequest,
  updateQuestionRequest,
  deleteQuestionRequest,
  deleteCategoryRequest,
  deleteAttemptRequest,
  deleteQuizRequest,
  SaveAnswerPayload,
  CreateQuizPayload,
  CreateCategoryPayload,
  CreateQuestionPayload,
  UpdateUserPayload,
} from "@/modules/quiz/actions";
import { Quiz, Category, QuizAttempt, LeaderboardEntry, AnswerState, PaginatedResponse, QuizFilterParams } from "../types";
import { User, UserRole } from "../../auth/types";

// ── Student Hooks ───────────────────────────────────────────────────────────

export function useStudentQuizzes(
  params?: QuizFilterParams,
  options?: { initialData?: PaginatedResponse<Quiz> }
) {
  return useQuery<PaginatedResponse<Quiz>, Error>({
    queryKey: ["student-quizzes", params],
    queryFn: () => getStudentQuizzesRequest(params),
    initialData: options?.initialData,
  });
}

export function useStudentAttempts(options?: { initialData?: QuizAttempt[] }) {
  return useQuery<QuizAttempt[], Error>({
    queryKey: ["student-attempts"],
    queryFn: getStudentAttemptsRequest,
    initialData: options?.initialData,
  });
}

export function useActiveQuizAttempt(quizId: number, options?: { enabled?: boolean }) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["active-quiz-attempt", quizId],
    queryFn: () => startQuizAttemptRequest(quizId),
    enabled: !isNaN(quizId) && (options?.enabled ?? true),
  });
}

export function useStudentQuizDetails(quizId: number, options?: { initialData?: Quiz }) {
  return useQuery<Quiz, Error>({
    queryKey: ["student-quiz-details", quizId],
    queryFn: () => getStudentQuizDetailsRequest(quizId),
    enabled: !isNaN(quizId),
    initialData: options?.initialData,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation<QuizAttempt, Error, number>({
    mutationFn: (quizId: number) => startQuizAttemptRequest(quizId),
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
      queryClient.invalidateQueries({
        queryKey: ["active-quiz-attempt", quizId],
      });
    },
  });
}

export function useSubmitAnswer() {
  return useMutation<
    AnswerState,
    Error,
    { attemptId: number; payload: SaveAnswerPayload }
  >({
    mutationFn: ({ attemptId, payload }) =>
      submitAnswerRequest(attemptId, payload),
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

export function useQuizLeaderboard(quizId: number, options?: { initialData?: LeaderboardEntry[] }) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["quiz-leaderboard", quizId],
    queryFn: () => getQuizLeaderboardRequest(quizId),
    enabled: !isNaN(quizId),
    initialData: options?.initialData,
  });
}

export function useQuizAttemptResult(
  attemptId: number,
  options?: { enabled?: boolean },
) {
  return useQuery<QuizAttempt, Error>({
    queryKey: ["quiz-attempt-result", attemptId],
    queryFn: () => getAttemptResultRequest(attemptId),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !isNaN(attemptId) && attemptId > 0,
    retry: false,
  });
}

// ── Admin Hooks ─────────────────────────────────────────────────────────────

export function useAdminQuizzes(
  params?: QuizFilterParams,
  options?: { initialData?: PaginatedResponse<Quiz> }
) {
  return useQuery<PaginatedResponse<Quiz>, Error>({
    queryKey: ["admin-quizzes", params],
    queryFn: () => getAdminQuizzesRequest(params),
    initialData: options?.initialData,
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

export function useAdminCategories(options?: { initialData?: Category[] }) {
  return useQuery<Category[], Error>({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategoriesRequest,
    initialData: options?.initialData,
  });
}

export function useAdminUsers(options?: { initialData?: User[] }) {
  return useQuery<User[], Error>({
    queryKey: ["admin-users"],
    queryFn: getAdminUsersRequest,
    initialData: options?.initialData,
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

export function useToggleUserBlock() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, number>({
    mutationFn: (userId: number) => toggleUserBlockRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: number; payload: UpdateUserPayload }>({
    mutationFn: ({ userId, payload }) => updateUserRequest(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (userId: number) => deleteUserRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function usePublishQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizIdVal: number) => publishQuizRequest(quizIdVal),
    onSuccess: (_, quizIdVal) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizIdVal],
      });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useCloseQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizIdVal: number) => closeQuizRequest(quizIdVal),
    onSuccess: (_, quizIdVal) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizIdVal],
      });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useReopenQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizIdVal: number) => reopenQuizRequest(quizIdVal),
    onSuccess: (_, quizIdVal) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizIdVal],
      });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}

export function useReleaseResults() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizIdVal: number) => releaseResultsRequest(quizIdVal),
    onSuccess: (_, quizIdVal) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizIdVal],
      });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
    },
  });
}

export function useCreateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CreateQuestionPayload>({
    mutationFn: (payload) => createQuestionRequest(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useBulkUploadQuestions(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CreateQuestionPayload[]>({
    mutationFn: (payload) => bulkUploadQuestionsRequest(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useUpdateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { questionId: number; payload: CreateQuestionPayload }>({
    mutationFn: ({ questionId, payload }) => updateQuestionRequest(questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useDeleteQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (questionId: number) => deleteQuestionRequest(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-details", quizId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (categoryId: number) => deleteCategoryRequest(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useDeleteAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (attemptId: number) => deleteAttemptRequest(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quiz-attempts", quizId],
      });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizId: number) => deleteQuizRequest(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["student-quizzes"] });
    },
  });
}
