import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/TypeSettingsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "An anchored, non-modal typography dialog: header + preview, segmented alignment/vertical/decoration/case rows, a weight input+slider, and line-height/letter-spacing metrics. Floats beside the inspector rail.",
      },
    },
  },
  render: () => FIXTURES.TypeSettingsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
