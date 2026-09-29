import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/TextPair",
  parameters: {
    docs: {
      description: {
        component:
          "Read-only label + value pair for property display in inspector rows, panels, and tooltips.",
      },
    },
  },
  render: () => FIXTURES.TextPair(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
