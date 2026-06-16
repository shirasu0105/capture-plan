// /api/plans/[id]/rows/reorder — move src row to dst row's position.
import { reorderRows } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    src?: string;
    dst?: string;
  } | null;
  if (!body?.src || !body?.dst)
    return Response.json({ error: "src and dst required" }, { status: 400 });
  const ok = reorderRows(id, body.src, body.dst);
  if (!ok) return Response.json({ error: "reorder failed" }, { status: 400 });
  return Response.json({ ok: true });
}
