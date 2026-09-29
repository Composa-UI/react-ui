// Live preview fixture for GitHubToolResultCard — the connector card shown once a
// GitHub tool call has completed. Renders the REAL component with a raw tool
// function name (get_me) and a short result summary in the optional children slot
// (the annotation notes the summary shows only when children are passed). The card
// depicts the success state only; the trailing chevron is decorative and wires no
// expand/collapse. Constrained to a chat-column width so it fits the preview pane.
import { GitHubToolResultCard } from "@/components/ui3/GitHubToolResultCard";

const FONT = "font-[family-name:var(--composa-font-family)]";

export default function GitHubToolResultCardFixture() {
  return (
    <div style={{ width: 340 }}>
      <GitHubToolResultCard toolName="get_me">
        <p className={`${FONT} text-[13px] leading-[20px] text-c-text-secondary`}>
          Signed in as <span className="text-c-text">octocat</span> (octocat@example.com).
        </p>
      </GitHubToolResultCard>
    </div>
  );
}
