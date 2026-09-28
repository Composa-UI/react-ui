import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/AnimationStylesDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal, searchable inspector dialog for picking an object-animation style (Build in / Action / Build out) from capability-truthful groups, anchored beside the inspector rail.",
      },
    },
  },
  render: () => FIXTURES.AnimationStylesDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
