"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginForm() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

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
          const responseErr = err as {
            response?: { data?: { detail?: string | { msg?: string }[] } };
          };
          const detail = responseErr.response?.data?.detail;
          if (detail) {
            if (typeof detail === "string") {
              errorMessage = detail;
            } else if (Array.isArray(detail)) {
              errorMessage = detail
                .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
                .join(", ");
            } else {
              errorMessage = JSON.stringify(detail);
            }
          }
        } else if (err && typeof err === "object" && "request" in err) {
          errorMessage =
            "Could not reach the server. Please check your connection and try again.";
        }
        toast.error(errorMessage);
      }
    },
    [email, password, login, validate],
  );

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left Brand Panel - Minimalist Editorial (Visible on lg screens) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-slate-100 overflow-hidden dark:bg-slate-950">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
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
          <span className="font-heading text-lg font-bold tracking-tight">
            Quiz System
          </span>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <p className="font-heading text-2xl font-bold leading-snug text-white">
            &ldquo;Assessments engineered for clarity, real-time analytics, and
            instant feedback.&rdquo;
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium pt-2">
            <span>• Automated Grading</span>
            <span>• Leaderboard Insights</span>
            <span>• Anti-Cheat Security</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Quiz Platform. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel - Shadcn Card Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Brand Logo */}
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
              </svg>
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-foreground">
              Quiz System
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="border-border/80 rounded-2xl shadow-sm">
              <CardHeader className="space-y-1.5 pb-4">
                <CardTitle className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Sign in to your account
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Enter your email address and password below to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-foreground"
                  >
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
                        ? "border-destructive focus-visible:ring-destructive h-10 text-sm"
                        : "h-10 text-sm border-border focus-visible:ring-primary"
                    }
                  />
                  {formErrors.email && (
                    <p className="text-xs font-medium text-destructive">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold text-foreground"
                    >
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
                        ? "border-destructive focus-visible:ring-destructive h-10 text-sm"
                        : "h-10 text-sm border-border focus-visible:ring-primary"
                    }
                  />
                  {formErrors.password && (
                    <p className="text-xs font-medium text-destructive">
                      {formErrors.password}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all duration-150"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center text-xs text-muted-foreground pt-1">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary hover:underline underline-offset-4"
                  >
                    Create student account
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
