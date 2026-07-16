import { expect, test } from "@playwright/test";

test("settings entry points share the Settings2 semantic, geometry, and states", async ({ page }) => {
  await page.goto("/?view=element-contract");

  const labels = ["Auto-layout settings", "Type settings", "Stroke settings"];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label });
    const icon = button.locator('[data-icon-semantic="settings"]');
    await expect(button).toBeVisible();
    await expect(icon).toHaveClass(/lucide-settings-2/);
    await expect(icon).toHaveAttribute("width", "16");
    await expect(icon).toHaveAttribute("height", "16");
    await expect(icon).toHaveAttribute("stroke-width", "1.5");
  }

  const metrics = await Promise.all(labels.map(label => page.getByRole("button", { name: label }).evaluate(button => {
    const icon = button.querySelector<SVGElement>('[data-icon-semantic="settings"]')!;
    const buttonBox = button.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    return {
      buttonWidth: buttonBox.width,
      buttonHeight: buttonBox.height,
      iconWidth: iconBox.width,
      iconHeight: iconBox.height,
      centerDeltaX: Math.abs((buttonBox.left + buttonBox.width / 2) - (iconBox.left + iconBox.width / 2)),
      centerDeltaY: Math.abs((buttonBox.top + buttonBox.height / 2) - (iconBox.top + iconBox.height / 2)),
      color: getComputedStyle(icon).color,
    };
  })));

  for (const metric of metrics) {
    expect(metric).toMatchObject({ buttonWidth: 24, buttonHeight: 24, iconWidth: 16, iconHeight: 16 });
    expect(metric.centerDeltaX).toBeLessThanOrEqual(0.5);
    expect(metric.centerDeltaY).toBeLessThanOrEqual(0.5);
  }
  expect(new Set(metrics.map(metric => metric.color)).size).toBe(1);

  const hoverBackgrounds: string[] = [];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label });
    await button.hover();
    await page.waitForTimeout(250);
    hoverBackgrounds.push(await button.evaluate(element => getComputedStyle(element).backgroundColor));
  }
  expect(hoverBackgrounds.every(color => color !== "rgba(0, 0, 0, 0)")).toBe(true);
  expect(new Set(hoverBackgrounds).size).toBe(1);
});

test("Animate settings entry points share the Settings2 semantic", async ({ page }) => {
  await page.goto("/?view=inspector-modes");
  await page.getByRole("tab", { name: "Animate" }).last().click();

  for (const label of ["Comp transition settings", "Object animation settings"]) {
    const icon = page.getByRole("button", { name: label }).locator('[data-icon-semantic="settings"]');
    await expect(icon).toHaveClass(/lucide-settings-2/);
    await expect(icon).toHaveAttribute("width", "16");
    await expect(icon).toHaveAttribute("height", "16");
    await expect(icon).toHaveAttribute("stroke-width", "1.5");
  }
});
