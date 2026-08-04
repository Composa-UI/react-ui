import { expect, test } from "@playwright/test";

test.describe("Export Remove action alignment", () => {
  for (const contract of [
    { name: "expanded Static", query: "exportMode=static&format=JPG", finalField: "Export quality" },
    { name: "expanded Animated", query: "exportMode=frame&format=PNG", finalField: "Export frame rate" },
  ]) {
    test(`bottom-aligns with the final field row in ${contract.name}`, async ({ page }) => {
      await page.goto(`/?view=export-contract&${contract.query}`);

      const remove = page.getByRole("button", { name: "Remove export" });
      const finalField = page.getByLabel(contract.finalField);
      await expect(remove).toBeVisible();
      await expect(finalField).toBeVisible();

      const removeBox = await remove.boundingBox();
      const fieldBox = await finalField.boundingBox();
      expect(removeBox).not.toBeNull();
      expect(fieldBox).not.toBeNull();
      expect(Math.abs(
        removeBox!.y + removeBox!.height - (fieldBox!.y + fieldBox!.height),
      )).toBeLessThanOrEqual(1);
    });
  }
});
