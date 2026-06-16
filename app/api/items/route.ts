// /api/items — list & create condition items.
import { createItem, listItems } from "@/lib/server/db";
import { validateItem } from "@/lib/server/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(listItems());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const v = validateItem(body);
  if (!v.ok) return Response.json({ error: v.err }, { status: 400 });
  return Response.json(createItem(v.value), { status: 201 });
}
