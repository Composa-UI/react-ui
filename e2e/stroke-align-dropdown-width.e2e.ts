import { expect, test } from "@playwright/test";

// Regression: the Stroke row's "Position" (stroke alignment) dropdown rendered
// 0-width, so users could never change Inside/Center/Outside.
//
// Root cause was NOT the ChoiceDropdown itself: the sibling Stroke-settings
// dialog trigger sits in the same `flex items-end` row as the two `flex-1
// min-w-0` (basis 0%) columns. InspectorDialog wrapped that 24px icon-button
// trigger in `block w-full`, giving the wrapper a full-width flex-basis that, in
// the shrink algorithm, consumed all free space and starved BOTH flex-1 columns
// (Position + Weight) down to 0. Fix: shrink-wrap the dialog trigger so the
// columns keep their share. This test asserts the align dropdown has real width,
// opens, and round-trips a selection through the controlled `align` value.

test("Stroke Position (align) dropdown has non-zero width, opens, and is selectable", async ({ page }) => {
  await page.goto("/?view=element-contract");

  // The stroke align dropdown is the only control whose accessible name is
  // exactly "Inside" (initial align value). No aria-label on this ChoiceDropdown,
  // so the name comes from its rendered text.
  const alignTrigger = page.getByRole("button", { name: "Inside", exact: true });
  await expect(alignTrigger).toBeVisible();

  // 1) Measured width must be non-zero (previously 0). Also assert the Position
  //    and Weight columns render at parity — both are flex-1, so starving one
  //    starved both.
  const widths = await alignTrigger.evaluate(btn => {
    const col = btn.closest(".flex-1");
    const row = col?.parentElement;
    const cols = row ? [...row.children].filter(c => c.classList.contains("flex-1")) : [];
    return {
      align: +btn.getBoundingClientRect().width.toFixed(2),
      columns: cols.map(c => +c.getBoundingClientRect().width.toFixed(2)),
    };
  });
  expect(widths.align, "stroke align dropdown measured width").toBeGreaterThan(40);
  expect(widths.columns.length, "Position + Weight flex-1 columns").toBe(2);
  expect(
    Math.abs(widths.columns[0] - widths.columns[1]),
    "Position vs Weight column width parity",
  ).toBeLessThanOrEqual(2);

  // 2) Opens on click and shows all three alignment options.
  await alignTrigger.click();
  await expect(page.getByRole("menuitem", { name: "Inside" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Center" })).toBeVisible();
  const outside = page.getByRole("menuitem", { name: "Outside" });
  await expect(outside).toBeVisible();

  // 3) Selecting an option round-trips through the controlled `align` value:
  //    the trigger text updates to the new selection.
  await outside.click();
  const selected = page.getByRole("button", { name: "Outside", exact: true });
  await expect(selected).toBeVisible();

  // Width stays intact after the value change.
  const w2 = await selected.evaluate(btn => +btn.getBoundingClientRect().width.toFixed(2));
  expect(w2, "stroke align dropdown width after selection").toBeGreaterThan(40);
});
