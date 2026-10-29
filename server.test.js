// @vitest-environment node
import { afterAll, beforeAll, expect, test } from "vitest";
import app from "./server.js";

let server;
let baseUrl;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("serves the editor for ordinary GET requests", async () => {
  const response = await fetch(baseUrl);
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('<div id="root"></div>');
});

test("accepts form launches and safely preserves code, header and files", async () => {
  const data = {
    code: "OUTPUT('</script><script>alert(1)</script>');",
    header: "value := 1;\n",
    files: "~scope::file.csv,~scope::other",
  };
  const response = await fetch(baseUrl, { method: "POST", body: new URLSearchParams(data) });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const html = await response.text();
  const json = html.match(/<script id="editor-initial-data" type="application\/json">([^<]*)<\/script>/)?.[1];
  expect(JSON.parse(json)).toEqual(data);
  expect(html).not.toContain("<script>alert(1)</script>");
});

test("rejects repeated form fields instead of passing arrays to the editor", async () => {
  const response = await fetch(baseUrl, {
    method: "POST",
    body: new URLSearchParams([["code", "one"], ["code", "two"]]),
  });
  expect(response.status).toBe(400);
});
