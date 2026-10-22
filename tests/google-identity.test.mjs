import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../lib/google-identity.js", import.meta.url), "utf8");
let serial = 0;
const fresh = () => import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${serial++}`).toString("base64")}`);
function browser(t) {
  const previous = { window: globalThis.window, document: globalThis.document };
  t.after(() => Object.assign(globalThis, previous));
  let element;
  let appends = 0;
  globalThis.window = {};
  globalThis.document = {
    querySelector: () => element || null,
    createElement: () => {
      const events = new Map();
      return { addEventListener: (type, fn) => events.set(type, fn), removeEventListener: type => events.delete(type),
        remove: () => { element = undefined; }, fire: type => events.get(type)?.() };
    },
    head: { appendChild: value => { appends++; element = value; } },
  };
  return { script: () => element, count: () => appends };
}
test("concurrent mounts share one SDK request; loaded SDK is reused", async t => {
  const b = browser(t);
  const { loadGoogleIdentity } = await fresh();
  const first = loadGoogleIdentity();
  const second = loadGoogleIdentity();
  assert.equal(first, second);
  assert.equal(b.count(), 1);
  const api = {};
  window.google = { accounts: { id: api } };
  b.script().fire("load");
  assert.equal(await first, api);
  assert.equal(await loadGoogleIdentity(), api);
  assert.equal(b.count(), 1);
});
test("failed SDK load clears its request and allows an actual retry", async t => {
  const b = browser(t);
  const { loadGoogleIdentity } = await fresh();
  const failed = loadGoogleIdentity();
  b.script().fire("error");
  await assert.rejects(failed, /Unable to load/);
  const retry = loadGoogleIdentity();
  assert.equal(b.count(), 2);
  window.google = { accounts: { id: {} } };
  b.script().fire("load");
  await retry;
});
test("Strict Mode replay and login/register navigation initialize GIS only once and dispatch to current form", async () => {
  const { renderGoogleIdentityButton } = await fresh();
  let initialized = 0;
  let callback;
  const renderOptions = [];
  const api = { initialize: options => { initialized++; callback = options.callback; }, renderButton: (_container, options) => renderOptions.push(options) };
  const container = { offsetWidth: 900, replaceChildren() {} };
  const results = [];
  const options = { container, clientId: "client", text: "signin_with", onCredential: token => results.push(`old:${token}`), onError: error => results.push(error.message) };
  const dispose = renderGoogleIdentityButton(api, options);
  dispose();
  const disposeNew = renderGoogleIdentityButton(api, { ...options, text: "signup_with", onCredential: token => results.push(`new:${token}`) });
  assert.equal(initialized, 1);
  assert.equal(renderOptions.length, 2);
  assert.equal(renderOptions[0].width, 400);
  assert.equal(renderOptions[1].text, "signup_with");
  callback({ credential: "test-token" });
  callback({});
  assert.deepEqual(results, ["new:test-token", "Google did not return a credential."]);
  disposeNew();
  callback({ credential: "after-unmount" });
  assert.equal(results.length, 2);
});
