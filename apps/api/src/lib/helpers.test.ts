import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeProtectedWhere, pickPublicFilters, stripFilterKeys } from "./helpers";

describe("mergeProtectedWhere", () => {
  it("keeps protected fields when user filters try to override them", () => {
    const where = mergeProtectedWhere(
      { status: "AVAILABLE" },
      { status: "DRAFT", isFeatured: true }
    );
    assert.equal(where.status, "AVAILABLE");
    assert.equal(where.isFeatured, true);
  });

  it("strips only protected keys", () => {
    const safe = stripFilterKeys(
      { status: "DRAFT", publish: false, title: "x" },
      ["status", "publish"]
    );
    assert.deepEqual(safe, { title: "x" });
  });

  it("pickPublicFilters allows only primitive allowlisted keys", () => {
    const safe = pickPublicFilters(
      {
        categoryId: "abc",
        status: "DRAFT",
        OR: [{ title: "x" }],
      },
      ["categoryId"]
    );
    assert.deepEqual(safe, { categoryId: "abc" });
  });
});
