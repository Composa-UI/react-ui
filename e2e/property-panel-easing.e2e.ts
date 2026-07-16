import { expect, test } from "@playwright/test";

test("easing inspector authors presets, custom points, scopes, and fixed-size accessible handles", async ({ page }) => {
  await page.goto("/?view=issue-72-easing-inspector");
  const sections = page.getByRole("region", { name: "Easing" });
  await expect(sections).toHaveCount(2);
  const light = sections.first();
  const lightState = page.locator("[data-easing-inspector-preset]").first();

  const preset = light.getByRole("button", { name: "Easing preset" });
  await preset.click();
  const presetMenu = page.getByRole("menu").filter({ has: page.getByRole("menuitemradio", { name: "Spring" }) });
  await expect(presetMenu.getByRole("menuitemradio")).toHaveCount(9);
  await presetMenu.getByRole("menuitemradio", { name: "Ease in-out (strong)" }).click();
  await expect(lightState).toHaveAttribute("data-easing-inspector-preset", "ease-in-out-strong");
  await expect(light.getByRole("slider", { name: "Easing control point 1" })).toHaveCount(0);

  const x1 = light.getByRole("spinbutton", { name: "Easing X1" });
  await x1.fill("0.55");
  await x1.press("Enter");
  await expect(lightState).toHaveAttribute("data-easing-inspector-preset", "custom");
  await expect(x1).toHaveValue("0.55");

  const handle = light.getByRole("slider", { name: "Easing control point 1" });
  await expect(handle).toHaveAttribute("aria-valuemin", "0");
  await expect(handle).toHaveAttribute("aria-valuemax", "1");
  await expect(handle).toHaveAttribute("aria-valuenow", "0.55");
  const before = await handle.getAttribute("aria-valuetext");
  await handle.press("Shift+ArrowUp");
  await expect(handle).not.toHaveAttribute("aria-valuetext", before ?? "");

  const apply = light.getByRole("button", { name: "Apply easing to" });
  await apply.click();
  await page.getByRole("menuitemradio", { name: "All segments on this slide" }).click();
  await expect(light.getByRole("button", { name: "Apply easing to" })).toContainText("All segments on this slide");

  const geometry = await handle.evaluate(node => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  expect(geometry.width).toBeCloseTo(18, 0);
  expect(geometry.height).toBeCloseTo(18, 0);
});
