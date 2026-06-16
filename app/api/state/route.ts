// Aggregate snapshot for initial load + list/settings polling.
import { listItems, listPlanSummaries } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    items: listItems(),
    plans: listPlanSummaries(),
  });
}
