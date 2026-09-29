// Story for ModelPicker — reuses the live fixture from docs-site/app/fixtures/,
// so this story and the docs "Live demo" render the exact same example.
// AUTO-ORGANIZED under the "Inputs" group (same as the docs sidebar).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Inputs/ModelPicker",
  parameters: {
    docs: { description: { component: "Compact stroke-free composer-toolbar pill that shows the active model and opens the model menu; the trigger control only." } },
  },
  render: () => FIXTURES.ModelPicker(),
} satisfies Meta;

export default meta;

export const Default: StoryObj = {};
