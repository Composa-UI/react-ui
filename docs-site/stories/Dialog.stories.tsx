import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Overlays/Dialog",
  parameters: {
    docs: {
      description: {
        component:
          "A modal dialog on Radix Dialog — focus trap, Escape, aria-modal, portal — composed from ModalHeader / ModalBody / ModalFooter, with width presets and an optional backdrop.",
      },
    },
  },
  render: () => FIXTURES.Dialog(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
