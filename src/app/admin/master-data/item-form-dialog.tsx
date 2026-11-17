"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import {
  masterDataApi,
  type MasterDataItemOutput,
  type MasterDataKindInfo,
} from "@/lib/masterdata-api";
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
import { Textarea } from "@/components/ui/textarea";

// Mirrors the backend rules (masterdata/dto.go + service.go); the server stays the source of truth.
const schema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,49}$/, "Huruf kecil, angka dan _, diawali huruf (mis. hari_ibu)")
    .refine((v) => v !== "other", "“other” dipakai untuk pilihan “Lainnya”"),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Maksimal 100 karakter"),
  description: z.string().trim().max(500, "Maksimal 500 karakter"),
  icon: z.string().trim().max(100, "Maksimal 100 karakter"),
  hint: z.string().trim().max(1000, "Maksimal 1000 karakter"),
  sort_order: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && +v <= 10000), "Angka 0–10000"),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
type Field = keyof Values;
const FIELDS: readonly Field[] = ["code", "name", "description", "icon", "hint", "sort_order"];

interface ItemFormDialogProps {
  info: MasterDataKindInfo;
  /** Row to edit, or `null` to add one. */
  item: MasterDataItemOutput | null;
  /** Suggested sort order for a new row (after the last one). */
  nextSortOrder: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: MasterDataItemOutput) => void;
}

export function ItemFormDialog({
  info,
  item,
  nextSortOrder,
  open,
  onOpenChange,
  onSaved,
}: ItemFormDialogProps) {
  const isEdit = item !== null;
  const isGenre = info.kind === "genre";
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset({
      code: item?.code ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      icon: item?.icon ?? "",
      hint: item?.hint ?? "",
      sort_order: String(item?.sort_order ?? nextSortOrder),
      is_active: item?.is_active ?? true,
    });
  }, [open, item, nextSortOrder, reset]);

  async function onSubmit(v: Values) {
    setServerError(null);
    const body = {
      name: v.name,
      hint: v.hint,
      sort_order: v.sort_order === "" ? 0 : Number(v.sort_order),
      is_active: v.is_active,
      ...(isGenre ? { description: v.description, icon: v.icon } : {}),
    };
    try {
      const saved = isEdit
        ? await masterDataApi.update(info.kind, item.id, body)
        : await masterDataApi.create(info.kind, { ...body, code: v.code });
      toast.success(`${saved.name} ${isEdit ? "disimpan" : "ditambahkan"}`);
      onOpenChange(false);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        for (const [field, message] of Object.entries(err.fieldMap)) {
          if ((FIELDS as readonly string[]).includes(field))
            setError(field as Field, { type: "server", message });
        }
      } else if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("code", { type: "server", message: err.message });
      } else {
        setServerError(errorMessage(err, "Data belum bisa disimpan."));
      }
    }
  }

  const fieldProps = (name: Field) => ({
    id: `item-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `item-${name}-error` : undefined,
  });
  const fieldError = (name: Field) => (
    <FieldError id={`item-${name}-error`}>{errors[name]?.message}</FieldError>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Ubah ${item.name}` : `Tambah ${info.title.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>Tampil di langkah {info.step} questioner.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-name">Nama (dilihat customer)</Label>
              <Input {...fieldProps("name")} autoFocus {...register("name")} />
              {fieldError("name")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-code">Kode</Label>
              <Input
                {...fieldProps("code")}
                className="font-mono"
                disabled={isEdit}
                spellCheck={false}
                placeholder="mis. hari_ibu"
                {...register("code")}
              />
              {isEdit ? (
                <p className="text-xs text-muted-foreground">Kode tidak bisa diubah.</p>
              ) : (
                fieldError("code")
              )}
            </div>
          </div>

          {isGenre && (
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div className="space-y-2">
                <Label htmlFor="item-description">Deskripsi</Label>
                <Input {...fieldProps("description")} {...register("description")} />
                {fieldError("description")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-icon">Ikon</Label>
                <Input {...fieldProps("icon")} placeholder="🎸" {...register("icon")} />
                {fieldError("icon")}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="item-hint">{info.hintLabel}</Label>
            <Textarea {...fieldProps("hint")} rows={3} {...register("hint")} />
            <p className="text-xs text-muted-foreground">
              {info.hintHelp} Tidak terlihat oleh customer.
            </p>
            {fieldError("hint")}
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div className="w-32 space-y-2">
              <Label htmlFor="item-sort_order">Urutan</Label>
              <Input
                {...fieldProps("sort_order")}
                inputMode="numeric"
                {...register("sort_order")}
              />
              {fieldError("sort_order")}
            </div>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("is_active")} />
              Aktif (tampil di questioner)
            </label>
          </div>

          <FieldError role="alert">{serverError}</FieldError>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
