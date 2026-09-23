// Story for ColorWheel — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/ColorWheel",
  parameters: {
    docs: { description: { component: "A circular hue/saturation color well for grade controls (Shadows / Midtones / Highlights): hue around the disc, saturation from the neutral center to the edge, with a draggable center handle." } },
  },
  render: () => FIXTURES.ColorWheel(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
