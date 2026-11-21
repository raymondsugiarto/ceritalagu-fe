"use client";

import * as React from "react";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import { adminSongApi, type AdminSongOutput, type SongEmailKind } from "@/lib/admin-song-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const KINDS: { value: SongEmailKind; label: string; help: string }[] = [
  {
    value: "song_ready",
    label: "Lagu sudah siap",
    help: "Email otomatis setelah lagu selesai dibuat (link + lampiran preview).",
  },
  {
    value: "payment_receipt",
    label: "Pembayaran berhasil",
    help: "Bukti pembayaran dan link lagu lengkap (template Brevo). Hanya untuk lagu yang sudah dibayar.",
  },
];

type Target = "customer" | "test";

/** Resends a customer email for one song, or sends it to a test inbox. */
export function SendEmailDialog({
  song,
  onOpenChange,
}: {
  song: AdminSongOutput | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [kind, setKind] = React.useState<SongEmailKind>("song_ready");
  const [target, setTarget] = React.useState<Target>("customer");
  const [to, setTo] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasCustomer = Boolean(song?.user_email);

  // Fresh defaults every time the dialog opens on a song.
  React.useEffect(() => {
    if (!song) return;
    setKind(song.is_unlocked ? "payment_receipt" : "song_ready");
    setTarget(song.user_email ? "customer" : "test");
    setError(null);
  }, [song]);

  const receiptBlocked = kind === "payment_receipt" && !song?.is_unlocked;
  const toValid = target === "customer" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
  const canSend = !sending && !receiptBlocked && toValid && (target === "test" || hasCustomer);

  async function send() {
    if (!song || !canSend) return;
    setSending(true);
    setError(null);
    try {
      const out = await adminSongApi.sendEmail(song.id, {
        kind,
        to: target === "test" ? to.trim() : undefined,
      });
      toast.success(`Email terkirim ke ${out.to}${out.test ? " (tes)" : ""}`);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, "Email gagal dikirim."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={song !== null} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim email</DialogTitle>
          <DialogDescription>{song?.title || "Tanpa judul"}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Jenis email</legend>
            {KINDS.map((k) => {
              const disabled = k.value === "payment_receipt" && !song?.is_unlocked;
              return (
                <label
                  key={k.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-md border p-3 text-sm",
                    kind === k.value && "border-primary bg-primary/5",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="email-kind"
                    value={k.value}
                    checked={kind === k.value}
                    disabled={disabled}
                    onChange={() => setKind(k.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="font-medium">{k.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {disabled ? "Lagu ini belum dibayar." : k.help}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Kirim ke</legend>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 text-sm",
                !hasCustomer && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="email-target"
                checked={target === "customer"}
                disabled={!hasCustomer}
                onChange={() => setTarget("customer")}
                className="accent-primary"
              />
              <span>
                Customer{" "}
                <span className="text-muted-foreground">
                  ({song?.user_email || "belum ada email, lagu guest"})
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name="email-target"
                checked={target === "test"}
                onChange={() => setTarget("test")}
                className="accent-primary"
              />
              Alamat tes
            </label>
            {target === "test" && (
              <div className="space-y-1 pl-7">
                <Label htmlFor="email-test-to" className="sr-only">
                  Alamat email tes
                </Label>
                <Input
                  id="email-test-to"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@contoh.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Isinya sama dengan email ke customer, hanya tujuannya yang diganti.
                </p>
              </div>
            )}
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={sending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!canSend}>
              {sending ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <SendIcon aria-hidden />
              )}
              Kirim email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
