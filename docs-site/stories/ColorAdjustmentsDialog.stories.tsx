import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/ColorAdjustmentsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal inspector dialog, docked beside the inspector rail, that hosts one video color-adjustment group — Light, Color, Color wheels, or Creative — as labelled slider rows, a color wheel, and a segmented control.",
      },
    },
  },
  render: () => FIXTURES.ColorAdjustmentsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
