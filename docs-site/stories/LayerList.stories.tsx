// Story for LayerList — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Lists" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Lists/LayerList",
  parameters: {
    docs: { description: { component: "A Figma-style layers tree: data-driven LayerNode[] with nesting. Each row is a chevron (if a group) + type icon + name + visibility/lock. Component/instance rows use the brand accent." } },
  },
  render: () => FIXTURES.LayerList(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
