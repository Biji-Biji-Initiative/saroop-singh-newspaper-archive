import "server-only";

import { createHash } from "node:crypto";

export type FamilyWorkspace = {
  hash: string;
};

function familyWorkspaceId(): string | null {
  const configured = process.env.FAMILY_WORKSPACE_ID?.trim() || "";
  return configured.length >= 32 ? configured : null;
}

/**
 * The gallery is the shared family workspace. This server-only identifier
 * groups its studies without placing a capability, invitation, or browser
 * session in the family's way.
 */
export function familyWorkspaceConfigured(): boolean {
  return familyWorkspaceId() !== null;
}

export function getFamilyWorkspace(): FamilyWorkspace | null {
  const workspaceId = familyWorkspaceId();
  if (!workspaceId) return null;
  return {
    hash: createHash("sha256").update(`family-workspace/v1:${workspaceId}`).digest("hex"),
  };
}
