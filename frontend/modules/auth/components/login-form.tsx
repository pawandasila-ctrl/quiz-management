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
          const responseErr = err as { response?: { data?: { detail?: string } } };
          if (responseErr.response?.data?.detail) {
            errorMessage = responseErr.response.data.detail;
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
    <div className="flex flex-1 items-center justify-center p-6 bg-muted/40 min-h-screen">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <Card className="border-border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-center">
                Quiz System
              </CardTitle>
              <CardDescription className="text-center">
                Enter your email below to log in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={formErrors.email ? "border-destructive focus-visible:ring-destructive h-9" : "h-9"}
                />
                {formErrors.email && (
                  <p className="text-xs font-medium text-destructive">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={formErrors.password ? "border-destructive focus-visible:ring-destructive h-9" : "h-9"}
                />
                {formErrors.password && (
                  <p className="text-xs font-medium text-destructive">{formErrors.password}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-medium h-9" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
