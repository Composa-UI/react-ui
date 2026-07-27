import { expect, test, type Page } from "@playwright/test";

// #499 — The Type Settings dialog must open fully clear to the LEFT of the
// right-docked inspector, never over it. This exercises the REAL app-like
// context: a full-width `data-composa-overlay-boundary` workspace with a fluid
// canvas region and the element PropertyPanel docked hard-right at its native
// width — mirroring ComposaApp's `.composa-workspace` + `.composa-inspector`.
//
// The prior fix passed an ISOLATED unit test that only asserted the offset
// number (208), never measuring geometry. That offset was tuned to a specific
// trigger inset AND a 240px panel width, so it silently overlaps the inspector
// the moment either drifts. The `wide` scenario below reproduces that overlap;
// the fix anchors the dialog's side axis to the inspector surface's LEFT edge so
// the ~8px gutter holds regardless of trigger position or panel width.

// Approved gutter between the dialog's right edge and the inspector's left edge.
const GUTTER = 8;
// Sub-pixel tolerance for boundingBox() rounding.
const EPSILON = 1.5;

async function openTypeSettings(page: Page) {
  const inspector = page.locator(".composa-inspector");
  await expect(inspector).toBeVisible();
  const inspectorBox = await inspector.boundingBox();
  expect(inspectorBox).not.toBeNull();

  const trigger = page.getByRole("button", { name: "Type settings" });
  await expect(trigger).toBeVisible();
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox).not.toBeNull();
  // Sanity: the trigger really is a far-right action button inside the inspector.
  expect(triggerBox!.x).toBeGreaterThan(inspectorBox!.x + inspectorBox!.width / 2);

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Type settings" });
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();

  const dialogRight = dialogBox!.x + dialogBox!.width;
  const inspectorLeft = inspectorBox!.x;
  return { dialogRight, inspectorLeft, side: await dialog.getAttribute("data-side") };
}

function assertClear(label: string, dialogRight: number, inspectorLeft: number, side: string | null) {
  const overlap = dialogRight - inspectorLeft;
  // eslint-disable-next-line no-console
  console.log(
    `[#499 ${label}] inspector.left=${inspectorLeft.toFixed(1)} dialog.right=${dialogRight.toFixed(1)} ` +
      `overlap=${overlap.toFixed(1)}px gap=${(-overlap).toFixed(1)}px side=${side}`,
  );
  // The dialog's right edge must sit at or left of the inspector's left edge.
  expect(dialogRight, `dialog overlaps inspector by ${overlap.toFixed(1)}px`).toBeLessThanOrEqual(inspectorLeft + EPSILON);
  // And land on (close to) the approved gutter, not miles away.
  expect(inspectorLeft - dialogRight).toBeLessThanOrEqual(GUTTER + 4);
}

test("Type Settings clears the inspector at its real 240px width", async ({ page }) => {
  await page.goto("/?view=issue-499-type-anchor");
  const { dialogRight, inspectorLeft, side } = await openTypeSettings(page);
  assertClear("240px", dialogRight, inspectorLeft, side);
});

test("Type Settings clears the inspector regardless of panel width (robust anchor)", async ({ page }) => {
  // A wider inspector than the 240px the prior offset was tuned to. On
  // origin/main the trigger-relative offset leaves the dialog well inside the
  // panel (overlap); the surface-edge anchor keeps the gutter.
  await page.goto("/?view=issue-499-type-anchor&w=320");
  const { dialogRight, inspectorLeft, side } = await openTypeSettings(page);
  assertClear("320px", dialogRight, inspectorLeft, side);
});
