import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?view=issue-77-anchored-overlay");
});

test("modal overlays escape inspector clipping, collide safely, trap focus, and restore their trigger", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open dark anchored overlay" });
  const inspector = page.locator('[data-issue-77-clipped-inspector="dark"]');
  const triggerBox = await trigger.boundingBox();
  const inspectorBox = await inspector.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "dark anchored inspector overlay" });
  const input = page.getByRole("textbox", { name: "dark overlay name" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-composa-mode", "dark");
  await expect(dialog).toHaveAttribute("data-side", "left");
  await expect(input).toBeFocused();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(8);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(1112);
  expect(dialogBox!.x).toBeLessThan(triggerBox!.x);
  expect(dialogBox!.x).toBeLessThan(inspectorBox!.x);
  expect(await dialog.evaluate(element => {
    const inspector = document.querySelector('[data-issue-77-clipped-inspector="dark"]');
    return document.body.contains(element) && !inspector?.contains(element);
  })).toBe(true);

  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();

  await page.getByRole("button", { name: "Open dark overlay menu" }).click();
  await page.getByRole("menuitem", { name: "dark overlay menu choice" }).click();
  await expect(page.getByRole("status")).toContainText("dark overlay menu chosen");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a nested picker stays above its owner and only the top layer closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: "Open light anchored overlay" }).click();
  const owner = page.locator('[aria-label="light anchored inspector overlay"]');
  await page.getByRole("button", { name: "Open light nested picker" }).click();
  const nested = page.getByRole("dialog", { name: "light nested picker" });
  await expect(owner).toBeVisible();
  await expect(nested).toBeVisible();
  await page.getByRole("button", { name: "light nested choice" }).click();
  await expect(owner).toBeVisible();
  await expect(nested).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(nested).toHaveCount(0);
  await expect(owner).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(owner).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open light anchored overlay" })).toBeFocused();
});

test("outside interaction dismisses the modal owner and InspectorDialog remains non-modal", async ({ page }) => {
  const modalTrigger = page.getByRole("button", { name: "Open light anchored overlay" });
  await modalTrigger.click();
  const modal = page.getByRole("dialog", { name: "light anchored inspector overlay" });
  await expect(modal).toBeVisible();
  await page.locator("main").click({ position: { x: 4, y: 680 }, force: true });
  await expect(modal).toHaveCount(0);
  await expect(modalTrigger).toBeFocused();

  const compatibilityTrigger = page.getByRole("button", { name: "Open light inspector dialog compatibility" });
  await compatibilityTrigger.click();
  const compatibility = page.getByRole("dialog", { name: "light inspector dialog compatibility" });
  await expect(compatibility).toBeVisible();
  await expect(compatibility).toHaveAttribute("aria-modal", "false");
  await page.getByText("The inspector clips its own contents. The overlay portals outside it and flips or shifts inside the viewport.").first().click();
  await expect(compatibility).toHaveCount(0);
  await expect(compatibilityTrigger).toBeFocused();
});
