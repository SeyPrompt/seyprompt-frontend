import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pricingCountryHeaders } from "../lib/pricing-country.js";
import { apiUrl, API_BASE_URL } from "../utils/api.js";

const source = (await readFile(new URL("../app/api/regional/[...path]/route.js", import.meta.url), "utf8"))
  .replace("@/lib/pricing-country", new URL("../lib/pricing-country.js", import.meta.url).href)
  .replace("@/utils/api", new URL("../utils/api.js", import.meta.url).href);
const { GET, POST } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const context = (path) => ({ params: Promise.resolve({ path: path.split("/") }) });

test("country comes from the frontend edge and skips unknown country values", () => {
  const country = pricingCountryHeaders(new Headers({ "x-vercel-ip-country": " in ", "cf-ipcountry": "US" }));
  assert.equal(country["cf-ipcountry"], undefined);
  assert.equal(country["x-vercel-ip-country"], "IN");
  assert.equal(pricingCountryHeaders(new Headers({ "cf-ipcountry": "XX", "cloudfront-viewer-country": "IN" }))["x-vercel-ip-country"], "IN");
  assert.deepEqual(pricingCountryHeaders(new Headers({ "cf-ipcountry": "T1" })), {});
  assert.deepEqual(pricingCountryHeaders(new Headers()), {});
});

test("browser pricing requests use the regional proxy; server fetches use the API origin", () => {
  assert.equal(apiUrl("/api/public/prompts"), `${API_BASE_URL}/api/public/prompts`);
  globalThis.window = {};
  try {
    for (const path of ["public/prompts", "payments/checkout/prompt", "user/prompts/test-prompt"]) {
      assert.equal(apiUrl(`/api/${path}`), `/api/regional/${path}`);
    }
    assert.equal(apiUrl("/api/user/profile"), `${API_BASE_URL}/api/user/profile`);
  } finally {
    delete globalThis.window;
  }
});

test("prompt display and checkout forward the same India country without sharing cached prices", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json({ pricing: { currency: options.headers.get("x-vercel-ip-country") === "IN" ? "INR" : "USD", displayAmount: options.headers.get("x-vercel-ip-country") === "IN" ? 20 : 1 } });
  });
  const geo = { "x-vercel-ip-country": "IN", cookie: "private=value" };
  const display = await GET(new Request("https://seyprompt.com/api/regional/public/prompts/example?limit=2", { headers: geo }), context("public/prompts/example"));
  assert.equal((await display.json()).pricing.currency, "INR");
  assert.equal(display.headers.get("cache-control"), "private, no-store");
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal(calls[0].options.headers.has("cookie"), false);
  assert.match(calls[0].url, /\/api\/public\/prompts\/example\?limit=2$/);

  const checkout = await POST(new Request("https://seyprompt.com/api/regional/payments/checkout/prompt", {
    method: "POST", headers: { ...geo, authorization: "Bearer test", "content-type": "application/json" }, body: JSON.stringify({ promptId: "example" })
  }), context("payments/checkout/prompt"));
  assert.equal((await checkout.json()).pricing.displayAmount, 20);
  assert.equal(calls[1].options.headers.get("authorization"), "Bearer test");
  assert.deepEqual(JSON.parse(calls[1].options.body), { promptId: "example" });

  const international = await GET(new Request("https://seyprompt.com/api/regional/public/prompts/example", { headers: { "x-vercel-ip-country": "US" } }), context("public/prompts/example"));
  assert.equal((await international.json()).pricing.currency, "USD");
});

test("proxy preserves API errors and blocks unrelated routes", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Unavailable" }, { status: 422 }));
  const result = await POST(new Request("https://seyprompt.com/api/regional/payments/checkout", { method: "POST", body: "{}" }), context("payments/checkout"));
  assert.equal(result.status, 422);
  assert.equal((await result.json()).error, "Unavailable");
  for (const path of ["admin/prompts", "payments/razorpay/webhook", "public/prompts/../admin", "public/prompts/%2e%2e"]) {
    const response = await POST(new Request("https://seyprompt.com/api/regional/test", { method: "POST" }), context(path));
    assert.equal(response.status, 404);
  }
  assert.equal(fetch.mock.callCount(), 1);
});

test("server-rendered public prompts forward the incoming country", async (t) => {
  const apiSource = (await readFile(new URL("../lib/api.js", import.meta.url), "utf8"))
    .replace('import "server-only";', "")
    .replace('import { cache } from "react";', 'const cache = (fn) => fn;')
    .replace('import { headers } from "next/headers";', 'const headers = async () => new Headers({ "x-vercel-ip-country": "IN" });')
    .replace("@/lib/pricing-country", new URL("../lib/pricing-country.js", import.meta.url).href)
    .replace("@/utils/api", new URL("../utils/api.js", import.meta.url).href);
  const { fetchPromptBySlug } = await import(`data:text/javascript;base64,${Buffer.from(apiSource).toString("base64")}`);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.match(url, /\/api\/public\/prompts\/packaging-prompt$/);
    assert.equal(options.headers["x-vercel-ip-country"], "IN");
    assert.equal(options.cache, "no-store");
    return Response.json({ slug: "packaging-prompt", pricing: { currency: "INR", displayAmount: 20 } });
  });
  assert.equal((await fetchPromptBySlug("packaging-prompt")).pricing.displayAmount, 20);
});

test("localhost country override applies only in development and after edge headers", () => {
  const savedNodeEnv = process.env.NODE_ENV;
  const savedCountry = process.env.DEV_PRICING_COUNTRY;
  try {
    process.env.DEV_PRICING_COUNTRY = "IN";
    process.env.NODE_ENV = "development";
    assert.equal(pricingCountryHeaders(new Headers())["x-vercel-ip-country"], "IN");
    assert.equal(pricingCountryHeaders(new Headers({ "x-vercel-ip-country": "US" }))["x-vercel-ip-country"], "US");
    process.env.NODE_ENV = "production";
    assert.deepEqual(pricingCountryHeaders(new Headers()), {});
  } finally {
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
    if (savedCountry === undefined) delete process.env.DEV_PRICING_COUNTRY;
    else process.env.DEV_PRICING_COUNTRY = savedCountry;
  }
});

test("existing checkout resume is forwarded without a new checkout or cached response", async t => {
  const id = "507f1f77bcf86cd799439011";
  let seen;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    seen = { url, options };
    return Response.json({ razorpay: { orderId: "order_saved", amount: 500, currency: "USD" } });
  });
  const result = await POST(new Request(`https://seyprompt.com/api/regional/payments/checkout/${id}/resume`, {
    method: "POST", headers: { authorization: "Bearer test", "content-type": "application/json" }, body: "{}"
  }), context(`payments/checkout/${id}/resume`));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).razorpay.orderId, "order_saved");
  assert.ok(seen.url.endsWith(`/api/payments/checkout/${id}/resume`));
  assert.equal(seen.options.headers.get("authorization"), "Bearer test");
  assert.equal(seen.options.body, "{}");
  assert.equal(seen.options.cache, "no-store");
});
