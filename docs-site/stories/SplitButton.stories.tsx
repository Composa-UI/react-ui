// Story for SplitButton — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Actions" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Actions/SplitButton",
  parameters: {
    docs: { description: { component: "A split button: a primary action segment plus a chevron that opens a menu of related choices. The chevron stays operable even when the action is disabled, so the menu is always reachable." } },
  },
  render: () => FIXTURES.SplitButton(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
