import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/EffectDetailsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal inspector dialog for editing one media effect: its type, and either the shadow position/blur/spread/color/opacity or a blur-only radius, anchored beside the inspector rail.",
      },
    },
  },
  render: () => FIXTURES.EffectDetailsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
