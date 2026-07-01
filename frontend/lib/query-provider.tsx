"use client";

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
