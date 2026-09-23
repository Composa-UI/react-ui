// Story for Dial — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Dial",
  parameters: {
    docs: { description: { component: "A rotary knob for a bounded numeric value (audio inspector): a 270° arc that fills to the value, with a typed value field (NumericInput) below." } },
  },
  render: () => FIXTURES.Dial(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
