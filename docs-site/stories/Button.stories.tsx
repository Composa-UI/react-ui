// Stories for Button — one per variant, reusing the live fixtures from
// docs-site/app/fixtures.tsx so the docs demo dropdown and Storybook stay in
// lockstep. Export names must match the labels in VARIANTS (docs-site/app/data.ts)
// so the docs "Variant" dropdown resolves to the right story id.
// AUTO-ORGANIZED under the "Actions" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURE_VARIANTS } from "../app/fixtures";

const meta = {
  title: "Actions/Button",
  parameters: {
    docs: { description: { component: "Primary interactive control that triggers an action in place." } },
  },
} satisfies Meta;

export default meta;

const V = Object.fromEntries(FIXTURE_VARIANTS.Button.map(v => [v.label, v.render] as const));

export const Default: StoryObj = { render: () => V.Default() };
export const Primary: StoryObj = { render: () => V.Primary() };
export const Secondary: StoryObj = { render: () => V.Secondary() };
export const Ghost: StoryObj = { render: () => V.Ghost() };
export const Destructive: StoryObj = { render: () => V.Destructive() };
export const Disabled: StoryObj = { render: () => V.Disabled() };
