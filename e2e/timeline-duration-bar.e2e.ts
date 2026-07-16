import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?view=timeline-duration-contract");
});

test("duration bars expose bounded keyboard move and proportional edge scaling", async ({ page }) => {
  const bar = page.locator('[data-timeline-duration-bar="hero-duration"]');
  const move = page.getByRole("button", { name: "Move Hero duration" });
  const scaleStart = page.getByRole("button", { name: "Scale Hero duration from start" });
  const scaleEnd = page.getByRole("button", { name: "Scale Hero duration from end" });

  await expect(move).toBeVisible();
  await expect(scaleStart).toBeVisible();
  await expect(scaleEnd).toBeVisible();
  await expect(page.getByRole("img", { name: "Locked title duration 1500ms to 3500ms" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Move Locked title duration" })).toHaveCount(0);

  await move.press("ArrowRight");
  await expect(bar).toHaveAttribute("data-duration-start-ms", "1100");
  await expect(bar).toHaveAttribute("data-duration-end-ms", "4100");

  await scaleStart.press("ArrowLeft");
  await expect(bar).toHaveAttribute("data-duration-start-ms", "1000");
  await expect(bar).toHaveAttribute("data-duration-end-ms", "4100");

  await scaleEnd.press("Shift+ArrowRight");
  await expect(bar).toHaveAttribute("data-duration-start-ms", "1000");
  await expect(bar).toHaveAttribute("data-duration-end-ms", "5100");
});

test("pointer dragging moves the complete authored range as one gesture", async ({ page }) => {
  const bar = page.locator('[data-timeline-duration-bar="hero-duration"]');
  const move = page.getByRole("button", { name: "Move Hero duration" });
  const bounds = await move.boundingBox();
  if (!bounds) throw new Error("Duration move target was not measurable");

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 80, bounds.y + bounds.height / 2, { steps: 4 });
  await page.mouse.up();

  const start = Number(await bar.getAttribute("data-duration-start-ms"));
  const end = Number(await bar.getAttribute("data-duration-end-ms"));
  expect(start).toBeGreaterThan(1_000);
  expect(end).toBeGreaterThan(4_000);
  expect(end - start).toBe(3_000);
});
