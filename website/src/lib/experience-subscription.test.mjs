import test from "node:test";
import assert from "node:assert/strict";
import { experienceEntryHash, shouldRefreshSubscription, subscriptionRequestId, subscriptionState } from "./experience-subscription.ts";

const paid = { tier: "premium", status: "active", is_paid: true };

test("only a same-origin request from the actual iframe is accepted", () => {
  const frame = {}, other = {}, origin = "https://oliviaarcana.com";
  const message = { origin, source: frame, data: { type: "olivia:subscription:request", requestId: "reading-1" } };
  assert.equal(subscriptionRequestId(message, origin, frame), "reading-1");
  assert.equal(subscriptionRequestId({ ...message, origin: "https://other.example" }, origin, frame), null);
  assert.equal(subscriptionRequestId({ ...message, source: other }, origin, frame), null);
  assert.equal(subscriptionRequestId({ ...message, source: null }, origin, null), null);
  for (const data of [null, [], "paid", {}, { type: "olivia:subscription:request", requestId: " " }, { type: "olivia:subscription:request", requestId: "x".repeat(129) }]) {
    assert.equal(subscriptionRequestId({ ...message, data }, origin, frame), null);
  }
});

test("loading, missing, malformed and failed data never unlock paid spreads", () => {
  assert.deepEqual(subscriptionState(paid, true, null), { status: "loading", paid: false, tier: "free" });
  for (const data of [null, [], {}, { ...paid, tier: "owner" }, { ...paid, is_paid: "true" }, { ...paid, status: "unknown" }]) {
    assert.deepEqual(subscriptionState(data, false, null), { status: "unavailable", paid: false, tier: "free" });
  }
  assert.deepEqual(subscriptionState(paid, false, "Offline"), { status: "unavailable", paid: false, tier: "free" });
});

test("server entitlement takes precedence over the stored tier and preserves server grace policy", () => {
  assert.deepEqual(subscriptionState(paid, false, null), { status: "ready", paid: true, tier: "premium" });
  assert.deepEqual(subscriptionState({ ...paid, is_paid: false }, false, null), { status: "ready", paid: false, tier: "free" });
  assert.deepEqual(subscriptionState({ ...paid, tier: "free" }, false, null), { status: "ready", paid: false, tier: "free" });
  assert.deepEqual(subscriptionState({ ...paid, status: "past_due" }, false, null), { status: "ready", paid: true, tier: "premium" });
});

test("a new membership check refreshes once while the initial check and in-flight retries are shared", () => {
  assert.equal(shouldRefreshSubscription(null, "initial", true), false);
  assert.equal(shouldRefreshSubscription(null, "initial", false), false);
  assert.equal(shouldRefreshSubscription("initial", "initial", false), false);
  assert.equal(shouldRefreshSubscription("initial", "retry", false), true);
  assert.equal(shouldRefreshSubscription("retry", "retry", true), false);
  assert.equal(shouldRefreshSubscription("retry", "another-retry", true), false);
  assert.equal(shouldRefreshSubscription("another-retry", "after-completion", false), true);
});

test("only named reading, spread, journal and today destinations are forwarded into the embedded experience", () => {
  assert.equal(experienceEntryHash("?experience=spreads"), "#spreads");
  assert.equal(experienceEntryHash("?other=1&experience=spreads"), "#spreads");
  assert.equal(experienceEntryHash("?experience=journal"), "#journal");
  assert.equal(experienceEntryHash("?experience=question"), "#question");
  assert.equal(experienceEntryHash("?experience=today"), "#today");
  for (const value of ["", "?experience=reading", "?experience=https://other.example", "?experience=spreads%23elsewhere", "?experience=journal%23elsewhere", "?paid=true", "?experience=javascript:alert(1)"]) {
    assert.equal(experienceEntryHash(value), "");
  }
});
