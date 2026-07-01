"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterForm() {
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = "Full name is required";
    }
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
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(name, email, password);
      toast.success("Account created successfully! Welcome.");
    } catch (err: unknown) {
      let errorMessage = "Registration failed. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const responseErr = err as { response?: { data?: { detail?: string } } };
        if (responseErr.response?.data?.detail) {
          errorMessage = responseErr.response.data.detail;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 bg-muted/40 min-h-screen">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <Card className="border-border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-center">
                Register Student
              </CardTitle>
              <CardDescription className="text-center">
                Create a student account to start taking quizzes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive h-9" : "h-9"}
                />
                {formErrors.name && (
                  <p className="text-xs font-medium text-destructive">{formErrors.name}</p>
                )}
              </div>
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
                <Label htmlFor="password">Password</Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive h-9" : "h-9"}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">{formErrors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-medium h-9" disabled={loading}>
                {loading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
