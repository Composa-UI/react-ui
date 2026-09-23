// Story for MenuRow — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Menus" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Menus/MenuRow",
  parameters: {
    docs: { description: { component: "One row of a menu or menu-toolbar. Type-driven anatomy: a reserved checkmark slot and a leading-icon slot, plus heading / divider / toolbar / footer shapes." } },
  },
  render: () => FIXTURES.MenuRow(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
