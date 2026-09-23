// Story for CreationToolbar — reuses the live fixture from docs-site/app/fixtures.tsx,
// so this story and the docs "Live preview" render the exact same example.
// AUTO-ORGANIZED under the "Toolbars" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Toolbars/CreationToolbar",
  parameters: {
    docs: { description: { component: "The floating creation toolbar: tool groups (Move/Hand, Frame, Shape, Type) as a pill; each group's button reflects its last-used tool and shows an active state when any of its tools is selected." } },
  },
  render: () => FIXTURES.CreationToolbar(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
