import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/FontPickerDialog",
  parameters: {
    docs: {
      description: {
        component:
          "An anchored, non-modal font picker: a searchable list where each family previews in its own typeface, with an optional installed-fonts access step.",
      },
    },
  },
  render: () => FIXTURES.FontPickerDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
