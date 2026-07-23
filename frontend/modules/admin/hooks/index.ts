import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
} from "@/modules/admin/actions";
import {
  CreateQuizPayload,
  CreateCategoryPayload,
  CreateQuestionPayload,
  UpdateUserPayload,
  UserFilterParams,
} from "@/modules/admin/types";
import { Quiz, Category, QuizAttempt, PaginatedResponse, QuizFilterParams } from "@/modules/quiz/types";
import { User, UserRole } from "@/modules/auth/types";

// ── Quiz Queries ──────────────────────────────────────────────────────────────

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

export function useAdminUsers(
  params?: UserFilterParams,
  options?: { initialData?: PaginatedResponse<User> }
) {
  return useQuery<PaginatedResponse<User>, Error>({
    queryKey: ["admin-users", params],
    queryFn: () => getAdminUsersRequest(params),
    initialData: options?.initialData,
  });
}

// ── Quiz Mutations ────────────────────────────────────────────────────────────

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: (payload) => createQuizRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
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

export function useReopenQuiz() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (quizId: number) => reopenQuizRequest(quizId),
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
      queryClient.invalidateQueries({ queryKey: ["student-attempts"] });
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

// ── Category Mutations ────────────────────────────────────────────────────────

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, CreateCategoryPayload>({
    mutationFn: (payload) => createCategoryRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
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

// ── Question Mutations ────────────────────────────────────────────────────────

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

export function useBulkUploadQuestions(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CreateQuestionPayload[]>({
    mutationFn: (payload) => bulkUploadQuestionsRequest(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-details", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });
}

export function useUpdateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { questionId: number; payload: CreateQuestionPayload }>({
    mutationFn: ({ questionId, payload }) => updateQuestionRequest(questionId, payload),
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

// ── Attempt Mutations ─────────────────────────────────────────────────────────

export function useDeleteAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (attemptId: number) => deleteAttemptRequest(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-attempts", quizId] });
    },
  });
}

// ── User Mutations ────────────────────────────────────────────────────────────

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: number; role: UserRole }>({
    mutationFn: ({ userId, role }) => updateUserRoleRequest(userId, role),
    onSuccess: (updatedUser) => {
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin-users"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.map((u) =>
              u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useToggleUserBlock() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, number>({
    mutationFn: (userId: number) => toggleUserBlockRequest(userId),
    onSuccess: (updatedUser) => {
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin-users"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.map((u) =>
              u.id === updatedUser.id ? { ...u, is_active: updatedUser.is_active } : u
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { userId: number; payload: UpdateUserPayload }>({
    mutationFn: ({ userId, payload }) => updateUserRequest(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin-users"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.map((u) =>
              u.id === updatedUser.id ? { ...u, ...updatedUser } : u
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (userId: number) => deleteUserRequest(userId),
    onSuccess: (_, userId) => {
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin-users"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            total: Math.max(0, old.total - 1),
            items: old.items.filter((u) => u.id !== userId),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
