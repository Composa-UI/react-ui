// Story for Tooltip — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Overlays" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/Tooltip",
  parameters: {
    docs: { description: { component: "A tooltip: a small dark floating label (with an optional hotkey) shown on hover/focus of its trigger. Always dark so it reads above any surface." } },
  },
  render: () => FIXTURES.Tooltip(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
