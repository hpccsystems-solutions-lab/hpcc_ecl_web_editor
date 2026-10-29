import { afterEach, expect, test, vi } from "vitest";
import Comms from "./comms";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns successful API responses", async () => {
  const body = { status: "submitted", workunitId: "W20261029-100000" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }));
  await expect(Comms.postAPIData("execute_ecl", { code: "OUTPUT('test');" }))
    .resolves.toEqual(body);
});

test("surfaces API errors even when the response has no status field", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ message: "Unauthorized" }),
  }));
  await expect(Comms.postAPIData("execute_ecl")).rejects.toThrow("Unauthorized");
});

test("reports the HTTP status when a proxy returns a non-JSON error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    status: 502,
    text: async () => "Bad gateway",
  }));
  await expect(Comms.postAPIData("execute_ecl")).rejects.toThrow("HTTP 502");
});
