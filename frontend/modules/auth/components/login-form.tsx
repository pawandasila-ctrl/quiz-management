"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginForm() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = React.useCallback(() => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = React.useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!validate()) return;

      try {
        await login(email, password);
        toast.success("Welcome back!");
      } catch (err: unknown) {
        let errorMessage = "Incorrect email or password.";
        if (err && typeof err === "object" && "response" in err) {
          const responseErr = err as { response?: { data?: { detail?: string | { msg?: string }[] } } };
          const detail = responseErr.response?.data?.detail;
          if (detail) {
            if (typeof detail === "string") {
              errorMessage = detail;
            } else if (Array.isArray(detail)) {
              errorMessage = detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ");
            } else {
              errorMessage = JSON.stringify(detail);
            }
          }
        } else if (err && typeof err === "object" && "request" in err) {
          errorMessage = "Could not reach the server. Please check your connection and try again.";
        }
        toast.error(errorMessage);
      }
    },
    [email, password, login, validate]
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Quiz System
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sign in to access your assessment console
            </p>
          </div>
        </div>

        {/* Glass Card */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={
                  formErrors.email
                    ? "border-red-500 focus-visible:ring-red-500 h-10 bg-slate-950/60 text-white placeholder:text-slate-500"
                    : "h-10 bg-slate-950/60 border-slate-800 focus-visible:ring-indigo-500 text-white placeholder:text-slate-500"
                }
              />
              {formErrors.email && (
                <p className="text-xs font-medium text-red-400">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={
                  formErrors.password
                    ? "border-red-500 focus-visible:ring-red-500 h-10 bg-slate-950/60 text-white placeholder:text-slate-500"
                    : "h-10 bg-slate-950/60 border-slate-800 focus-visible:ring-indigo-500 text-white placeholder:text-slate-500"
                }
              />
              {formErrors.password && (
                <p className="text-xs font-medium text-red-400">{formErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all duration-200"
            >
              {loading ? "Authenticating..." : "Log in to Account"}
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
            Sign up as Student
          </Link>
        </div>
      </div>
    </div>
  );
}
