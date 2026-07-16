import { expect, test } from "@playwright/test";

test("easing segments select and double-click quick-switch presets", async ({ page }) => {
  await page.goto("/?view=issue-72-easing-segments");

  const segment = page.locator('[data-easing-segment="light-motion:opacity:linear"]');
  const lane = page.locator('[data-timeline-property-lane="light-motion:opacity"]');
  const markers = lane.locator("[data-keyframe-id]");
  await expect(markers).toHaveCount(6);
  const firstMarker = markers.first();
  const markerBox = await firstMarker.boundingBox();
  if (!markerBox) throw new Error("Starting keyframe marker is not measurable");
  expect(await page.evaluate(
    ({ x, y }) => (document.elementFromPoint(x, y) as HTMLElement | null)?.dataset.keyframeId,
    { x: markerBox.x + markerBox.width / 2, y: markerBox.y + markerBox.height / 2 },
  )).toBe("linear");

  const laneBox = await lane.boundingBox();
  const segmentBox = await segment.boundingBox();
  const nextMarkerBox = await markers.nth(1).boundingBox();
  if (!laneBox || !segmentBox || !nextMarkerBox) throw new Error("Easing lane is not measurable");
  const markerCenter = markerBox.x + markerBox.width / 2;
  const nextMarkerCenter = nextMarkerBox.x + nextMarkerBox.width / 2;
  expect(segmentBox.width).toBeCloseTo(28, 0);
  expect(segmentBox.x + segmentBox.width / 2).toBeCloseTo((markerCenter + nextMarkerCenter) / 2, 0);
  const addY = laneBox.y + laneBox.height / 2;
  const addX = await page.evaluate(
    ({ left, right, y }) => {
      for (let x = left + 8; x < right - 8; x += 2) {
        const target = document.elementFromPoint(x, y) as HTMLElement | null;
        if (target?.matches('[data-timeline-property-lane="light-motion:opacity"]')) return x;
      }
      return null;
    },
    { left: laneBox.x, right: laneBox.x + laneBox.width, y: addY },
  );
  if (addX === null) throw new Error("No empty easing-lane hit target remained");
  await page.mouse.click(addX, addY);
  await expect(markers).toHaveCount(7);

  await expect(segment).toHaveAttribute("data-easing-preset", "linear");
  await segment.click();
  await expect(segment).toHaveAttribute("aria-pressed", "true");

  await segment.dblclick();
  const menu = page.getByLabel("Opacity easing presets");
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitemradio", { name: "Ease out" }).click();
  await expect(segment).toHaveAttribute("data-easing-preset", "ease-out");
  await expect(markers).toHaveCount(7);
  await expect(menu).toBeHidden();

  await segment.focus();
  await segment.press("Shift+Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});
