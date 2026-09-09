import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";
import { checkDatabaseConnection } from "@/server/services/health";

vi.mock("@/server/services/health", () => ({
  checkDatabaseConnection: vi.fn(),
}));

const mockedCheck = vi.mocked(checkDatabaseConnection);

describe("GET /api/health", () => {
  beforeEach(() => mockedCheck.mockReset());

  it("reports a healthy database without exposing configuration", async () => {
    mockedCheck.mockResolvedValue(true);
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "reachable" });
  });

  it("returns 503 when the database is unavailable", async () => {
    mockedCheck.mockResolvedValue(false);
    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "degraded",
      database: "unreachable",
    });
  });
});
