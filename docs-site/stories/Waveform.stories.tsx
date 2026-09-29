import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/Waveform",
  parameters: {
    docs: {
      description: {
        component:
          "Presentational bar-waveform SVG that stands in as the visual for an audio asset, drawing deterministic bars from a seed or from explicit peaks.",
      },
    },
  },
  render: () => FIXTURES.Waveform(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
