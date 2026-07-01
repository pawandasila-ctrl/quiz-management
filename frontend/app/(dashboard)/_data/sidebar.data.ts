import { UserRole } from "@/models/auth/types";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Users,
  LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const sidebarConfig: SidebarItem[] = [
  // ── Admin Routes ──────────────────────────────────────────────────────────
  {
    title: "Quiz Management",
    url: "/admin",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Category Management",
    url: "/admin/categories",
    icon: FolderOpen,
    roles: ["admin"],
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  // ── Student Routes ────────────────────────────────────────────────────────
  {
    title: "Available Quizzes",
    url: "/dashboard",
    icon: BookOpen,
    roles: ["student"],
  },
];
