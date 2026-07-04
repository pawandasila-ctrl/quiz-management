import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginRequest, registerRequest, logoutRequest, getMeRequest } from "../actions";
import { User, UserLoginResponse } from "../types";

export function useLoginMutation() {
  return useMutation<UserLoginResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginRequest(email, password),
  });
}

export function useRegisterMutation() {
  return useMutation<void, Error, { name: string; email: string; password: string }>({
    mutationFn: ({ name, email, password }) => registerRequest(name, email, password),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useMeQuery(enabled: boolean = true) {
  return useQuery<User, Error>({
    queryKey: ["auth-me"],
    queryFn: getMeRequest,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
