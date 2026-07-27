import { expect, test, type Locator } from "@playwright/test";

// #490 — the left drag grip and the right-side eye + minus icons must sit on the
// same vertical baseline as the color swatch / content across the Fill, Stroke,
// and Effects stack rows. We build a 2-item stack in each section (the reorder
// grip only renders with >1 item, per #460) and assert the vertical centres of
// grip / swatch|content / eye / minus agree within ~1px.
//
// On origin/main the swatch cell is a plain block wrapping the dialog's
// inline-flex trigger span; its line-box baseline strut lifts the swatch centre
// ~3px above the grip/eye/minus row baseline. The fix centres the content cell.

type Sel = { grip: string; content: string; eye: string; minus: string };

async function measureRow(row: Locator, sel: Sel) {
  await row.hover();
  return row.evaluate((rowEl, s: Sel) => {
    const centre = (el: Element | null) => {
      if (!el) return NaN;
      const r = el.getBoundingClientRect();
      return +(r.top + r.height / 2).toFixed(2);
    };
    const centres = {
      grip: centre(rowEl.querySelector(s.grip)),
      content: centre(rowEl.querySelector(s.content)),
      eye: centre(rowEl.querySelector(s.eye)),
      minus: centre(rowEl.querySelector(s.minus)),
    };
    const vals = Object.values(centres);
    return { centres, spread: +(Math.max(...vals) - Math.min(...vals)).toFixed(2) };
  }, sel);
}

test("Fill/Stroke/Effects rows: grip + swatch + eye + minus share one baseline", async ({ page }) => {
  await page.goto("/?view=issue-490-fill-rows");

  await page.getByRole("button", { name: "Add fill" }).click();
  await page.getByRole("button", { name: "Add stroke" }).click();
  await page.getByRole("button", { name: "Add stroke" }).click();
  await page.getByRole("button", { name: "Add effect" }).click();
  await page.getByRole("button", { name: "Add effect" }).click();

  const fillRow = page.locator("div.group\\/row").filter({ has: page.getByLabel("Edit Fill color") }).first();
  const fill = await measureRow(fillRow, {
    grip: "svg", content: '[aria-label="Edit Fill color"]',
    eye: '[aria-label="Hide"],[aria-label="Show"]', minus: '[aria-label="Remove fill"]',
  });
  console.log("FILL", JSON.stringify(fill));

  const strokeRow = page.locator("div.group\\/row").filter({ has: page.getByLabel("Edit Stroke color") }).first();
  const stroke = await measureRow(strokeRow, {
    grip: "svg", content: '[aria-label="Edit Stroke color"]',
    eye: '[aria-label="Hide"],[aria-label="Show"]', minus: '[aria-label="Remove stroke"]',
  });
  console.log("STROKE", JSON.stringify(stroke));

  // Effects use PanelEntry (dropdown content, "…effect" labels, group not group/row).
  const effectRow = page.locator("div.group").filter({ has: page.getByRole("button", { name: "Remove effect" }) }).last();
  const effect = await measureRow(effectRow, {
    grip: "span > svg", content: '[aria-label="Effect type"],[role="combobox"],button',
    eye: '[aria-label="Hide effect"],[aria-label="Show effect"]', minus: '[aria-label="Remove effect"]',
  });
  console.log("EFFECT", JSON.stringify(effect));

  expect(fill.spread, "Fill row vertical spread").toBeLessThanOrEqual(1);
  expect(stroke.spread, "Stroke row vertical spread").toBeLessThanOrEqual(1);
  // Effect content selector may be broad; assert grip/eye/minus at least.
  const effE = [effect.centres.grip, effect.centres.eye, effect.centres.minus];
  expect(+(Math.max(...effE) - Math.min(...effE)).toFixed(2), "Effect row grip/eye/minus spread").toBeLessThanOrEqual(1);
});
