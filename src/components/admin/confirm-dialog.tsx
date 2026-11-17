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

export interface ConfirmRequest {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation for admin actions that need a second look (deactivate, archive). */
export function ConfirmDialog({ request, open, onOpenChange }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleConfirm() {
    if (!request) return;
    setSubmitting(true);
    try {
      await request.onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>{request?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={request?.destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting && <Loader2Icon className="animate-spin" aria-hidden />}
            {request?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
