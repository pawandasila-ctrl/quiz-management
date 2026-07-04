import type { Metadata } from "next";
import RegisterForm from "@/modules/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register — Quiz System",
  description: "Create a student account to get started with available quizzes.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
