"use client";

import React from "react";
import { useAdminCategories, useDeleteCategory } from "@/modules/quiz/hooks";
import { Loader2, FolderOpen, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

import { useAuth } from "@/lib/auth-context";

export default function AdminCategoryList() {
  const { data: categories, isLoading } = useAdminCategories();
  const deleteCategoryMutation = useDeleteCategory();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
        <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No categories yet.</p>
        <p className="mt-1">Create one to organize your quizzes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((cat) => (
        <Card key={cat.id} className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                {cat.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ID #{cat.id}
                </Badge>
                {isAdmin && (
                  <ConfirmDialog
                    title="Delete Category"
                    description={`Are you sure you want to delete the category "${cat.name}"? Quizzes belonging to it will be set to uncategorized.`}
                    onConfirm={() => {
                      deleteCategoryMutation.mutate(cat.id, {
                        onSuccess: () =>
                          toast.success("Category deleted successfully."),
                        onError: (err) =>
                          toast.error(
                            err.message || "Failed to delete category.",
                          ),
                      });
                    }}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="destructive"
                    isLoading={deleteCategoryMutation.isPending}
                    loadingText="Deleting..."
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {cat.description || "No description provided."}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
