"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateCategoryModal from "@/modules/category/components/CreateCategoryModal";

export default function CreateCategoryButton() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowCreate((prev) => !prev)}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" /> New Category
      </Button>

      {showCreate && <CreateCategoryModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
