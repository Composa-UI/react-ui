// Story for Modal — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Overlays" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/Modal",
  parameters: {
    docs: { description: { component: "A modal dialog on Radix Dialog: focus trap, Escape, aria-modal, portal. Width presets (compact / dialog / standard / tall / medium); the backdrop is optional for floating inspector dialogs." } },
  },
  render: () => FIXTURES.Modal(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
