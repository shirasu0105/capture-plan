// /api/plans — list summaries & create a plan (server computes combinations).
import { createPlan, listPlanSummaries } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(listPlanSummaries());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    note?: string;
    factorOrder?: string[];
    levels?: Record<string, Array<string | number>>;
  } | null;
  if (!body) return Response.json({ error: "invalid body" }, { status: 400 });
  const plan = createPlan({
    name: String(body.name ?? ""),
    note: String(body.note ?? ""),
    factorOrder: Array.isArray(body.factorOrder) ? body.factorOrder : [],
    levels: body.levels && typeof body.levels === "object" ? body.levels : {},
  });
  return Response.json(plan, { status: 201 });
}
