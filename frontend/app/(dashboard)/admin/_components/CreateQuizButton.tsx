"use client";

import React, { useState } from "react";
import { useAdminCategories } from "@/modules/quiz/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateQuizModal from "@/modules/quiz/components/CreateQuizModal";

export default function CreateQuizButton() {
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const { data: categories } = useAdminCategories();

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowCreateQuiz((prev) => !prev)}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" /> Create Quiz
      </Button>

      {showCreateQuiz && (
        <CreateQuizModal
          categories={categories || []}
          onClose={() => setShowCreateQuiz(false)}
        />
      )}
    </>
  );
}
