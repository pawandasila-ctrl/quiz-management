import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import logger from "@/lib/utils/logger";

const AUTH_TOKEN_STORAGE_KEY = "auth.access_token";

export const axiosClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function setAuthHeader(token: string | null) {
  if (token) {
    axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common["Authorization"];
  }
}

export function setAuthToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  }

  setAuthHeader(token);
}

export function clearAuthToken() {
  setAuthToken(null);
}

if (typeof window !== "undefined") {
  const storedToken = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (storedToken) {
    setAuthHeader(storedToken);
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(null);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedToken =
        typeof window !== "undefined"
          ? sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
          : null;

      const refreshResponse = await axiosClient.post<{ access_token: string }>(
        "/auth/refresh-token",
        {},
        {
          withCredentials: true,
          headers: storedToken
            ? { Authorization: `Bearer ${storedToken}` }
            : undefined,
        },
      );

      const newToken = refreshResponse.data.access_token;
      if (newToken) {
        setAuthToken(newToken);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      }

      processQueue(null);
      isRefreshing = false;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      logger.error(
        "Token refresh failed — redirecting to login",
        refreshError,
        {
          module: "axiosClient",
        },
      );
      processQueue(refreshError as AxiosError);
      isRefreshing = false;

      clearAuthToken();

      if (typeof document !== "undefined") {
        document.cookie =
          "has_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie =
          "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  },
);

export function useAxios(): AxiosInstance {
  return axiosClient;
}
