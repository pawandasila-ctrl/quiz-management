"use client";

import React, { useCallback, useState } from "react";
import { useCreateQuiz } from "@/models/quiz/hooks";
import { Category } from "@/models/quiz/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateQuizModalProps {
  categories: Category[];
  onClose: () => void;
}

export default function CreateQuizModal({ categories, onClose }: CreateQuizModalProps) {
  const router = useRouter();
  const createQuizMutation = useCreateQuiz();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [passMark, setPassMark] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!title.trim()) {
        toast.error("Quiz title is required.");
        return;
      }
      createQuizMutation.mutate(
        {
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId === "" ? null : Number(categoryId),
          time_limit_minutes: timeLimit === "" ? null : Number(timeLimit),
          pass_mark: Number(passMark),
          shuffle_questions: shuffleQuestions,
          max_attempts: Number(maxAttempts),
        },
        {
          onSuccess: (newQuiz) => {
            toast.success("Quiz created! Taking you to the builder...");
            onClose();
            router.push(`/admin/quiz/${newQuiz.id}`);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to create quiz.");
          },
        }
      );
    },
    [title, description, categoryId, timeLimit, passMark, shuffleQuestions, maxAttempts, createQuizMutation, onClose, router]
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle>New Quiz</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="quiz-title">Quiz Title <span className="text-destructive">*</span></Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Basic Calculus"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="quiz-desc">Description</Label>
              <Textarea
                id="quiz-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions or context for students..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Category + Time Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quiz-category">Category</Label>
                <Select
                  value={categoryId === "" ? "" : String(categoryId)}
                  onValueChange={(v) =>
                    setCategoryId(v === "" ? "" : Number(v))
                  }
                >
                  <SelectTrigger id="quiz-category">
                    <SelectValue placeholder="No Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quiz-time">Time Limit (mins)</Label>
                <Input
                  id="quiz-time"
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(e) =>
                    setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Pass Mark + Max Attempts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quiz-pass">Pass Mark</Label>
                <Input
                  id="quiz-pass"
                  type="number"
                  min={0}
                  value={passMark}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quiz-attempts">Max Attempts</Label>
                <Input
                  id="quiz-attempts"
                  type="number"
                  min={1}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Shuffle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="quiz-shuffle"
                checked={shuffleQuestions}
                onCheckedChange={(v) => setShuffleQuestions(!!v)}
              />
              <Label htmlFor="quiz-shuffle" className="cursor-pointer select-none">
                Shuffle question order
              </Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createQuizMutation.isPending} className="gap-2">
              {createQuizMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
