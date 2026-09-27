import test from "node:test";
import assert from "node:assert/strict";
import { ownsExperienceStage } from "./experience-shell.ts";

test("the root export owns the stage with or without a trailing slash", () => {
  for (const path of ["/", "/index.html", "/index.html/", "/uk", "/uk/", "/uk/index.html"]) {
    assert.equal(ownsExperienceStage(path), true, path);
  }
});

test("other pages retain their own shell, including nested index files", () => {
  for (const path of [null, "/oracle", "/oracle/", "/journal/", "/studies/tarot/", "/academy/index.html", "/index.html/other"]) {
    assert.equal(ownsExperienceStage(path), false, String(path));
  }
});
