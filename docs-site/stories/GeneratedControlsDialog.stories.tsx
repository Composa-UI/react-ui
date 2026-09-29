import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/GeneratedControlsDialog",
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal, rail-anchored inspector dialog that renders a generated control manifest (a title plus typed controls: number, color, text, boolean, enum, asset) as labelled rows.",
      },
    },
  },
  render: () => FIXTURES.GeneratedControlsDialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
