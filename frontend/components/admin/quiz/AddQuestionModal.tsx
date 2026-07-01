"use client";

import React, { useCallback, useState } from "react";
import { useCreateQuestion } from "@/models/quiz/hooks";
import { QuestionType } from "@/models/quiz/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddQuestionModalProps {
  quizId: number;
  onClose: () => void;
}

export default function AddQuestionModal({ quizId, onClose }: AddQuestionModalProps) {
  const createQuestionMutation = useCreateQuestion(quizId);

  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<QuestionType>("mcq");
  const [qMarks, setQMarks] = useState(1);
  const [qOrder, setQOrder] = useState(1);
  const [qExplanation, setQExplanation] = useState("");
  const [qImageUrl, setQImageUrl] = useState("");

  const [mcqOptions, setMcqOptions] = useState([
    { text: "", is_correct: false, order: 1 },
    { text: "", is_correct: false, order: 2 },
    { text: "", is_correct: false, order: 3 },
    { text: "", is_correct: false, order: 4 },
  ]);

  const [tfCorrect, setTfCorrect] = useState<"true" | "false">("true");

  const handleMcqOptionTextChange = useCallback((index: number, text: string) => {
    setMcqOptions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text };
      return copy;
    });
  }, []);

  const handleMcqCorrectToggle = useCallback((index: number) => {
    setMcqOptions((prev) => prev.map((opt, i) => ({ ...opt, is_correct: i === index })));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!qText.trim()) {
        toast.error("Question text is required.");
        return;
      }

      if (qType === "mcq") {
        if (mcqOptions.some((opt) => !opt.text.trim())) {
          toast.error("Please fill in text for all 4 options.");
          return;
        }
        if (!mcqOptions.some((opt) => opt.is_correct)) {
          toast.error("Please select which option is correct.");
          return;
        }
      }

      const finalOptions =
        qType === "mcq"
          ? mcqOptions.map((opt) => ({
              text: opt.text.trim(),
              is_correct: opt.is_correct,
              order: opt.order,
            }))
          : [
              { text: "True", is_correct: tfCorrect === "true", order: 1 },
              { text: "False", is_correct: tfCorrect === "false", order: 2 },
            ];

      createQuestionMutation.mutate(
        {
          text: qText.trim(),
          type: qType,
          marks: Number(qMarks),
          order: Number(qOrder),
          explanation: qExplanation.trim() || null,
          image_url: qImageUrl.trim() || null,
          options: finalOptions,
        },
        {
          onSuccess: () => {
            toast.success("Question added successfully!");
            onClose();
          },
          onError: (err) => {
            toast.error(err.message || "Failed to add question.");
          },
        }
      );
    },
    [qText, qType, qMarks, qOrder, qExplanation, qImageUrl, mcqOptions, tfCorrect, createQuestionMutation, onClose]
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle>Add New Question</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Question text */}
            <div className="space-y-1.5">
              <Label htmlFor="q-text">
                Question Text <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="q-text"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="e.g. Solve: 3x = 12, x = ?"
                rows={2}
                className="resize-none"
                autoFocus
              />
            </div>

            {/* Type / Marks / Order */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="q-type">Question Type</Label>
                <Select
                  value={qType}
                  onValueChange={(v) => setQType(v as QuestionType)}
                >
                  <SelectTrigger id="q-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ (4 options)</SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-marks">Marks</Label>
                <Input
                  id="q-marks"
                  type="number"
                  min={1}
                  value={qMarks}
                  onChange={(e) => setQMarks(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-order">Display Order</Label>
                <Input
                  id="q-order"
                  type="number"
                  min={1}
                  value={qOrder}
                  onChange={(e) => setQOrder(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="q-img" className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Image URL (optional)
              </Label>
              <Input
                id="q-img"
                value={qImageUrl}
                onChange={(e) => setQImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <Label htmlFor="q-exp">Explanation (optional)</Label>
              <Textarea
                id="q-exp"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Shown to students after quiz results are released"
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Options */}
            <div className="border-t border-border pt-4 space-y-3">
              <Label className="font-semibold">
                {qType === "mcq" ? "Answer Options" : "Correct Answer"}
              </Label>

              {qType === "mcq" ? (
                <div className="space-y-2.5">
                  {mcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleMcqCorrectToggle(idx)}
                        className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                          opt.is_correct
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                        aria-label={`Mark option ${idx + 1} as correct`}
                      >
                        {opt.is_correct && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </button>
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => handleMcqOptionTextChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Click the circle to mark the correct option.
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={tfCorrect}
                  onValueChange={(v) => setTfCorrect(v as "true" | "false")}
                  className="flex gap-4"
                >
                  <label
                    htmlFor="tf-true"
                    className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem id="tf-true" value="true" />
                    <span className="text-sm font-medium">True</span>
                  </label>
                  <label
                    htmlFor="tf-false"
                    className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem id="tf-false" value="false" />
                    <span className="text-sm font-medium">False</span>
                  </label>
                </RadioGroup>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createQuestionMutation.isPending} className="gap-2">
              {createQuestionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {createQuestionMutation.isPending ? "Saving..." : "Save Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
