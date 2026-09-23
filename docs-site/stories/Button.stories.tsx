// Story for Button — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Actions" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Actions/Button",
  parameters: {
    docs: { description: { component: "Primary interactive control that triggers an action in place." } },
  },
  render: () => FIXTURES.Button(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
