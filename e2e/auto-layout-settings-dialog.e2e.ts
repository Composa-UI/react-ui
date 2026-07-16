import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?view=element-contract");
  await page.getByRole("button", { name: "Auto-layout settings" }).first().click();
});

test("settings expose their selected values and radio state to assistive technology", async ({ page }) => {
  const strokes = page.getByRole("button", { name: "Stroke inclusion: Excluded" });
  const stacking = page.getByRole("button", { name: "Canvas stacking: Last on top" });

  await expect(strokes).toBeVisible();
  await expect(stacking).toBeVisible();

  await strokes.click();
  await expect(page.getByRole("menuitemradio", { name: "Excluded" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("menuitemradio", { name: "Included" })).toHaveAttribute("aria-checked", "false");
  await page.getByRole("menuitemradio", { name: "Included" }).click();
  await expect(page.getByRole("button", { name: "Stroke inclusion: Included" })).toBeVisible();

  await stacking.click();
  await expect(page.getByRole("menuitemradio", { name: "Last on top" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("menuitemradio", { name: "First on top" })).toHaveAttribute("aria-checked", "false");
});
