import type { Metadata } from "next";
import CreateCategoryButton from "./_components/CreateCategoryButton";
import AdminCategoryList from "./_components/AdminCategoryList";

export const metadata: Metadata = {
  title: "Category Management — Admin",
  description:
    "Organize examination papers and quizzes into academic categories.",
};

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Category Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your quizzes into categories.
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <AdminCategoryList />
    </div>
  );
}
