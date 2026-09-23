// Story for AlignmentControl — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/AlignmentControl",
  parameters: {
    docs: { description: { component: "A 3x3 alignment picker (nine anchor positions) as one radiogroup; its face changes with the frame flow — a single dot (stack) or table cells (grid)." } },
  },
  render: () => FIXTURES.AlignmentControl(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
