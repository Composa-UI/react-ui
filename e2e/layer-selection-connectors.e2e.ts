import { expect, test } from "@playwright/test";

test("selected parent and de-emphasized descendants form one gapless highlight run", async ({ page }) => {
  await page.goto("/?view=issue-70-row-states");

  for (const mode of ["Light", "Dark"]) {
    const fixture = page.getByRole("heading", { name: `${mode} row-state projection` })
      .locator("xpath=ancestor::section[1]");
    const parent = fixture.getByRole("treeitem", { name: "Hero frame", exact: true });
    const child = fixture.getByRole("treeitem", { name: "Title", exact: true });
    const sibling = fixture.getByRole("treeitem", { name: "Artwork", exact: true });
    const parentHighlight = parent.locator('[data-composa-row-highlight="layer"]');
    const childHighlight = child.locator('[data-composa-row-highlight="layer"]');
    const siblingHighlight = sibling.locator('[data-composa-row-highlight="layer"]');

    await expect(parent).toHaveAttribute("data-composa-row-state", "selected");
    await expect(child).toHaveAttribute("data-composa-row-state", "descendant");
    await expect(parentHighlight).toHaveAttribute("data-highlight-connected-after", "true");
    await expect(childHighlight).toHaveAttribute("data-highlight-connected-before", "true");
    await expect(childHighlight).toHaveAttribute("data-highlight-connected-after", "true");
    await expect(siblingHighlight).toHaveAttribute("data-highlight-connected-before", "true");

    const [parentBox, childBox, siblingBox] = await Promise.all([
      parentHighlight.boundingBox(),
      childHighlight.boundingBox(),
      siblingHighlight.boundingBox(),
    ]);
    if (!parentBox || !childBox || !siblingBox) throw new Error(`${mode} layer highlights were not measurable`);
    expect(parentBox.y + parentBox.height).toBeCloseTo(childBox.y, 1);
    expect(childBox.y + childBox.height).toBeCloseTo(siblingBox.y, 1);

    const parentColor = await parentHighlight.evaluate(element => getComputedStyle(element).backgroundColor);
    const childColor = await childHighlight.evaluate(element => getComputedStyle(element).backgroundColor);
    expect(childColor).not.toBe(parentColor);
    await child.hover();
    await expect.poll(() => childHighlight.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(parentColor);
  }
});
