import test from "node:test";
import assert from "node:assert/strict";
import { createCheckoutSession, getPaymentSessionToken, getSubscriptionStatus } from "./payments.ts";

function useBrowser(t, entries = []) {
  const values = new Map(entries);
  const storage = {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
  };
  for (const [name, value] of Object.entries({
    window: { location: { origin: "https://checkout.example" } },
    localStorage: storage,
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  return storage;
}

test("the legacy session keeps precedence when both session sources exist", t => {
  useBrowser(t, [
    ["sb-project-auth-token", JSON.stringify({ access_token: "supabase-session" })],
    ["olivia-token", "legacy-session"],
  ]);
  assert.equal(getPaymentSessionToken(), "legacy-session");
});

test("the current Supabase session is accepted without a legacy token", t => {
  useBrowser(t, [["sb-project-auth-token", JSON.stringify({ access_token: "current-session" })]]);
  assert.equal(getPaymentSessionToken(), "current-session");
});

test("the nested Supabase session is accepted without a legacy token", t => {
  useBrowser(t, [["sb-project-auth-token", JSON.stringify({ currentSession: { access_token: "nested-session" } })]]);
  assert.equal(getPaymentSessionToken(), "nested-session");
});

test("unrelated and malformed session entries do not hide a later valid session", t => {
  useBrowser(t, [
    ["unrelated-auth-token", JSON.stringify({ access_token: "unrelated" })],
    ["sb-project-preferences", JSON.stringify({ access_token: "preferences" })],
    ["sb-broken-auth-token", "{"],
    ["sb-null-auth-token", "null"],
    ["sb-wrong-type-auth-token", JSON.stringify({ access_token: 123 })],
    ["sb-empty-auth-token", JSON.stringify({ access_token: "" })],
    ["sb-valid-auth-token", JSON.stringify({ access_token: "valid-session" })],
  ]);
  assert.equal(getPaymentSessionToken(), "valid-session");
});

test("empty or malformed storage is treated as signed out", t => {
  const storage = useBrowser(t, [["sb-project-auth-token", "{"]]);
  assert.equal(getPaymentSessionToken(), null);
  storage.getItem = () => null;
  assert.equal(getPaymentSessionToken(), null);
});

test("unavailable storage and server rendering are treated as signed out", t => {
  const storage = useBrowser(t);
  storage.getItem = () => { throw new Error("Storage is unavailable"); };
  assert.equal(getPaymentSessionToken(), null);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() { throw new Error("Storage access is denied"); },
  });
  assert.equal(getPaymentSessionToken(), null);
  delete globalThis.window;
  assert.equal(getPaymentSessionToken(), null);
});

for (const [label, entries, token] of [
  ["legacy", [["olivia-token", "legacy-session"]], "legacy-session"],
  ["current Supabase", [["sb-project-auth-token", JSON.stringify({ access_token: "current-session" })]], "current-session"],
  ["nested Supabase", [["sb-project-auth-token", JSON.stringify({ currentSession: { access_token: "nested-session" } })]], "nested-session"],
]) {
  test(`checkout forwards the ${label} session as authorization`, async t => {
    useBrowser(t, entries);
    const calls = [];
    t.mock.method(globalThis, "fetch", async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ checkout_url: "https://checkout.example/session" }));
    });
    assert.equal(await createCheckoutSession("insight_monthly"), "https://checkout.example/session");
    assert.equal(calls.length, 1);
    assert.equal(new URL(calls[0].url).pathname, "/api/payments/paddle/checkout");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.headers.Authorization, `Bearer ${token}`);
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      price_key: "insight_monthly",
      success_url: "https://checkout.example/checkout/success/",
      cancel_url: "https://checkout.example/checkout/cancel/",
    });
  });
}

test("a signed-out request never sends a fabricated authorization header", async t => {
  useBrowser(t);
  let headers;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    headers = options.headers;
    return new Response(JSON.stringify({ tier: "free" }));
  });
  assert.deepEqual(await getSubscriptionStatus(), { tier: "free" });
  assert.equal(Object.hasOwn(headers, "Authorization"), false);
});
