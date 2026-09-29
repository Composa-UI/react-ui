import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/AnimatePanel",
  parameters: {
    docs: {
      description: {
        component:
          "The Animate tab body: two always-present sections — Comp transition and Object animations — for authoring a slide's transition and its per-object build/action animations.",
      },
    },
  },
  render: () => FIXTURES.AnimatePanel(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
