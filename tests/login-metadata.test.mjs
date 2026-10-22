import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loginProxyHeaders } from "../lib/login-proxy.js";
import { captureFirstReferral, collectLoginMetadata } from "../lib/login-metadata.js";
const source = (await readFile(new URL("../app/api/user-auth/[...path]/route.js", import.meta.url), "utf8"))
  .replace("@/lib/login-proxy", new URL("../lib/login-proxy.js", import.meta.url).href)
  .replace("@/utils/api", new URL("../utils/api.js", import.meta.url).href);
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const context = path => ({ params: Promise.resolve({ path: path.split("/") }) });
test("geo is signed only on Vercel; caller coordinates and arbitrary forwarded headers are omitted", t => {
  const previous = { VERCEL: process.env.VERCEL, LOGIN_METADATA_PROXY_SECRET: process.env.LOGIN_METADATA_PROXY_SECRET };
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  process.env.LOGIN_METADATA_PROXY_SECRET = "s".repeat(32);
  process.env.VERCEL = "0";
  const headers = new Headers({ "x-vercel-ip-country": "IN", "x-forwarded-for": "8.8.8.8", "x-vercel-ip-city": "New%20Delhi", "x-vercel-ip-latitude": "12" });
  assert.deepEqual(loginProxyHeaders(headers, "/user/login", {}), {});
  process.env.VERCEL = "1";
  const signed = loginProxyHeaders(headers, "/user/login", {});
  const data = JSON.parse(Buffer.from(signed["x-login-context"], "base64url"));
  assert.equal(data.city, "New Delhi");
  assert.equal(data.ip, null);
  assert.equal(data.latitude, undefined);
  assert.notEqual(signed["x-login-signature"], loginProxyHeaders(headers, "/user/google", {})["x-login-signature"]);
});
test("password, Google and verification use restricted proxy; private headers are not relayed", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => { calls.push({ url, options }); return Response.json({ token: "session" }); });
  for (const path of ["user/login", "user/google", "verify-email"]) {
    const req = new Request(`https://seyprompt.com/api/user-auth/${path}`, { method: "POST", headers: { "content-type": "application/json", cookie: "private=value", "x-login-context": "forged", authorization: "Bearer unrelated", "user-agent": "browser" }, body: JSON.stringify({ email: "user@example.org" }) });
    const res = await POST(req, context(path));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
  }
  assert.equal(calls.length, 3);
  assert.equal(calls[0].options.headers.cookie, undefined);
  assert.equal(calls[0].options.headers.authorization, undefined);
  assert.notEqual(calls[0].options.headers["x-login-context"], "forged");
  assert.equal((await POST(new Request("https://seyprompt.com", { method: "POST", body: "{}" }), context("user/profile"))).status, 404);
  assert.equal((await POST(new Request("https://seyprompt.com", { method: "POST", body: "invalid" }), context("user/login"))).status, 400);
});
test("tab-session referral strips paths; storage errors and all GPS states preserve ordinary metadata", t => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const stored = new Map();
  let gpsCalls = 0;
  globalThis.window = { location: { origin: "https://seyprompt.com", search: "?utm_source=newsletter&utm_campaign=launch&email=secret" }, sessionStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) } };
  globalThis.document = { referrer: "https://example.org/private?email=secret#token" };
  t.after(() => { delete globalThis.window; delete globalThis.document; if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else delete globalThis.navigator; });
  assert.deepEqual(captureFirstReferral(), { source: "https://example.org", utm_source: "newsletter", utm_campaign: "launch" });
  window.location.search = "?utm_source=later";
  assert.equal(captureFirstReferral().utm_source, "newsletter");
  for (const outcome of ["allowed", "denied", "unavailable", "timeout", "unsupported"]) {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: "en-IN", geolocation: outcome === "unsupported" ? undefined : { getCurrentPosition: () => { gpsCalls++; throw new Error(outcome); } } } });
    assert.equal(collectLoginMetadata().language, "en-IN");
    assert.equal(collectLoginMetadata().latitude, undefined);
  }
  assert.equal(gpsCalls, 0);
  window.sessionStorage.getItem = () => { throw new Error("Storage denied"); };
  assert.equal(collectLoginMetadata().referral, null);
});
