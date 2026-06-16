// /api/plans/[id]/rows/[rowId] — update (status/count) & delete a row.
import { deleteRow, updateRow } from "@/lib/server/db";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: Status[] = ["todo", "done", "check"];

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; rowId: string }> },
) {
  const { id, rowId } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    status?: string;
    count?: number;
  } | null;
  if (!body) return Response.json({ error: "invalid body" }, { status: 400 });
  const patch: { status?: Status; count?: number } = {};
  if (body.status != null) {
    if (!STATUSES.includes(body.status as Status))
      return Response.json({ error: "invalid status" }, { status: 400 });
    patch.status = body.status as Status;
  }
  if (body.count != null) patch.count = Number(body.count);
  const ok = updateRow(id, rowId, patch);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; rowId: string }> },
) {
  const { id, rowId } = await ctx.params;
  const ok = deleteRow(id, rowId);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
