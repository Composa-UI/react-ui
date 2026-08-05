import { expect, test } from "@playwright/test";

test("I5 Share keeps 32px geometry, 11px copy, aligned insets, and detached Export", async ({ page }, testInfo) => {
  await page.goto("/?view=share-289&variant=project&export=1");

  const dialog = page.getByRole("dialog", { name: "Share this project" });
  const cards = dialog.locator("[data-composa-modal-card]");
  const input = dialog.getByPlaceholder("Add emails, names, or user groups");
  const title = dialog.getByText("Share this project", { exact: true });
  const close = dialog.getByRole("button", { name: "Close" });
  const exportAction = dialog.getByRole("button", { name: "Export" });

  await expect(dialog).toBeVisible();
  await expect(cards).toHaveCount(2);
  await expect(input).toHaveCSS("font-size", "11px");
  await expect(input).toHaveCSS("line-height", "16px");
  await expect(input.locator("..")).toHaveCSS("height", "32px");
  await expect(exportAction).toHaveAttribute("aria-haspopup", "dialog");

  const dialogBox = await dialog.boundingBox();
  const titleBox = await title.boundingBox();
  const closeBox = await close.boundingBox();
  const firstCard = await cards.nth(0).boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(closeBox).not.toBeNull();
  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(titleBox!.x - dialogBox!.x).toBeCloseTo(16, 0);
  expect(dialogBox!.x + dialogBox!.width - (closeBox!.x + closeBox!.width)).toBeCloseTo(16, 0);
  expect(secondCard!.y - (firstCard!.y + firstCard!.height)).toBeCloseTo(8, 0);

  await page.screenshot({ path: testInfo.outputPath("share-i5-fidelity.png") });
});
