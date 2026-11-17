"use client";

import * as React from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import {
  CATEGORY_LABELS,
  providerApi,
  type AdapterOutput,
  type ParamSpec,
  type ProviderCategory,
  type ProviderOutput,
} from "@/lib/provider-api";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

// Mirrors the backend validate tags (aiprovider/dto.go); the server stays the source of truth.
const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && +v >= min && +v <= max), `Angka ${min}–${max}`);

const schema = z.object({
  adapter_type: z.string().min(1, "Pilih adapter"),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Maksimal 100 karakter"),
  base_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https?:\/\/\S+$/.test(v),
      "URL harus diawali http:// atau https://",
    ),
  model: z.string().trim().max(100, "Maksimal 100 karakter"),
  api_key: z.string().trim().max(1000),
  timeout_sec: optionalInt(5, 900),
  max_retries: optionalInt(0, 5),
  priority: optionalInt(1, 100),
  /** Adapter-specific settings as typed text; converted by ParamSpec.kind on submit. */
  params: z.record(z.string(), z.string()),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
type Field = Exclude<keyof Values, "params">;
const FIELDS: readonly Field[] = [
  "adapter_type",
  "name",
  "base_url",
  "model",
  "api_key",
  "timeout_sec",
  "max_retries",
  "priority",
];

/** Client-side mirror of the backend checkParam (aiprovider/service.go). */
function paramIssue(spec: ParamSpec, raw: string): string | null {
  const v = raw.trim();
  if (v === "" || spec.options) return null;
  if (spec.kind !== "int" && spec.kind !== "float") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return "Harus berupa angka";
  if (spec.kind === "int" && !Number.isInteger(n)) return "Harus bilangan bulat";
  if (spec.min !== undefined && n < spec.min) return `Minimal ${spec.min}`;
  if (spec.max !== undefined && n > spec.max) return `Maksimal ${spec.max}`;
  return null;
}

/** Stored params → form text (numbers become strings). */
function paramsToText(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" || typeof v === "number") out[k] = String(v);
  }
  return out;
}

/**
 * Form text → params for the adapter. Empty values are left out so the adapter default applies.
 * Keys the adapter does not declare are kept from `previous` so editing never drops them.
 */
function textToParams(
  specs: ParamSpec[],
  text: Record<string, string>,
  previous: Record<string, unknown> = {},
): Record<string, unknown> {
  const declared = new Set(specs.map((s) => s.key));
  const out: Record<string, unknown> = Object.fromEntries(
    Object.entries(previous).filter(([k]) => !declared.has(k)),
  );
  for (const spec of specs) {
    const v = (text[spec.key] ?? "").trim();
    if (v === "") continue;
    out[spec.key] = spec.kind === "int" || spec.kind === "float" ? Number(v) : v;
  }
  return out;
}

interface ProviderFormDialogProps {
  /** Category of the list the dialog was opened from. */
  category: ProviderCategory;
  /** Provider to edit, or `null` to add one. */
  provider: ProviderOutput | null;
  adapters: AdapterOutput[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (provider: ProviderOutput) => void;
}

export function ProviderFormDialog({
  category,
  provider,
  adapters,
  open,
  onOpenChange,
  onSaved,
}: ProviderFormDialogProps) {
  const isEdit = provider !== null;
  const options = adapters.filter((a) => a.category === category);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(
      // A new provider needs a key; when editing, an empty key keeps the stored one.
      schema.superRefine((v, ctx) => {
        if ((!isEdit || v.api_key !== "") && v.api_key.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["api_key"],
            message: "API key minimal 8 karakter",
          });
        }
        const specs = adapters.find((a) => a.type === v.adapter_type)?.params ?? [];
        for (const spec of specs) {
          const message = paramIssue(spec, v.params[spec.key] ?? "");
          if (message) ctx.addIssue({ code: "custom", path: ["params", spec.key], message });
        }
      }),
    ),
  });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset({
      adapter_type:
        provider?.adapter_type ?? adapters.find((a) => a.category === category)?.type ?? "",
      name: provider?.name ?? "",
      base_url: provider?.base_url ?? "",
      model: provider?.model ?? "",
      api_key: "",
      timeout_sec: provider ? String(provider.timeout_sec) : "",
      max_retries: provider ? String(provider.max_retries) : "",
      priority: provider ? String(provider.priority) : "",
      params: provider ? paramsToText(provider.params) : {},
      is_active: false,
    });
  }, [open, provider, adapters, category, reset]);

  const adapter = adapters.find((a) => a.type === watch("adapter_type"));
  const specs = adapter?.params ?? [];
  const toInt = (v: string) => (v === "" ? undefined : Number(v));

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      const common = {
        name: v.name,
        base_url: v.base_url,
        model: v.model,
        timeout_sec: toInt(v.timeout_sec),
        max_retries: toInt(v.max_retries),
        priority: toInt(v.priority),
        params: textToParams(specs, v.params, provider?.params),
      };
      const saved = isEdit
        ? await providerApi.update(provider.id, {
            ...common,
            ...(v.api_key ? { api_key: v.api_key } : {}),
          })
        : await providerApi.create({
            ...common,
            category,
            adapter_type: v.adapter_type,
            api_key: v.api_key,
            is_active: v.is_active,
          });
      toast.success(`${saved.name} ${isEdit ? "disimpan" : "ditambahkan"}`);
      onOpenChange(false);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        for (const [field, message] of Object.entries(err.fieldMap)) {
          if ((FIELDS as readonly string[]).includes(field)) {
            setError(field as Field, { type: "server", message });
          } else if (field.startsWith("params.")) {
            setError(field as `params.${string}`, { type: "server", message });
          }
        }
      } else {
        setServerError(errorMessage(err, "Provider belum bisa disimpan."));
      }
    }
  }

  const fieldProps = (name: Field) => ({
    id: `provider-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `provider-${name}-error` : undefined,
  });
  const fieldError = (name: Field) => (
    <FieldError id={`provider-${name}-error`}>{errors[name]?.message}</FieldError>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Ubah ${provider.name}` : "Tambah provider"}</DialogTitle>
          <DialogDescription>{CATEGORY_LABELS[category]}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-adapter_type">Adapter</Label>
            <NativeSelect
              {...fieldProps("adapter_type")}
              disabled={isEdit}
              {...register("adapter_type")}
            >
              {options.map((a) => (
                <option key={a.type} value={a.type}>
                  {a.label}
                </option>
              ))}
            </NativeSelect>
            {adapter?.help && <p className="text-xs text-muted-foreground">{adapter.help}</p>}
            {fieldError("adapter_type")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-name">Nama</Label>
            <Input
              {...fieldProps("name")}
              placeholder={adapter?.label ?? "MiniMax"}
              autoFocus
              {...register("name")}
            />
            {fieldError("name")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-api_key">API key</Label>
            <Input
              {...fieldProps("api_key")}
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={
                isEdit ? `${provider.api_key_masked} — kosongkan jika tidak diganti` : ""
              }
              {...register("api_key")}
            />
            <p className="text-xs text-muted-foreground">
              Disimpan terenkripsi. Setelah disimpan hanya 4 karakter terakhir yang ditampilkan.
            </p>
            {fieldError("api_key")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider-model">Model</Label>
              <Input
                {...fieldProps("model")}
                list="provider-model-options"
                placeholder={adapter?.default_model}
                {...register("model")}
              />
              <datalist id="provider-model-options">
                {adapter?.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {fieldError("model")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-base_url">Base URL</Label>
              <Input
                {...fieldProps("base_url")}
                inputMode="url"
                placeholder={adapter?.default_base_url}
                {...register("base_url")}
              />
              {fieldError("base_url")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-timeout_sec">Timeout (detik)</Label>
              <Input
                {...fieldProps("timeout_sec")}
                inputMode="numeric"
                placeholder={category === "music" ? "300" : "60"}
                {...register("timeout_sec")}
              />
              {fieldError("timeout_sec")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-max_retries">Jumlah retry</Label>
              <Input
                {...fieldProps("max_retries")}
                inputMode="numeric"
                placeholder="2"
                {...register("max_retries")}
              />
              {fieldError("max_retries")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="provider-priority">Priority</Label>
              <Input
                {...fieldProps("priority")}
                inputMode="numeric"
                placeholder="1"
                className="sm:w-32"
                {...register("priority")}
              />
              <p className="text-xs text-muted-foreground">
                Angka 1 dipakai lebih dulu. Provider aktif dengan angka sama dianggap setara dan
                dipilih acak setiap job.
              </p>
              {fieldError("priority")}
            </div>
          </div>

          {specs.length > 0 && (
            <fieldset className="space-y-3 rounded-md border p-3">
              <legend className="px-1 text-sm font-medium">
                Pengaturan {adapter?.label ?? "adapter"}
              </legend>
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk memakai default adapter.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {specs.map((spec) => (
                  <ParamField
                    key={`${adapter?.type}-${spec.key}`}
                    spec={spec}
                    error={errors.params?.[spec.key]?.message}
                    inputProps={register(`params.${spec.key}`)}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {!isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("is_active")} />
              Langsung jadikan provider aktif untuk kategori ini
            </label>
          )}

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
              {isEdit ? "Simpan" : "Tambah provider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ParamFieldProps {
  spec: ParamSpec;
  error?: string;
  inputProps: UseFormRegisterReturn;
}

function ParamField({ spec, error, inputProps }: ParamFieldProps) {
  const id = `provider-param-${spec.key}`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const a11y = {
    id,
    "aria-invalid": !!error,
    "aria-describedby":
      [error && errorId, spec.help && helpId].filter(Boolean).join(" ") || undefined,
  };
  const numeric = spec.kind === "int" || spec.kind === "float";
  let control: React.ReactNode;
  if (spec.options) {
    control = (
      <NativeSelect {...a11y} {...inputProps}>
        <option value="">{spec.placeholder ? `Default (${spec.placeholder})` : "Default"}</option>
        {spec.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </NativeSelect>
    );
  } else if (spec.kind === "text") {
    control = <Textarea {...a11y} rows={3} placeholder={spec.placeholder} {...inputProps} />;
  } else {
    control = (
      <Input
        {...a11y}
        inputMode={numeric ? "decimal" : undefined}
        placeholder={spec.placeholder}
        {...inputProps}
      />
    );
  }
  return (
    <div className={spec.kind === "text" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{spec.label}</Label>
      {control}
      {spec.help && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {spec.help}
        </p>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
