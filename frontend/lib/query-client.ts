import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import logger from "./utils/logger";
import { AxiosError } from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status === 401) {
          return false;
        }
        logger.warn(
          "Query retry",
          { failureCount, error },
          { module: "QueryClient" },
        );
        return failureCount < 2;
      },
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      staleTime: 3 * 60 * 1000,
    },
    mutations: {
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        if (message === "NEXT_REDIRECT") return;
        toast.error(message);
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      logger.error("Global Query Cache Error", error, { module: "QueryCache" });
    },
  }),
});

export default queryClient;
