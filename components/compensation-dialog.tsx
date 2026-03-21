"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";

export interface CompensationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: number) => Promise<void>;
  isLoading?: boolean;
  title?: string;
}

export function CompensationDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  title = "Enter Compensation",
}: CompensationDialogProps) {
  const [compensation, setCompensation] = useState<string>("");

  const handleSubmit = async () => {
    const numValue = parseFloat(compensation);
    if (!isNaN(numValue) && numValue > 0) {
      await onSubmit(numValue);
      setCompensation(""); // Clear after successful submit
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCompensation(""); // Clear when dialog closes
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[412px] w-full">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="w-full flex flex-col gap-[10px] justify-between p-0">
          <CurrencyInput value={compensation} onChange={setCompensation} className="pr-12" />
          <Button disabled={!compensation || isLoading} variant={"default"} onClick={handleSubmit}>
            {isLoading ? "Adding..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
