import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

// Mock the dialog wrapper so the component renders without the Radix Dialog
// portal (jsdom-free, same approach as the other dialog tests).
vi.mock("./Dialog", () => ({
  MODAL_WIDTHS: { compact: 240, dialog: 320, standard: 480 },
  Modal: ({ children }: { children: ReactNode }) => <div data-modal>{children}</div>,
  ModalCard: ({ children }: { children: ReactNode }) => <div data-modal-card>{children}</div>,
  ModalHeader: ({ title, actions, className }: { title?: string; actions?: ReactNode; className?: string }) => (
    <div data-modal-header className={className}><span data-title>{title}</span>{actions}</div>
  ),
  ModalBody: ({ children }: { children: ReactNode }) => <div data-modal-body>{children}</div>,
}));

import { ShareModal, type SharePerson } from "./ShareModal";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OWNER: SharePerson[] = [{ id: "you", name: "Samuel", you: true, owner: true, color: "purple", initial: "S" }];

function text(node: ReactTestInstance | string): string {
  if (typeof node === "string") return node;
  return (node.children ?? []).map(text).join("");
}

function labelledButton(root: ReactTestInstance, label: string) {
  return root.findAll(node => node.type === "button").find(btn => text(btn).includes(label))!;
}

describe("ShareModal (Composa#289)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("titles the header per variant", () => {
    const project = renderToStaticMarkup(<ShareModal open onClose={() => undefined} variant="project" people={OWNER} />);
    const team    = renderToStaticMarkup(<ShareModal open onClose={() => undefined} variant="team" people={OWNER} />);
    expect(project).toContain("Share this project");
    expect(project).not.toContain("Invite to team");
    expect(team).toContain("Invite to team");
    expect(team).not.toContain("Share this project");
  });

  it("keeps the body identical across variants (only the header differs)", () => {
    const project = renderToStaticMarkup(<ShareModal open onClose={() => undefined} variant="project" people={OWNER} />);
    const team    = renderToStaticMarkup(<ShareModal open onClose={() => undefined} variant="team" people={OWNER} />);
    for (const html of [project, team]) {
      expect(html).toContain("Add emails, names, or user groups");
      expect(html).toContain("Who has access");
      expect(html).toContain("Anyone in Just me");
      expect(html).toContain("can access");
    }
  });

  it("matches the I5 Share inset and uses body typography inside the large invite field", () => {
    let renderer!: ReturnType<typeof create>;
    act(() => { renderer = create(<ShareModal open onClose={() => undefined} people={OWNER} />); });
    const root = renderer.root;
    const header = root.find(node => node.props["data-modal-header"] !== undefined);
    expect(header.props.className).toContain("px-[16px]");

    const input = root.findByType("input");
    expect(input.props.className).toContain("text-[11px]");
    const shell = root.find(node => node.type === "div"
      && typeof node.props.className === "string"
      && node.props.className.includes("bg-c-bg-secondary")
      && node.props.className.includes("h-[32px]"));
    expect(shell.props.className).toContain("h-[32px]");
  });

  it("renders the owner as static text and a non-owner with an editable role", () => {
    const html = renderToStaticMarkup(
      <ShareModal open onClose={() => undefined} people={[
        ...OWNER,
        { id: "a", name: "Alan Anabelle", access: "can view", color: "blue", initial: "A" },
      ]} />,
    );
    expect(html).toContain("owner");
    expect(html).toContain("Alan Anabelle");
    expect(html).toContain("can view");
    expect(html).not.toContain('aria-haspopup="menu"'); // no host mutation = no inert menus
  });

  it("renders pending invitations truthfully and only offers revoke when wired", () => {
    const staticHtml = renderToStaticMarkup(
      <ShareModal open onClose={() => undefined} people={OWNER}
        pendingInvitations={[{ id: "invite-1", email: "pending@example.com" }]} />,
    );
    expect(staticHtml).toContain("pending@example.com");
    expect(staticHtml).toContain("(pending)");
    expect(staticHtml).not.toContain(">Revoke<");

    const actionable = renderToStaticMarkup(
      <ShareModal open onClose={() => undefined} people={OWNER}
        pendingInvitations={[{ id: "invite-1", email: "pending@example.com" }]}
        onRevokeInvitation={() => undefined} />,
    );
    expect(actionable).toContain(">Revoke<");
  });

  it("gates Invite on input and emits the trimmed value", () => {
    const onInvite = vi.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => { renderer = create(<ShareModal open onClose={() => undefined} people={OWNER} onInvite={onInvite} />); });
    const root = renderer.root;

    // Disabled while empty.
    expect(labelledButton(root, "Invite").props.disabled).toBe(true);

    // Type into the field, then it enables and emits.
    act(() => { root.findByType("input").props.onChange({ target: { value: "  a@example.com  " } }); });
    const invite = labelledButton(root, "Invite");
    expect(invite.props.disabled).toBe(false);
    act(() => { invite.props.onClick(); });
    expect(onInvite).toHaveBeenCalledWith("a@example.com");
  });

  it("fails closed when the host cannot invite and explains why", () => {
    const onInvite = vi.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ShareModal open onClose={() => undefined} people={OWNER}
          inviteDisabled inviteHint="Move this project to a team to invite collaborators."
          onInvite={onInvite} />,
      );
    });
    const root = renderer.root;
    expect(root.findByType("input").props.disabled).toBe(true);
    expect(labelledButton(root, "Invite").props.disabled).toBe(true);
    expect(text(root)).toContain("Move this project to a team to invite collaborators.");
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("routes role changes and removals through callbacks", () => {
    const onChangeAccess = vi.fn();
    const onRemovePerson = vi.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ShareModal open onClose={() => undefined}
          people={[...OWNER, { id: "a", name: "Alan", access: "can edit", color: "blue", initial: "A" }]}
          onChangeAccess={onChangeAccess} onRemovePerson={onRemovePerson} />,
      );
    });
    const root = renderer.root;
    // The last PopoverMenu is the invited person's RoleMenu; its render fn yields the menu rows.
    const popovers = root.findAll(node => typeof node.props.children === "function" && "align" in node.props);
    const roleMenu = popovers[popovers.length - 1];
    const menu = roleMenu.props.children(() => undefined);
    const rows: { props: { label?: string; onClick?: () => void } }[] = menu.props.children;
    const byLabel = (label: string) => rows.find(r => r.props.label === label)!;
    act(() => { byLabel("Can view").props.onClick!(); });
    expect(onChangeAccess).toHaveBeenCalledWith("a", "can view");
    act(() => { byLabel("Remove").props.onClick!(); });
    expect(onRemovePerson).toHaveBeenCalledWith("a");
  });
});
