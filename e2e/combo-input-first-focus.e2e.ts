import { expect, test } from "@playwright/test";

test.describe("Typography font-size first-focus replacement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=element-contract");
  });

  test("replaces the selected value instead of concatenating", async ({ page }) => {
    const fontSize = page.getByRole("textbox", { name: "Font size" });
    await expect(fontSize).toHaveValue("48");

    await fontSize.click();
    await expect.poll(() => fontSize.evaluate(input => ({
      start: (input as HTMLInputElement).selectionStart,
      end: (input as HTMLInputElement).selectionEnd,
    }))).toEqual({ start: 0, end: 2 });

    await page.keyboard.type("48");
    await expect(fontSize).toHaveValue("48");
  });

  test("selects on keyboard focus but preserves a deliberate second-click caret", async ({ page }) => {
    const fontSize = page.getByRole("textbox", { name: "Font size" });
    const fontWeight = page.getByRole("button", { name: "Medium", exact: true });

    await fontWeight.focus();
    await page.keyboard.press("Tab");
    await expect(fontSize).toBeFocused();
    await expect.poll(() => fontSize.evaluate(input => ({
      start: (input as HTMLInputElement).selectionStart,
      end: (input as HTMLInputElement).selectionEnd,
    }))).toEqual({ start: 0, end: 2 });

    const box = await fontSize.boundingBox();
    if (!box) throw new Error("Font-size input is not visible");
    await fontSize.click({ position: { x: Math.max(1, box.width - 3), y: box.height / 2 } });
    await expect.poll(() => fontSize.evaluate(input => {
      const element = input as HTMLInputElement;
      return element.selectionStart === element.selectionEnd;
    })).toBe(true);
  });
});
