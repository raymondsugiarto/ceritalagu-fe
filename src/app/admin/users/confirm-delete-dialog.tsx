"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            This cannot be undone. <span className="font-semibold text-foreground">{userName}</span>{" "}
            will be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2Icon className="animate-spin" aria-hidden />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
