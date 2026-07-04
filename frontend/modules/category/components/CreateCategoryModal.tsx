"use client";

import React, { useState } from "react";
import { useCreateCategory } from "@/modules/quiz/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateCategoryModalProps {
  onClose: () => void;
}

export default function CreateCategoryModal({ onClose }: CreateCategoryModalProps) {
  const createCategoryMutation = useCreateCategory();
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const handleSubmit = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!catName.trim()) {
        toast.error("Category name is required.");
        return;
      }
      createCategoryMutation.mutate(
        {
          name: catName,
          description: catDesc || null,
        },
        {
          onSuccess: () => {
            toast.success("Category added!");
            onClose();
          },
          onError: (err) => {
            toast.error(err.message || "Failed to add category.");
          },
        }
      );
    },
    [catName, catDesc, createCategoryMutation, onClose]
  );

  return (
    <Card className="border-border bg-accent/15 max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">New Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-xs">Category Name</Label>
            <Input id="cat-name" className="h-8" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Mathematics" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-xs">Description</Label>
            <Input id="cat-desc" className="h-8" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Short summary" />
          </div>
        </CardContent>
        <CardContent className="flex justify-end gap-2 pt-0">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" disabled={createCategoryMutation.isPending}>
            {createCategoryMutation.isPending ? "Adding..." : "Add"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
