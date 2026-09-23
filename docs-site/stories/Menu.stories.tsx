// Story for Menu — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Menus" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Menus/Menu",
  parameters: {
    docs: { description: { component: "A menu surface: a dark, rounded container that holds MenuRow children with roving keyboard focus over its items. Pair with PopoverMenu for positioning." } },
  },
  render: () => FIXTURES.Menu(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
