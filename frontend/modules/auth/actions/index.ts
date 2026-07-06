import { axiosClient, setAuthToken, clearAuthToken } from "@/hooks/use-axios";
import { User, UserLoginResponse } from "../types";

export async function loginRequest(email: string, password: string): Promise<UserLoginResponse> {
  const res = await axiosClient.post<UserLoginResponse>("/auth/login", {
    email,
    password,
  });

  setAuthToken(res.data.access_token);
  return res.data;
}

export async function registerRequest(name: string, email: string, password: string): Promise<void> {
  await axiosClient.post("/auth/register", {
    name,
    email,
    password,
  });
}

export async function logoutRequest(): Promise<void> {
  try {
    await axiosClient.post("/auth/logout");
  } finally {
    clearAuthToken();
  }
}

export async function getMeRequest(): Promise<User> {
  const res = await axiosClient.get<User>("/auth/me");
  return res.data;
}
