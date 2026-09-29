import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/Timeline",
  parameters: {
    docs: {
      description: {
        component:
          "The editor's bottom timeline region: one playhead shared across a master project strip (seconds) and a slide-local element-animation view (ms), driven entirely by controlled data.",
      },
    },
  },
  render: () => FIXTURES.Timeline(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
