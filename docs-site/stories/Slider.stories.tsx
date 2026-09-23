// Story for Slider — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Slider",
  parameters: {
    docs: { description: { component: "A horizontal slider on a native range input: a pill track with a fill and a circular handle. Track and handle variants cover gradient, alpha, and gradient-stop use." } },
  },
  render: () => FIXTURES.Slider(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
