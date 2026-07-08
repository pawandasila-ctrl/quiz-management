"use client";

import React, { useState } from "react";
import { useCreateCategory } from "@/modules/quiz/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-card max-w-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs">Category Name</Label>
              <Input id="cat-name" className="h-9" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs">Description</Label>
              <Input id="cat-desc" className="h-9" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Short summary" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
