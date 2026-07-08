"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { uploadImageRequest } from "@/modules/quiz/actions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB.");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadImageRequest(file);
        onChange(url);
        toast.success("Image uploaded successfully.");
      } catch {
        toast.error("Image upload failed. Please try again.");
      } finally {
        setUploading(false);
        // reset so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        <ImageIcon className="h-3.5 w-3.5" />
        Question Image <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>

      {/* Preview */}
      {value && (
        <div className="relative w-full max-h-40 aspect-video rounded-md overflow-hidden border border-border bg-muted/20">
          <Image
            src={value}
            alt="Question image preview"
            fill
            quality={90}
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-destructive flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Upload row */}
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL or upload a file…"
          className="flex-1 text-sm"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 h-9"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Upload a file (max 5 MB) or paste a URL directly. Uploaded images are stored on Cloudinary.
      </p>
    </div>
  );
}
