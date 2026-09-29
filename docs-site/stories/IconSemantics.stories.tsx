import type { Meta, StoryObj } from "@storybook/react-vite";
import { FIXTURES } from "../app/fixtures";

const meta = {
  title: "Panels/IconSemantics",
  parameters: {
    docs: {
      description: {
        component:
          "Central map from Composa editor semantics (layer types, layout, spacing, alignment, typography, sizing, media) to their Lucide glyph, so every inspector field and panel shows one consistent icon.",
      },
    },
  },
  render: () => FIXTURES.IconSemantics(),
} satisfies Meta;

export default meta;
export const Default: StoryObj = {};
