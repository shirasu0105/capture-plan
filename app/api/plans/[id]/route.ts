// /api/plans/[id] — full plan (with rows) & delete.
import { deletePlan, getPlan } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const plan = getPlan(id);
  if (!plan) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(plan);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = deletePlan(id);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
