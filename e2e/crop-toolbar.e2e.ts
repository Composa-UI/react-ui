import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`crop playground exposes the overlay and both toolbars in ${theme}`, async ({ page }, testInfo) => {
    await page.goto(`/?view=crop-contract&theme=${theme}`);
    const crop = page.getByRole("toolbar", { name: "Crop tools", exact: true });
    const creation = page.getByRole("toolbar", { name: "Creation tools", exact: true });
    const overlay = page.locator("[data-composa-crop-overlay]");
    await expect(crop).toBeVisible();
    await expect(creation).toBeVisible();
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveCSS("cursor", "move");
    const cropBox = await crop.boundingBox(), creationBox = await creation.boundingBox();
    expect(cropBox).not.toBeNull(); expect(creationBox).not.toBeNull();
    expect(cropBox!.y + cropBox!.height).toBeLessThan(creationBox!.y);
    await page.screenshot({ path: testInfo.outputPath(`crop-${theme}.png`) });
  });
}
