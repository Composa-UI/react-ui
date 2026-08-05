import { expect, test } from "@playwright/test";

test.describe("Issue #207 — separated field/action controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?view=issue-207");
  });

  test("keeps editable fields and their actions as measured, non-overlapping 24px surfaces", async ({ page }, testInfo) => {
    for (const fixtureName of ["light-240", "light-200"]) {
      const fixture = page.locator(`[data-composa-issue-207-fixture="${fixtureName}"]`);
      await expect(fixture).toBeVisible();
      const geometry = await fixture.evaluate(node => {
        const actions = [...node.querySelectorAll<HTMLElement>("[data-composa-field-action]")];
        const groups = [...node.querySelectorAll<HTMLElement>("[data-composa-separated-field-actions]")];
        return {
          actions: actions.map(action => {
            const rect = action.getBoundingClientRect();
            return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
          }),
          groups: groups.map(group => {
            const rect = group.getBoundingClientRect();
            const field = group.querySelector<HTMLElement>("[data-composa-numeric-input]") ?? group.querySelector<HTMLElement>(".bg-c-bg-secondary");
            const fieldRect = field?.getBoundingClientRect();
            const groupActions = [...group.querySelectorAll<HTMLElement>("[data-composa-field-action]")].map(action => action.getBoundingClientRect());
            return {
              width: rect.width,
              fieldWidth: fieldRect?.width ?? 0,
              firstGap: fieldRect && groupActions[0] ? groupActions[0].left - fieldRect.right : 0,
              actionGaps: groupActions.slice(1).map((action, index) => action.left - groupActions[index].right),
              right: rect.right,
              actionRight: groupActions.at(-1)?.right ?? rect.right,
            };
          }),
        };
      });
      expect(geometry.actions.length).toBeGreaterThan(0);
      for (const action of geometry.actions) {
        expect(action.width).toBe(24);
        expect(action.height).toBe(24);
      }
      for (const group of geometry.groups) {
        expect(group.fieldWidth).toBeGreaterThan(0);
        if (group.firstGap) expect(group.firstGap).toBeGreaterThanOrEqual(4);
        for (const gap of group.actionGaps) expect(gap).toBeGreaterThanOrEqual(4);
        expect(group.actionRight).toBeLessThanOrEqual(group.right + 0.1);
      }
    }
    await page.screenshot({ path: testInfo.outputPath("issue-207-separated-field-actions.png"), fullPage: true });
  });

  test("preserves pressed, hover/focus, disabled, mixed, and two-action semantics", async ({ page }) => {
    const fixture = page.locator('[data-composa-issue-207-fixture="light-240"]');
    const numericKeyframe = fixture.getByRole("button", { name: "light numeric keyframe" });
    await expect(numericKeyframe).toHaveAttribute("aria-pressed", "true");
    await numericKeyframe.click();
    await expect(numericKeyframe).toHaveAttribute("aria-pressed", "false");
    await numericKeyframe.focus();
    await expect(numericKeyframe).toBeFocused();
    await expect(numericKeyframe).toHaveClass(/focus-visible:ring-c-focus-ring/);

    const pairGroup = fixture.getByRole("button", { name: "light X/light Y keyframe" }).locator("..");
    await expect(pairGroup.locator("[data-composa-field-action]")).toHaveCount(2);
    const aspectLock = fixture.getByRole("button", { name: "light aspect ratio lock" });
    await expect(aspectLock).toHaveAttribute("aria-pressed", "false");
    await aspectLock.click();
    await expect(aspectLock).toHaveAttribute("aria-pressed", "true");

    const colorKeyframe = fixture.getByRole("button", { name: "light color color keyframe" });
    const activeColors = await page.evaluate(([activeSelector, inactiveSelector]) => {
      const active = document.querySelector<HTMLElement>(activeSelector);
      const inactive = document.querySelector<HTMLElement>(inactiveSelector);
      return { active: active ? getComputedStyle(active).backgroundColor : "", inactive: inactive ? getComputedStyle(inactive).backgroundColor : "" };
    }, [
      '[data-composa-issue-207-fixture="light-240"] [aria-label="light color color keyframe"]',
      '[data-composa-issue-207-fixture="light-240"] [aria-label="light color opacity keyframe"]',
    ]);
    expect(activeColors.active).not.toBe(activeColors.inactive);
    await expect(colorKeyframe).toHaveAttribute("aria-pressed", "true");

    const disabledMixed = fixture.getByRole("spinbutton", { name: "light disabled mixed" });
    await expect(disabledMixed).toHaveAttribute("placeholder", "Mixed");
    await expect(disabledMixed).toBeDisabled();
    const disabledAction = fixture.getByRole("button", { name: "light disabled mixed keyframe" });
    await expect(disabledAction).toBeDisabled();
  });
});
