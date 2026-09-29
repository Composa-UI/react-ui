import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/EasingInspectorSection",
  parameters: {
    docs: {
      description: {
        component:
          "The dedicated easing inspector section: pick an easing preset, hand-edit its cubic-bézier curve, and choose what the change applies to.",
      },
    },
  },
  render: () => FIXTURES.EasingInspectorSection(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
