import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`keyframe controls share columns across numeric, empty, and color values (${theme})`, async ({ page }) => {
    await page.goto(`/?view=timeline-property-columns&theme=${theme}`);
    const controls = ["Rotation", "Position", "Color"].map(name => page.getByRole("button", { name: `Add ${name} keyframe`, exact: true }));
    for (const control of controls) await expect(control).toBeVisible();
    const boxes = await Promise.all(controls.map(control => control.boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    expect(boxes[1]!.x).toBeCloseTo(boxes[0]!.x, 1);
    expect(boxes[2]!.x).toBeCloseTo(boxes[0]!.x, 1);
    await controls[1].hover();
    expect((await controls[1].boundingBox())!.x).toBeCloseTo(boxes[0]!.x, 1);
    await expect(page.getByRole("textbox", { name: "Position value" })).toHaveCount(0);
  });
}
