import { expect, test } from "@playwright/test";

// Real PointerEvents against the running playground (?view=dial). Proves drag,
// keyboard, reset and clamp on the actual DOM — not synthetic React calls.

test.describe("Dial — audio inspector rotary knob", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=dial");
  });

  test("vertical drag with real pointer events changes the value", async ({ page }) => {
    // "Reverb" in the light fixture starts at 50%.
    const dial = page.getByRole("slider", { name: "Reverb" }).first();
    await expect(dial).toHaveAttribute("aria-valuenow", "50");

    const box = await dial.boundingBox();
    if (!box) throw new Error("Dial not visible");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Drag up ~40px → value increases.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 40, { steps: 8 });
    await page.mouse.up();

    const after = Number(await dial.getAttribute("aria-valuenow"));
    expect(after).toBeGreaterThan(50);

    // Drag down past the bottom → clamps at 0 (never negative).
    const box2 = await dial.boundingBox();
    if (!box2) throw new Error("Dial not visible");
    const cx2 = box2.x + box2.width / 2;
    const cy2 = box2.y + box2.height / 2;
    await page.mouse.move(cx2, cy2);
    await page.mouse.down();
    await page.mouse.move(cx2, cy2 + 400, { steps: 12 });
    await page.mouse.up();
    await expect(dial).toHaveAttribute("aria-valuenow", "0");
  });

  test("keyboard stepping and Home/End", async ({ page }) => {
    const dial = page.getByRole("slider", { name: "Reverb" }).first();
    await dial.focus();
    await expect(dial).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(dial).toHaveAttribute("aria-valuenow", "51");
    await page.keyboard.press("Shift+ArrowUp"); // ×10
    await expect(dial).toHaveAttribute("aria-valuenow", "61");
    await page.keyboard.press("Home");
    await expect(dial).toHaveAttribute("aria-valuenow", "0");
    await page.keyboard.press("End");
    await expect(dial).toHaveAttribute("aria-valuenow", "100");
    await page.keyboard.press("ArrowUp"); // clamp at max
    await expect(dial).toHaveAttribute("aria-valuenow", "100");
  });

  test("double-click resets to the default value", async ({ page }) => {
    // "Loudness" default = 100, starts at 85.
    const dial = page.getByRole("slider", { name: "Loudness" }).first();
    await expect(dial).toHaveAttribute("aria-valuenow", "85");
    await dial.dblclick();
    await expect(dial).toHaveAttribute("aria-valuenow", "100");
  });

  test("horizontal drag across the value field scrubs the dial (same idiom as the other numeric inputs)", async ({ page }) => {
    // "Reverb" starts at 50%. Its value field under the knob is a scrub surface.
    const dial = page.getByRole("slider", { name: "Reverb" }).first();
    const field = page.getByRole("spinbutton", { name: "Reverb value" }).first();
    await expect(dial).toHaveAttribute("aria-valuenow", "50");

    const box = await field.boundingBox();
    if (!box) throw new Error("Value field not visible");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Drag right ~40px → value increases (rightward = increase).
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 40, cy, { steps: 8 });
    await page.mouse.up();
    const after = Number(await dial.getAttribute("aria-valuenow"));
    expect(after).toBeGreaterThan(50);

    // Drag far left → decreases and clamps at min (0, never negative).
    const box2 = await field.boundingBox();
    if (!box2) throw new Error("Value field not visible");
    const sx = box2.x + box2.width / 2;
    const sy = box2.y + box2.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx - 400, sy, { steps: 12 });
    await page.mouse.up();
    await expect(dial).toHaveAttribute("aria-valuenow", "0");
  });

  test("a plain click on the value field still focuses it for typing (scrub does not hijack clicks)", async ({ page }) => {
    const dial = page.getByRole("slider", { name: "Loudness" }).first();
    const field = page.getByRole("spinbutton", { name: "Loudness value" }).first();
    await field.click();
    await expect(field).toBeFocused();
    await field.fill("");
    await page.keyboard.type("42");
    await expect(dial).toHaveAttribute("aria-valuenow", "42");
  });

  test("typed entry via the DS NumericInput field updates the dial", async ({ page }) => {
    const dial = page.getByRole("slider", { name: "Reverb" }).first();
    const field = page.getByRole("spinbutton", { name: "Reverb value" }).first();
    await field.click();
    await field.fill("");
    await page.keyboard.type("30");
    await expect(dial).toHaveAttribute("aria-valuenow", "30");
  });
});
