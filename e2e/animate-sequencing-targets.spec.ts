import { expect, test } from "@playwright/test";

// The combined card no longer wraps its action rows in a bordered, `overflow-hidden`
// container. That box used to CLIP the hover-revealed reorder drag handle, which is
// positioned in the panel's own left padding at `-left-[16px]`. With the container
// (and its clipping) gone, the handle is reachable again — this is the sequencing
// entry point, so it must be both visible AND hit-testable at its own center.
test("combined-card reorder drag handle is revealed and NOT clipped", async ({ page }) => {
  await page.goto("/?view=combined-card");

  const fixture = page.getByRole("heading", { name: "Light · combined card" })
    .locator("xpath=ancestor::section[1]");

  // First action row of the first (delayed) combined pair.
  const row = fixture.locator('[data-animation-card-id="p1"]');
  await expect(row).toBeVisible();

  // The two Logo actions are grouped by a connector line (the container was removed).
  await expect(fixture.locator('[data-combined-connector]').first()).toBeVisible();

  const handle = row.getByRole("button", { name: "Drag Logo animation" });
  // Hidden at rest, revealed on hover of the row group.
  await expect(handle).toBeHidden();
  await row.hover();
  await expect(handle).toBeVisible();

  const box = await handle.boundingBox();
  if (!box) throw new Error("drag handle had no measurable box");

  // The handle sits in the negative left offset but must stay inside the viewport
  // (no longer clipped away by an ancestor `overflow-hidden`).
  expect(box.x).toBeGreaterThanOrEqual(0);

  // Decisive un-clipped check: hit-test the handle's own center. An `overflow-hidden`
  // ancestor would clip both paint AND hit-testing, so this would resolve to something
  // else. It must resolve to the handle itself.
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const hitsHandle = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return !!el && !!el.closest('[aria-label="Drag Logo animation"]');
  }, center);
  expect(hitsHandle).toBe(true);
});
