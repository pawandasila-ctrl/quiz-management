import type { Metadata } from "next";
import LoginForm from "@/modules/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login — Quiz System",
  description: "Sign in to access your student portal or admin console.",
};

export default function LoginPage() {
  return <LoginForm />;
}
