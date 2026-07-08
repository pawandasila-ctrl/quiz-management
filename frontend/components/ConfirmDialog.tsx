"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  trigger?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export default function ConfirmDialog({
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  trigger,
  isLoading = false,
  loadingText = "Deleting...",
}: ConfirmDialogProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const setIsOpen = isControlled
    ? controlledOnOpenChange
    : setUncontrolledIsOpen;

  useEffect(() => {
    if (!isControlled && uncontrolledIsOpen && !isLoading) {
    }
  }, [isLoading, isControlled, uncontrolledIsOpen]);

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen?.(open);
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isControlled && !isLoading) {
      setIsOpen?.(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild disabled={isLoading}>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {typeof description === "string" ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : (
            <AlertDialogDescription asChild>
              <div>{description}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => setIsOpen?.(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            disabled={isLoading}
            onClick={handleConfirm}
            className="min-w-[80px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? loadingText : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
