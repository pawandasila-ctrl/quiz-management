"use client";

import React, { useState } from "react";
import { useAdminCategories } from "@/models/quiz/hooks";
import { Loader2, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateCategoryModal from "@/components/admin/quiz/CreateCategoryModal";

export default function CategoryManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: categories, isLoading } = useAdminCategories();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Category Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your quizzes into categories.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {showCreate && <CreateCategoryModal onClose={() => setShowCreate(false)} />}

      {!categories || categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-muted/20">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No categories yet.</p>
          <p className="mt-1">Create one to organize your quizzes.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
