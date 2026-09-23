// Story for EditorShell — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Templates" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Templates/EditorShell",
  parameters: {
    docs: { description: { component: "The editor screen, published by the design system. Named region slots (nav rail, left panel, canvas, inspector, timeline) the host fills; the shell owns the layout and the overlay boundary." } },
  },
  render: () => FIXTURES.EditorShell(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
