import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { publicIdentityTags } from "@/db/schema";

export type PublicIdentityTag = {
  id: string;
  subjectId: string;
  name: string;
  anchorX: number | null;
  anchorY: number | null;
};

const placeholderPeople = new Set([
  "people not yet identified",
  "identities not yet confirmed",
  "identity not yet confirmed",
  "saroop singh family collection",
]);

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Load only the names a curator explicitly made public. */
export async function loadPublishedIdentityTags(
  subjectIds: string[],
): Promise<PublicIdentityTag[]> {
  if (!subjectIds.length) return [];
  return getDb()
    .select({
      id: publicIdentityTags.id,
      subjectId: publicIdentityTags.subjectId,
      name: publicIdentityTags.name,
      anchorX: publicIdentityTags.anchorX,
      anchorY: publicIdentityTags.anchorY,
    })
    .from(publicIdentityTags)
    .where(
      and(
        inArray(publicIdentityTags.subjectId, subjectIds),
        eq(publicIdentityTags.status, "published"),
      ),
    );
}

/** Merge the historic caption with approved family identifications without rewriting either. */
export function publicPeopleLabel(
  existingPeople: string | undefined,
  identities: PublicIdentityTag[],
): string | undefined {
  const namesByNormalizedValue = new Map<string, string>();
  for (const identity of identities) {
    const name = identity.name.trim();
    if (name) namesByNormalizedValue.set(normalized(name), name);
  }
  const names = [...namesByNormalizedValue.values()];
  if (!names.length) return existingPeople;

  const existing = existingPeople?.trim();
  if (!existing || placeholderPeople.has(normalized(existing))) {
    return `${names.join(", ")} · others not yet identified`;
  }

  const existingName = normalized(existing);
  const additions = names.filter((name) => !existingName.includes(normalized(name)));
  return additions.length ? `${existing}; ${additions.join(", ")}` : existing;
}
