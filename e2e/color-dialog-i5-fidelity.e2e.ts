import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const box = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
};

const openFixture = async (page: Page, query: string) => {
  await page.goto(`/?view=issue-206-color-dialog&${query}`);
  const dialog = page.getByRole("dialog", { name: "Color" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("width", "240px");

  const dialogBox = await box(dialog);
  const inspectorBox = await box(page.locator("[data-composa-inspector-surface]"));
  expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(inspectorBox.x);
  await expect(dialog.locator("[data-composa-color-dialog-header]")).toHaveCSS("height", "40px");
  await expect(dialog.locator("[data-composa-color-dialog-toolbar]")).toHaveCSS("height", "41px");
  return { dialog, dialogBox };
};

test("Solid matches the 240 x 489 reference geometry", async ({ page }, testInfo: TestInfo) => {
  const { dialog, dialogBox } = await openFixture(page, "mode=solid");
  expect(dialogBox.height).toBeCloseTo(489, 0);

  const picker = dialog.locator("[data-composa-color-picker]");
  const pickerBox = await box(picker);
  expect(pickerBox.width).toBeCloseTo(208, 0);
  expect(pickerBox.height).toBeCloseTo(208, 0);
  expect(pickerBox.x - dialogBox.x).toBeCloseTo(16, 0);
  await expect(dialog.locator("[data-composa-solid-slider-row]")).toHaveCSS("height", "60px");
  await expect(dialog.locator("[data-composa-solid-format-row]")).toHaveCSS("height", "40px");
  await expect(dialog.locator("[data-composa-solid-swatches]")).toHaveCSS("height", "76px");

  await page.screenshot({ path: testInfo.outputPath("solid-240px.png") });
});

test("Gradient keeps the reference type, ramp, stop rows, and trailing actions", async ({ page }, testInfo: TestInfo) => {
  const { dialog, dialogBox } = await openFixture(page, "mode=gradient");
  expect(dialogBox.height).toBeCloseTo(297, 0);

  await expect(dialog.locator("[data-composa-gradient-type-row]")).toHaveCSS("height", "48px");
  await expect(dialog.getByRole("button", { name: "Gradient type" })).toHaveCSS("width", "96px");
  const rampBox = await box(dialog.locator("[data-composa-gradient-preview]"));
  expect(rampBox.width).toBeCloseTo(208, 0);
  expect(rampBox.height).toBeCloseTo(32, 0);
  expect(rampBox.x - dialogBox.x).toBeCloseTo(16, 0);

  const rows = dialog.locator("[data-composa-gradient-stop-row]");
  await expect(rows).toHaveCount(2);
  for (const row of await rows.all()) await expect(row).toHaveCSS("height", "32px");
  const flipBox = await box(dialog.getByRole("button", { name: "Flip gradient" }));
  const rotateBox = await box(dialog.getByRole("button", { name: "Rotate gradient" }));
  expect(flipBox.x - dialogBox.x).toBeCloseTo(180, 0);
  expect(rotateBox.x - dialogBox.x).toBeCloseTo(208, 0);
  await expect(dialog.getByText("Linear gradient", { exact: true })).toHaveCount(0);

  await dialog.getByRole("button", { name: "Flip gradient" }).click();
  await expect(page.getByRole("status")).toHaveText("flip gradient");
  await dialog.getByRole("button", { name: "Rotate gradient" }).click();
  await expect(page.getByRole("status")).toHaveText("rotate gradient");

  await page.screenshot({ path: testInfo.outputPath("gradient-240px.png") });
});

test("Bound Image matches the 240 x 577 reference and exposes every host action", async ({ page }, testInfo: TestInfo) => {
  const { dialog, dialogBox } = await openFixture(page, "mode=image&media=bound");
  expect(dialogBox.height).toBeCloseTo(577, 0);

  await expect(dialog.locator('[data-composa-media-fit-row="image"]')).toHaveCSS("height", "48px");
  await expect(dialog.getByRole("button", { name: "Image fit" })).toHaveCSS("width", "96px");
  const previewBox = await box(dialog.locator('[data-composa-media-fill-preview="image"]'));
  expect(previewBox.width).toBeCloseTo(208, 0);
  expect(previewBox.height).toBeCloseTo(208, 0);
  expect(previewBox.x - dialogBox.x).toBeCloseTo(16, 0);
  await expect(dialog.getByRole("button", { name: "Replace image" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Edit crop" })).toBeVisible();
  const rotate = dialog.getByRole("button", { name: "Rotate image 90 degrees" });
  await expect(rotate).toBeVisible();
  expect((await box(rotate)).x - dialogBox.x).toBeCloseTo(208, 0);

  const rows = dialog.locator("[data-composa-image-adjustment-row]");
  await expect(rows).toHaveCount(7);
  for (const row of await rows.all()) await expect(row).toHaveCSS("height", "32px");
  const firstRowBox = await box(rows.first());
  const firstSliderBox = await box(dialog.getByRole("slider", { name: "Exposure value" }));
  expect(firstRowBox.x - dialogBox.x).toBeCloseTo(0, 0);
  expect(firstSliderBox.x - dialogBox.x).toBeCloseTo(104, 0);
  expect(firstSliderBox.width).toBeCloseTo(120, 0);

  await page.screenshot({ path: testInfo.outputPath("image-bound-240px.png") });
  await dialog.getByRole("button", { name: "Replace image" }).click();
  await expect(page.getByRole("status")).toHaveText("replace image");
  await rotate.click();
  await expect(page.getByRole("status")).toHaveText("rotate image");
  await dialog.getByRole("button", { name: "Edit crop" }).click();
  await expect(page.getByRole("status")).toHaveText("edit crop");
  await expect(dialog).toHaveCount(0);
});

test("Empty Image keeps the exact chooser and preview geometry without fake adjustments", async ({ page }, testInfo: TestInfo) => {
  const { dialog, dialogBox } = await openFixture(page, "mode=image&media=empty");
  expect(dialogBox.height).toBeCloseTo(337, 0);
  await expect(dialog.getByRole("button", { name: "Select image" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Edit crop" })).toHaveCount(0);
  await expect(dialog.locator("[data-composa-image-adjustment-row]")).toHaveCount(0);
  const preview = dialog.locator('[data-composa-media-fill-preview="image"]');
  await expect(preview).toHaveAttribute("data-state", "empty");
  await expect(preview).toHaveCSS("width", "208px");
  await expect(preview).toHaveCSS("height", "208px");

  await dialog.getByRole("button", { name: "Select image" }).click();
  await expect(page.getByRole("status")).toHaveText("select image");

  await page.screenshot({ path: testInfo.outputPath("image-empty-240px.png") });
});

test("keyframed gradient stops preserve the 48px field, #207 action, and 4px separation", async ({ page }) => {
  const { dialog } = await openFixture(page, "mode=gradient&keyframes=1");
  const row = dialog.locator('[data-composa-gradient-stop-row="1"]');
  const field = row.locator("[data-composa-numeric-input]");
  const action = row.getByRole("button", { name: "Stop 1 position keyframe" });
  const fieldBox = await box(field);
  const actionBox = await box(action);
  expect(fieldBox.width).toBeCloseTo(48, 0);
  expect(actionBox.width).toBeCloseTo(24, 0);
  expect(actionBox.height).toBeCloseTo(24, 0);
  expect(actionBox.x - (fieldBox.x + fieldBox.width)).toBeCloseTo(4, 0);
  await expect(row.getByRole("spinbutton", { name: "Stop 1 position" })).toBeVisible();
  await expect(action).toHaveAttribute("aria-pressed", "false");
  await action.click();
  await expect(action).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("stop position keyframe");
});

test("keyframed image adjustments preserve the 88px slider and deliberate Figma 8px action gap", async ({ page }) => {
  const { dialog } = await openFixture(page, "mode=image&media=bound&keyframes=1");
  const row = dialog.locator('[data-composa-image-adjustment-row="exposure"]');
  const slider = row.getByRole("slider", { name: "Exposure value" });
  const action = row.getByRole("button", { name: "Exposure value keyframe" });
  const sliderBox = await box(slider);
  const actionBox = await box(action);
  expect(sliderBox.width).toBeCloseTo(88, 0);
  expect(actionBox.width).toBeCloseTo(24, 0);
  expect(actionBox.height).toBeCloseTo(24, 0);
  expect(actionBox.x - (sliderBox.x + sliderBox.width)).toBeCloseTo(8, 0);
  await expect(action).toHaveAttribute("aria-pressed", "false");
  await action.click();
  await expect(action).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("exposure keyframe");
});

// Owner ask: "for rotate icon inside fill dialog, let's use this instead:
// github.com/samuelalake/lucide/pull/1". Both rotate ACTIONS take it; the arrow
// alone is indistinguishable from lucide's RotateCw in a screenshot, so assert
// the class in a real browser, at the size the surrounding dialog icons use.
for (const [mode, label] of [
  ["mode=gradient", "Rotate gradient"],
  ["mode=image&media=bound", "Rotate image 90 degrees"],
] as const) {
  test(`${label} paints rotate-cw-diamond at 14px / strokeWidth 1.5`, async ({ page }, testInfo: TestInfo) => {
    const { dialog } = await openFixture(page, mode);
    const glyph = dialog.getByRole("button", { name: label }).locator("svg");
    await expect(glyph).toHaveClass(/lucide-proposed-rotate-cw-diamond/);
    await expect(glyph).toHaveAttribute("width", "14");
    await expect(glyph).toHaveAttribute("height", "14");
    await expect(glyph).toHaveAttribute("stroke-width", "1.5");
    // Nothing in the dialog still wears the stock clockwise-rotate glyph.
    await expect(dialog.locator("svg.lucide-rotate-cw")).toHaveCount(0);
    await glyph.screenshot({ path: testInfo.outputPath("rotate-cw-diamond.png") });
  });
}
