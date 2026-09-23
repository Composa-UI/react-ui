// Story for SegmentedControl — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/SegmentedControl",
  parameters: {
    docs: { description: { component: "A single-select segmented control: mutually exclusive options as one connected row of icons and/or labels." } },
  },
  render: () => FIXTURES.SegmentedControl(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
