import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Tag } from "./Tag";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * `Tag` is small enough that the only things worth gating are the ones a
 * consumer would get wrong, plus the one the editor already depended on.
 */

function render(node: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => { renderer = create(node); });
  return renderer!;
}

function tagNode(root: ReactTestInstance): ReactTestInstance {
  return root.findAll(node => typeof node.props?.["data-composa-tag"] === "string")[0];
}

function textOf(node: ReactTestInstance): string {
  return node.findAll(() => true)
    .flatMap(child => child.children)
    .filter((child): child is string => typeof child === "string")
    .join("");
}

describe("Tag", () => {
  it("renders its word, and does not shout it", () => {
    const tag = tagNode(render(<Tag>Public beta</Tag>).root);
    expect(textOf(tag)).toBe("Public beta");
    // The house rule is no all-caps unless asked. Assert the class list too, so
    // a later `uppercase` cannot shout it behind the string's back.
    expect(tag.props.className).not.toContain("uppercase");
  });

  it("is text, not a control: no button, no link, no Tab stop", () => {
    // A short word that looks clickable and is not is the fake affordance in
    // miniature. If a tag needs to do something, it is a Button.
    const root = render(<Tag>Beta</Tag>).root;
    expect(root.findAll(node => node.type === "button" || node.type === "a")).toHaveLength(0);
    expect(tagNode(root).type).toBe("span");
    expect(tagNode(root).props.tabIndex).toBeUndefined();
    expect(tagNode(root).props.onClick).toBeUndefined();
  });

  it("defaults to the editor's own size and tone, so AgentPanel's Beta is unchanged", () => {
    // `AgentPanel` swapped its private BetaBadge for this component. The default
    // must therefore still be the 16px brand badge that sat beside an 11px
    // heading, or that swap silently resized the editor's chrome.
    const tag = tagNode(render(<Tag>Beta</Tag>).root);
    expect({
      tone: tag.props["data-composa-tag"],
      size: tag.props["data-composa-tag-size"],
    }).toEqual({ tone: "brand", size: "sm" });
    for (const expected of ["h-[16px]", "px-[5px]", "text-[9px]", "leading-[14px]", "rounded-c-sm", "bg-c-bg-selected", "text-c-text-brand"]) {
      expect(tag.props.className).toContain(expected);
    }
  });

  it("offers a roomier size for surfaces that have room", () => {
    const tag = tagNode(render(<Tag size="md">Public beta</Tag>).root);
    for (const expected of ["h-[24px]", "px-[10px]", "text-[13px]", "rounded-c-md"]) {
      expect(tag.props.className).toContain(expected);
    }
    expect(tag.props.className).not.toContain("text-[9px]");
  });

  it("paints from tokens, never hex, so a reskin moves it", () => {
    // The defect this component exists to prevent: a consumer hand-rolling a
    // badge from literal colours that a theme change cannot reach.
    const brand = tagNode(render(<Tag tone="brand">Beta</Tag>).root);
    expect(brand.props.className).toContain("bg-c-bg-selected");
    expect(brand.props.className).toContain("text-c-text-brand");
    const neutral = tagNode(render(<Tag tone="neutral">Beta</Tag>).root);
    expect(neutral.props.className).toContain("bg-c-bg-secondary");
    expect(neutral.props.className).toContain("text-c-text-secondary");
    for (const tag of [brand, neutral]) expect(tag.props.className).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
