"use client";

import React from "react";
import { useAdminCategories } from "@/modules/quiz/hooks";
import { Loader2, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminCategoryList() {
  const { data: categories, isLoading } = useAdminCategories();

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
              <Badge variant="outline" className="text-xs">
                ID #{cat.id}
              </Badge>
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
