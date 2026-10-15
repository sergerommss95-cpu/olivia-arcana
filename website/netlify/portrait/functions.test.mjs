// website/netlify/portrait/functions.test.mjs
// The background function turns away anything that is not a queued job's id before it touches the store, a key or the network.
import test from "node:test";
import assert from "node:assert/strict";

const { default: background } = await import("../functions/portrait-background.mts");
const context = { deploy: { context: "deploy-preview" } };
const ask = (body) => new Request("https://oliviaarcana.com/.netlify/functions/portrait-background", { method: "POST", body });

test("a body that is not an object with a job id is ignored, never thrown on", async () => {
  for (const body of ["null", "", "not json", "5", "\"id\"", "[]", "{}", "{\"id\":7}", "{\"id\":\"../job\"}", "{\"id\":null}"]) {
    assert.equal(await background(ask(body), context), undefined, JSON.stringify(body));
  }
});
