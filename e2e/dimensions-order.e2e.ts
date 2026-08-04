import { expect, test, type Locator } from "@playwright/test";

async function expectDimensionsBetweenFlowAndNext(panel: Locator, nextLabel: "Alignment and gap" | "Grid and gap") {
  const flow = panel.getByRole("group", { name: "Flow", exact: true });
  const dimensionsLabel = panel.getByText("Dimensions", { exact: true });
  const dimensionsRow = dimensionsLabel.locator("..");
  const next = panel.getByRole("group", { name: nextLabel, exact: true });
  await expect(flow).toBeVisible();
  await expect(dimensionsLabel).toHaveCount(1);
  await expect(next).toBeVisible();

  const [flowBox, dimensionsBox, nextBox] = await Promise.all([
    flow.boundingBox(), dimensionsRow.boundingBox(), next.boundingBox(),
  ]);
  if (!flowBox || !dimensionsBox || !nextBox) throw new Error(`${nextLabel} ordering landmarks must be measurable`);
  expect(dimensionsBox.y).toBeGreaterThanOrEqual(flowBox.y + flowBox.height);
  expect(nextBox.y).toBeGreaterThanOrEqual(dimensionsBox.y + dimensionsBox.height);
  expect(await flow.evaluate(element => element.nextElementSibling?.textContent?.includes("Dimensions"))).toBe(true);
}

test("Dimensions is the immediate rendered row after Flow for linear and Grid layouts", async ({ page }) => {
  await page.goto("/?view=issue-193-dimensions-order");
  await expectDimensionsBetweenFlowAndNext(page.locator('[data-issue-193-mode="linear"]'), "Alignment and gap");
  await expectDimensionsBetweenFlowAndNext(page.locator('[data-issue-193-mode="grid"]'), "Grid and gap");
});
