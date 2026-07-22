import type { Metadata } from "next";
import CreateCategoryButton from "./_components/CreateCategoryButton";
import AdminCategoryList from "./_components/AdminCategoryList";
import { serverFetch } from "@/lib/server-api";
import { Category } from "@/modules/quiz/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Category Management — Admin",
  description: "Create and organize quiz subjects and topic categories.",
};

export default async function AdminCategoriesPage() {
  const initialCategories = await serverFetch<Category[]>("/admin/categories");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Category Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize quizzes by subjects, departments, or difficulty tags.
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <AdminCategoryList initialCategories={initialCategories || undefined} />
    </div>
  );
}
