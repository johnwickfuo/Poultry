import { checkDatabaseConnection } from "@/server/services/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseIsReachable = await checkDatabaseConnection();
  const body = databaseIsReachable
    ? { status: "ok", database: "reachable" }
    : { status: "degraded", database: "unreachable" };

  return Response.json(body, {
    status: databaseIsReachable ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
