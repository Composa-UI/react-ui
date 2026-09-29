// Live preview fixture for GitHubPermissionCard — the connector permission card
// shown when a GitHub tool call is awaiting the user's decision. Renders the REAL
// component in its pending state with explicit `params` that mirror a real call
// (the annotation warns that omitting them falls back to demo values). The card
// owns its own decided-label transition internally, so pressing Run / Always run
// / Cancel collapses it live; the callbacks below are where a host would wire its
// permission system. Constrained to a chat-column width so it fits the preview.
import { GitHubPermissionCard, type GitHubPermissionParam } from "@/components/ui3/GitHubPermissionCard";

// Representative params for a pending `list_issues` call — keys/values/types that
// mirror the real GitHub tool call the user is being asked to approve.
const PARAMS: readonly GitHubPermissionParam[] = [
  { key: "owner", value: "composa-dev", type: "string" },
  { key: "repo", value: "composa-editor", type: "string" },
  { key: "state", value: "open", type: "string" },
  { key: "perPage", value: 20, type: "number" },
];

export default function GitHubPermissionCardFixture() {
  return (
    <div style={{ width: 340 }}>
      <GitHubPermissionCard
        toolName="list_issues"
        params={PARAMS}
        onRun={() => undefined}
        onAlwaysRun={() => undefined}
        onCancel={() => undefined}
      />
    </div>
  );
}
