import { expect, test } from "@playwright/test";

test("easing segments select and double-click quick-switch presets", async ({ page }) => {
  await page.goto("/?view=issue-72-easing-segments");

  const segment = page.locator('[data-easing-segment="light-motion:opacity:linear"]');
  const lane = page.locator('[data-timeline-property-lane="light-motion:opacity"]');
  await expect(lane.locator("[data-keyframe-id]")).toHaveCount(6);
  await expect(segment).toHaveAttribute("data-easing-preset", "linear");
  await segment.click();
  await expect(segment).toHaveAttribute("aria-pressed", "true");

  await segment.dblclick();
  const menu = page.getByLabel("Opacity easing presets");
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitemradio", { name: "Ease out" }).click();
  await expect(segment).toHaveAttribute("data-easing-preset", "ease-out");
  await expect(lane.locator("[data-keyframe-id]")).toHaveCount(6);
  await expect(menu).toBeHidden();

  await segment.focus();
  await segment.press("Shift+Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});
