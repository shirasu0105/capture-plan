// /api/items/[id] — update & delete a condition item.
import { deleteItem, updateItem } from "@/lib/server/db";
import { validateItem } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const v = validateItem(body);
  if (!v.ok) return Response.json({ error: v.err }, { status: 400 });
  const updated = updateItem(id, v.value);
  if (!updated) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = deleteItem(id);
  if (!ok)
    return Response.json(
      { error: "削除できません（固定項目または存在しません）" },
      { status: 400 },
    );
  return Response.json({ ok: true });
}
