"use client";

import React, { useCallback, useState, useRef } from "react";
import { useBulkUploadQuestions } from "@/modules/quiz/hooks";
import { QuestionType } from "@/modules/quiz/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BulkUploadModalProps {
  quizId: number;
  onClose: () => void;
}

interface ParsedQuestion {
  text: string;
  type: QuestionType;
  marks: number;
  order: number;
  explanation: string | null;
  image_url: string | null;
  options: { text: string; is_correct: boolean; order: number }[];
}

export default function BulkUploadModal({
  quizId,
  onClose,
}: BulkUploadModalProps) {
  const bulkUploadQuestionsMutation = useBulkUploadQuestions(quizId);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample CSV
  const handleDownloadSample = useCallback(() => {
    const csvContent = [
      "question_text,question_type,marks,explanation,option_1,option_1_correct,option_2,option_2_correct,option_3,option_3_correct,option_4,option_4_correct",
      '"What is 2 + 2?",mcq,5,"Because 2 + 2 = 4","4",true,"3",false,"5",false,"2",false',
      '"Is the earth flat?",true_false,2,"The earth is round","False",true,"True",false,,,',
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "quiz_bulk_upload_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.name.endsWith(".csv")) {
        setFile(selected);
      } else {
        toast.error("Please select a valid CSV file.");
      }
    }
  };

  // Standard RFC 4180 CSV line parser
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push("");
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a CSV file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Empty CSV file.");
        return;
      }

      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error(
            "CSV file must contain a header row and at least one question.",
          );
          return;
        }

        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const expectedHeaders = [
          "question_text",
          "question_type",
          "marks",
          "explanation",
          "option_1",
          "option_1_correct",
          "option_2",
          "option_2_correct",
          "option_3",
          "option_3_correct",
          "option_4",
          "option_4_correct",
        ];

        // Check if essential headers are present
        const missingHeaders = expectedHeaders
          .slice(0, 8)
          .filter((h) => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast.error(
            `Missing required CSV headers: ${missingHeaders.join(", ")}`,
          );
          return;
        }

        const getHeaderIndex = (name: string) => headers.indexOf(name);

        const questionsToUpload: ParsedQuestion[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 1 && row[0].trim() === "") continue; // Skip empty rows

          const qText = row[getHeaderIndex("question_text")]?.trim();
          const qTypeRaw = row[getHeaderIndex("question_type")]
            ?.trim()
            .toLowerCase();
          const qMarks = Number(row[getHeaderIndex("marks")]?.trim()) || 1;
          const qExplanation =
            row[getHeaderIndex("explanation")]?.trim() || null;

          if (!qText) {
            toast.error(`Row ${i + 1}: Question text is missing.`);
            return;
          }

          if (qTypeRaw !== "mcq" && qTypeRaw !== "true_false") {
            toast.error(
              `Row ${i + 1}: Invalid question type "${qTypeRaw}". Must be "mcq" or "true_false".`,
            );
            return;
          }

          const qType = qTypeRaw as QuestionType;

          // Parse options
          const options: {
            text: string;
            is_correct: boolean;
            order: number;
          }[] = [];

          const opt1Text = row[getHeaderIndex("option_1")]?.trim();
          const opt1Correct =
            row[getHeaderIndex("option_1_correct")]?.trim().toLowerCase() ===
            "true";
          const opt2Text = row[getHeaderIndex("option_2")]?.trim();
          const opt2Correct =
            row[getHeaderIndex("option_2_correct")]?.trim().toLowerCase() ===
            "true";

          if (!opt1Text || !opt2Text) {
            toast.error(`Row ${i + 1}: option_1 and option_2 are required.`);
            return;
          }

          options.push({ text: opt1Text, is_correct: opt1Correct, order: 1 });
          options.push({ text: opt2Text, is_correct: opt2Correct, order: 2 });

          if (qType === "mcq") {
            const opt3Text = row[getHeaderIndex("option_3")]?.trim();
            const opt3Correct =
              row[getHeaderIndex("option_3_correct")]?.trim().toLowerCase() ===
              "true";
            const opt4Text = row[getHeaderIndex("option_4")]?.trim();
            const opt4Correct =
              row[getHeaderIndex("option_4_correct")]?.trim().toLowerCase() ===
              "true";

            if (!opt3Text || !opt4Text) {
              toast.error(`Row ${i + 1}: mcq requires option_3 and option_4.`);
              return;
            }
            options.push({ text: opt3Text, is_correct: opt3Correct, order: 3 });
            options.push({ text: opt4Text, is_correct: opt4Correct, order: 4 });
          }

          // Verify at least one correct option exists
          if (!options.some((o) => o.is_correct)) {
            toast.error(
              `Row ${i + 1}: At least one option must be marked as correct (true).`,
            );
            return;
          }

          questionsToUpload.push({
            text: qText,
            type: qType,
            marks: qMarks,
            order: i,
            explanation: qExplanation,
            image_url: null,
            options,
          });
        }

        if (questionsToUpload.length === 0) {
          toast.error("No valid questions found in CSV.");
          return;
        }

        setIsUploading(true);
        setProgress("Uploading questions in bulk...");
        await bulkUploadQuestionsMutation.mutateAsync(questionsToUpload);

        toast.success(
          `Successfully uploaded ${questionsToUpload.length} questions!`,
        );
        onClose();
      } catch (err) {
        const errMsg =
          err instanceof Error
            ? err.message
            : "An error occurred during bulk upload.";
        toast.error(errMsg);
      } finally {
        setIsUploading(false);
        setProgress("");
      }
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isUploading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Upload Questions</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-5 py-2">
          {/* Download Sample Template Section */}
          <div className="rounded-lg border border-border bg-accent/5 p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                CSV Template
              </p>
              <p className="text-[11px] text-muted-foreground">
                Download the sample CSV file to ensure correct formatting.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="gap-1.5 h-8 text-xs shrink-0 border-border"
            >
              <Download className="h-3.5 w-3.5" /> Sample CSV
            </Button>
          </div>

          {/* File Picker Zone */}
          <div className="space-y-2">
            <Label
              htmlFor="csv-file"
              className="text-xs font-medium text-foreground"
            >
              Upload CSV File
            </Label>
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                file
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-stone-400"
              } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <FileSpreadsheet
                className={`h-8 w-8 ${file ? "text-primary animate-pulse" : "text-muted-foreground/60"}`}
              />
              <div className="text-center">
                {file ? (
                  <p className="text-xs font-semibold text-foreground max-w-[250px] truncate">
                    {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-medium text-foreground">
                      Click to browse file
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Must be a .csv file
                    </p>
                  </>
                )}
              </div>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Guidelines info */}
          <div className="flex gap-2 text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Formatting Guidelines:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <code>question_type</code> must be either <code>mcq</code> or{" "}
                  <code>true_false</code>.
                </li>
                <li>
                  True/False questions only require <code>option_1</code> and{" "}
                  <code>option_2</code>.
                </li>
                <li>
                  At least one option must have its correct column set to{" "}
                  <code>true</code>.
                </li>
              </ul>
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{progress}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Bulk Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
