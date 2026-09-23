// Story for NavRail — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Navigation" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Navigation/NavRail",
  parameters: {
    docs: { description: { component: "The editor's left navigation rail: icon destinations with a label below each, an active accent, and an optional brand button that opens a back-to-files menu." } },
  },
  render: () => FIXTURES.NavRail(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
