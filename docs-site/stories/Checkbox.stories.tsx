// Story for Checkbox — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/Checkbox",
  parameters: {
    docs: { description: { component: "A checkbox with checked / unchecked / mixed states; renders on the light inspector or a dark canvas surface (ghost)." } },
  },
  render: () => FIXTURES.Checkbox(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
