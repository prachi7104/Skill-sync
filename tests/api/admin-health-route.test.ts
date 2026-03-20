import { describe, expect, it } from "vitest";

function withDbTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`DB query timeout: ${label}`)), 10);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

describe("admin health route timeout safety", () => {
  it("fails fast on slow query timeout", async () => {
    const never = new Promise<number>(() => {
      // Intentionally unresolved to trigger timeout wrapper.
    });

    await expect(withDbTimeout(never, "onboarded_count")).rejects.toThrow(
      "DB query timeout: onboarded_count",
    );
  });

  it("returns result when query resolves within timeout", async () => {
    await expect(withDbTimeout(Promise.resolve(42), "quick")).resolves.toBe(42);
  });
});
