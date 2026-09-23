// Story for NumericInput — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/NumericInput",
  parameters: {
    docs: { description: { component: "The inspector's number-entry primitive: a numeric field with drag-scrub, keyboard step, a mixed (multi-select) state, and an optional keyframe affordance." } },
  },
  render: () => FIXTURES.NumericInput(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
