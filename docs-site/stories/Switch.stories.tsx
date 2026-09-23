// Story for Switch — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Switch",
  parameters: {
    docs: { description: { component: "A binary on/off switch with an accessible label; supports a mixed (indeterminate) state." } },
  },
  render: () => FIXTURES.Switch(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
