"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { errorMessage, type PaginationOutput } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  CUSTOMER_TYPES,
  userApi,
  type CustomerType,
  type UserOutput,
  type UserStatsOutput,
} from "@/lib/user-api";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { UserFormDialog } from "./user-form-dialog";

const PAGE_SIZE = 10;

// One state value per list: every list shows loading, empty and error states.
type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: UserOutput[]; pagination: PaginationOutput }
  | { kind: "error"; message: string };

export function UsersView() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<CustomerType | "">("");
  const [stats, setStats] = React.useState<UserStatsOutput | null>(null);
  const [state, setState] = React.useState<ListState>({ kind: "loading" });

  const [editing, setEditing] = React.useState<UserOutput | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<UserOutput | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // A new search starts from page 1.
  React.useEffect(() => setPage(1), [debouncedSearch, type]);

  // Abort the previous request so a slow old response can't overwrite a newer one.
  const abortRef = React.useRef<AbortController | null>(null);
  const fetchList = React.useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((prev) => (prev.kind === "ok" ? prev : { kind: "loading" }));
    try {
      const out = await userApi.list(
        { page, page_size: PAGE_SIZE, search: debouncedSearch, type },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      userApi.stats(ctrl.signal).then(setStats, () => {});
      setState({ kind: "ok", items: out.items, pagination: out.pagination });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState({ kind: "error", message: errorMessage(err, "Could not load users.") });
    }
  }, [page, debouncedSearch, type]);

  React.useEffect(() => {
    void fetchList();
    return () => abortRef.current?.abort();
  }, [fetchList]);

  function openForm(user: UserOutput | null) {
    setEditing(user);
    setFormOpen(true);
  }

  function openDelete(user: UserOutput) {
    setDeleting(user);
    setDeleteOpen(true);
  }

  async function doDelete() {
    if (!deleting) return;
    try {
      const message = await userApi.remove(deleting.id);
      toast.success(message);
      // Step back a page if we just deleted the last row on it.
      if (state.kind === "ok" && state.items.length === 1 && page > 1) setPage(page - 1);
      else void fetchList();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the user."));
    }
  }

  const pagination = state.kind === "ok" ? state.pagination : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Customer dan tahap funnel-nya: Guest → Lead → Prospect → Customer → Repeat / Advocate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <FunnelTile label="Guest" hint="Pengunjung tanpa kontak" value={stats?.guests} />
        {CUSTOMER_TYPES.map((t) => (
          <FunnelTile
            key={t.value}
            label={t.label}
            hint={t.hint}
            value={stats ? (stats.types[t.value] ?? 0) : undefined}
            active={type === t.value}
            onClick={() => setType(type === t.value ? "" : t.value)}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>User list</CardTitle>
            <CardDescription>
              {pagination ? `${pagination.total_items} users found` : "Search by name or email"}
            </CardDescription>
          </div>
          <CardAction>
            <Button onClick={() => openForm(null)}>
              <PlusIcon aria-hidden />
              New user
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-sm">
              <Input
                startAdornment={<SearchIcon aria-hidden />}
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search users"
              />
            </div>
            <select
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as CustomerType | "")}
              aria-label="Filter by type"
            >
              <option value="">Semua tipe</option>
              {CUSTOMER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <UsersTable state={state} onEdit={openForm} onDelete={openDelete} />

          {pagination && pagination.total_pages > 1 ? (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeftIcon aria-hidden />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                >
                  Next
                  <ChevronRightIcon aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <UserFormDialog
        user={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => void fetchList()}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userName={deleting?.name ?? ""}
        onConfirm={doDelete}
      />
    </div>
  );
}

interface UsersTableProps {
  state: ListState;
  onEdit: (user: UserOutput) => void;
  onDelete: (user: UserOutput) => void;
}

function UsersTable({ state, onEdit, onDelete }: UsersTableProps) {
  if (state.kind === "loading") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-6 text-center text-sm text-destructive"
      >
        {state.message}
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <UsersIcon className="size-6 text-primary" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">No users yet</p>
          <p className="text-sm text-muted-foreground">Click &ldquo;New user&rdquo; to add one.</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-px text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {state.items.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{u.email}</TableCell>
            <TableCell className="text-muted-foreground">{u.phone || "—"}</TableCell>
            <TableCell>
              <TypeBadge type={u.type} />
              {u.paid_orders > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">{u.paid_orders}× bayar</span>
              )}
            </TableCell>
            <TableCell>
              {u.has_password ? (
                <span className="text-xs font-medium text-success">Sudah diatur</span>
              ) : (
                <span className="text-xs text-muted-foreground">Belum</span>
              )}
            </TableCell>
            <TableCell>
              <span
                className={
                  u.status === "draft"
                    ? "rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
                    : "rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
                }
              >
                {u.status}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${u.name}`}
                  onClick={() => onEdit(u)}
                >
                  <PencilIcon aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${u.name}`}
                  onClick={() => onDelete(u)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const TYPE_CLASS: Record<CustomerType, string> = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-warning/15 text-warning",
  customer: "bg-success/15 text-success",
  repeat_customer: "bg-primary/15 text-primary",
};

function TypeBadge({ type }: { type: CustomerType | "" }) {
  if (!type) return <span className="text-xs text-muted-foreground">—</span>;
  const label = CUSTOMER_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TYPE_CLASS[type])}>
      {label}
    </span>
  );
}

interface FunnelTileProps {
  label: string;
  hint: string;
  value?: number;
  active?: boolean;
  onClick?: () => void;
}

function FunnelTile({ label, hint, value, active, onClick }: FunnelTileProps) {
  const body = (
    <>
      <p className="text-xs font-medium">{label}</p>
      {value === undefined ? (
        <Skeleton className="my-1 h-7 w-10" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </>
  );
  const cls = cn(
    "rounded-xl border bg-card p-4 text-left",
    onClick && "transition-colors hover:border-primary",
    active && "border-primary ring-1 ring-primary",
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
