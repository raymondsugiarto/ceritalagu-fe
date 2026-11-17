"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { userApi, type UserOutput } from "@/lib/user-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mirrors the backend's validate tags for fast feedback; the server stays the source of truth.
const userSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(100, "At most 100 characters"),
  email: z.string().trim().max(254).pipe(z.email("Enter a valid email")),
});
type UserFormValues = z.infer<typeof userSchema>;
const FIELDS = ["name", "email"] as const;

interface UserFormDialogProps {
  /** The user to edit, or `null` for the create flow. */
  user: UserOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful save so the parent can refetch. */
  onSaved: (user: UserOutput) => void;
}

export function UserFormDialog({ user, open, onOpenChange, onSaved }: UserFormDialogProps) {
  const isEdit = user !== null;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "" },
  });

  // Reset whenever the dialog opens so editing another user starts clean.
  React.useEffect(() => {
    if (!open) return;
    reset({ name: user?.name ?? "", email: user?.email ?? "" });
    setServerError(null);
  }, [open, user, reset]);

  async function onSubmit(values: UserFormValues) {
    setServerError(null);
    try {
      const saved = isEdit ? await userApi.update(user.id, values) : await userApi.create(values);
      toast.success(`${saved.name} ${isEdit ? "updated" : "created"}`);
      onOpenChange(false);
      onSaved(saved);
    } catch (err) {
      // 422 → per-field messages; 409 → the email uniqueness rule. Others → form-level message.
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        for (const [field, message] of Object.entries(err.fieldMap)) {
          if ((FIELDS as readonly string[]).includes(field)) {
            setError(field as (typeof FIELDS)[number], { type: "server", message });
          }
        }
      } else if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("email", { type: "server", message: err.message });
      } else {
        setServerError(errorMessage(err, "Could not save the user."));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the user's details." : "Add a new user."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            <FieldError id="name-error">{errors.name?.message}</FieldError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="email-error">{errors.email?.message}</FieldError>
          </div>

          <FieldError role="alert">{serverError}</FieldError>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
              {isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
