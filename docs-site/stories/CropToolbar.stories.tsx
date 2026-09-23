// Story for CropToolbar — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Toolbars" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Toolbars/CropToolbar",
  parameters: {
    docs: { description: { component: "The crop-mode toolbar: an aspect-ratio split button, resize-to-fill, a zoom slider, and cancel / done. The host owns the document mutation and canvas geometry." } },
  },
  render: () => FIXTURES.CropToolbar(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
