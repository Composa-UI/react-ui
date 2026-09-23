// Story for Dropdown — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Dropdown",
  parameters: {
    docs: { description: { component: "The dropdown trigger control only: value text + chevron, with an optional leading-icon slot. The menu/list it opens is a separate concern (Menu)." } },
  },
  render: () => FIXTURES.Dropdown(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
