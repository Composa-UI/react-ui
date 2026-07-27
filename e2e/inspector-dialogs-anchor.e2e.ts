import { expect, test, type Page } from "@playwright/test";

// The new inspector dialogs (Export, Font picker) must open fully clear to the
// LEFT of the right-docked inspector, never over it — the SAME robust anchor the
// Type Settings dialog uses (#499/#73): the dialog's side axis tracks the
// inspector SURFACE's left edge, so the ~8px gutter holds regardless of trigger
// position or panel width. Each scenario measures dialog.right vs inspector.left
// at the native 240px AND at a widened 320px panel — a trigger-relative magic
// offset would overlap the moment the panel width drifts.

// Approved gutter between the dialog's right edge and the inspector's left edge.
const GUTTER = 8;
// Sub-pixel tolerance for boundingBox() rounding.
const EPSILON = 1.5;

async function openDialog(page: Page, triggerName: string, dialogName: string) {
  const inspector = page.locator(".composa-inspector");
  await expect(inspector).toBeVisible();
  const inspectorBox = await inspector.boundingBox();
  expect(inspectorBox).not.toBeNull();

  const trigger = page.getByRole("button", { name: triggerName, exact: true });
  await expect(trigger).toBeVisible();
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox).not.toBeNull();
  // Sanity: the trigger really is a far-right action button inside the inspector.
  expect(triggerBox!.x).toBeGreaterThan(inspectorBox!.x + inspectorBox!.width / 2);

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: dialogName, exact: true });
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();

  return {
    dialogRight: dialogBox!.x + dialogBox!.width,
    inspectorLeft: inspectorBox!.x,
    side: await dialog.getAttribute("data-side"),
  };
}

function assertClear(label: string, dialogRight: number, inspectorLeft: number, side: string | null) {
  const overlap = dialogRight - inspectorLeft;
  // eslint-disable-next-line no-console
  console.log(
    `[${label}] inspector.left=${inspectorLeft.toFixed(1)} dialog.right=${dialogRight.toFixed(1)} ` +
      `overlap=${overlap.toFixed(1)}px gap=${(-overlap).toFixed(1)}px side=${side}`,
  );
  expect(dialogRight, `dialog overlaps inspector by ${overlap.toFixed(1)}px`).toBeLessThanOrEqual(inspectorLeft + EPSILON);
  expect(inspectorLeft - dialogRight).toBeLessThanOrEqual(GUTTER + 4);
}

const CASES = [
  { name: "Export", view: "export-dialog-anchor", trigger: "Export", dialog: "Export" },
  { name: "Font picker", view: "fontpicker-dialog-anchor", trigger: "Fonts", dialog: "Fonts" },
] as const;

for (const c of CASES) {
  test(`${c.name} dialog clears the inspector at its real 240px width`, async ({ page }) => {
    await page.goto(`/?view=${c.view}`);
    const { dialogRight, inspectorLeft, side } = await openDialog(page, c.trigger, c.dialog);
    assertClear(`${c.name} 240px`, dialogRight, inspectorLeft, side);
  });

  test(`${c.name} dialog clears the inspector regardless of panel width (robust anchor)`, async ({ page }) => {
    await page.goto(`/?view=${c.view}&w=320`);
    const { dialogRight, inspectorLeft, side } = await openDialog(page, c.trigger, c.dialog);
    assertClear(`${c.name} 320px`, dialogRight, inspectorLeft, side);
  });
}
