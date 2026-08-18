/**
 * Publication guards.
 *
 * This repository is meant to be readable by strangers, so three properties have
 * to hold at every commit — each one was violated at least once before these
 * tests existed:
 *
 *  1. No fixture carries a real person's email address. A demo fixture is
 *     rendered in a browser and published with the repo; a real address in one
 *     is third-party personal data the maintainer cannot consent to publishing
 *     on someone else's behalf.
 *  2. No exported component falls back to the maintainer's own accounts. A
 *     default rendered by every consumer that omits the prop is not a fixture,
 *     it is shipped identity.
 *  3. No third-party source is vendored into the tree. LICENSE, NOTICE and
 *     docs/third-party-notices.md all assert this; if it stops being true the
 *     attribution obligations change and those files become wrong.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { GitHubPermissionCard } from "./components/ui3/GitHubPermissionCard";

const SRC = join(__dirname);
const REPO = join(__dirname, "..");

/** RFC 2606 §3 reserved second-level domains. Nothing else may appear. */
const RESERVED = new Set(["example.com", "example.net", "example.org"]);

const SCANNED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".html"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCANNED_EXTENSIONS.some(e => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g;

describe("publication guards", () => {
  it("scans a non-empty corpus (so a green result is not vacuous)", () => {
    const files = walk(SRC);
    expect(files.length).toBeGreaterThan(100);
  });

  it("uses only RFC 2606 reserved domains in every email address under src/", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(EMAIL)) {
        const domain = match[1].toLowerCase();
        // Compare on the registrable pair so a subdomain cannot smuggle one past.
        const registrable = domain.split(".").slice(-2).join(".");
        if (!RESERVED.has(registrable)) {
          // Report the location and the domain only — never the local part.
          offenders.push(`${relative(REPO, file)} -> @${domain}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("renders neutral placeholder accounts in GitHubPermissionCard's defaults", () => {
    // The component is exported from the barrel, so these defaults are public
    // API: every consumer that omits `params` renders them.
    const html = renderToStaticMarkup(
      createElement(GitHubPermissionCard, { toolName: "get_me" }),
    );
    expect(html).toContain("octocat");
    expect(html).toContain("hello-world");
    // GitHub's own documentation placeholders are the only accounts allowed here.
    expect(html).not.toMatch(/github\.io/);
  });

  it("vendors no third-party component source", () => {
    // The shadcn/ui island and the Figma Make shim were deleted; nothing that
    // remains is copied from another project.
    expect(existsSync(join(SRC, "components", "ui"))).toBe(false);
    expect(existsSync(join(SRC, "components", "figma"))).toBe(false);
    const componentDirs = readdirSync(join(SRC, "components"))
      .filter(e => statSync(join(SRC, "components", e)).isDirectory());
    expect(componentDirs).toEqual(["ui3"]);
  });

  it("keeps the legal front door in place", () => {
    for (const f of ["LICENSE", "NOTICE", "CONTRIBUTING.md", join("docs", "third-party-notices.md")]) {
      expect({ file: f, present: existsSync(join(REPO, f)) }).toEqual({ file: f, present: true });
    }
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
    expect(pkg.license).toBe("Apache-2.0");
  });
});
