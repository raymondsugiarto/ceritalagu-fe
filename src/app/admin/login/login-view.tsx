"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api";
import { adminAuthApi } from "@/lib/admin-auth-api";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().trim().max(255).pipe(z.email("Masukkan email yang valid")),
  password: z.string().min(1, "Password wajib diisi").max(200),
});
type LoginValues = z.infer<typeof loginSchema>;

/** Only same-site admin paths are allowed as the post-login target (no open redirect). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, signedIn } = useAdminAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const next = safeNext(params.get("next"));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Already signed in (e.g. opened /admin/login in a new tab).
  React.useEffect(() => {
    if (state.kind === "signed-in") router.replace(next);
  }, [state.kind, next, router]);

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      signedIn(await adminAuthApi.login(values));
      router.replace(next);
    } catch (err) {
      const worded =
        err instanceof ApiError &&
        (err.code === "UNAUTHORIZED" || err.code === "TOO_MANY_REQUESTS");
      setServerError(worded ? errorMessage(err) : "Tidak bisa masuk. Coba lagi.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Music Admin</CardTitle>
          <CardDescription>Masuk dengan akun admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <FieldError id="email-error">{errors.email?.message}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <FieldError id="password-error">{errors.password?.message}</FieldError>
            </div>
            <FieldError role="alert">{serverError}</FieldError>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
