// Story for SidePanel — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Panels" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/SidePanel",
  parameters: {
    docs: { description: { component: "The resizable shell shared by every left-rail panel (Composition, Assets, Agent). Owns the width and a drag-resize separator so the panels can't drift and a host-controlled width survives switching tabs." } },
  },
  render: () => FIXTURES.SidePanel(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
