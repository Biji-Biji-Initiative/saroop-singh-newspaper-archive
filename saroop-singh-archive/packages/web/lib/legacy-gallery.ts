import preservationManifest from "@/data/generated/preservation-manifest.json";
import { curateGalleryItem } from "@/lib/gallery-curation";

export type LegacyStudy = { id: string; type: string; url: string; createdAt?: string };
export type LegacyCollection = {
  id: string;
  title: string;
  date?: string;
  submittedAt: string;
  isPublic: boolean;
  originalImageUrl: string;
  thumbnailUrl: string;
  metadata?: { title?: string; date?: string; familyMember?: string; tags?: string[]; description?: string; isPublic?: boolean };
  restorations: LegacyStudy[];
};

const files = import.meta.glob("../data/gallery/gemini-*.json", { eager: true, import: "default" }) as Record<string, LegacyCollection>;
const collections = Object.values(files);

export function getLegacyCollections() {
  return collections.map(collection => ({ ...curateGalleryItem(collection), fixity: preservationManifest.collections.find(item => item.id === collection.id) }));
}

export function getLegacyCollection(id: string) {
  return getLegacyCollections().find(collection => collection.id === id) || null;
}
