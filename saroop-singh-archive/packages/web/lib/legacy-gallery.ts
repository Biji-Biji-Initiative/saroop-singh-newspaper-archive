import preservationManifest from "@/data/generated/preservation-manifest.json";
import extendedFamily from "@/data/gallery/gemini-extended-family-portrait-1970s-group.json";
import extendedIndianFamily from "@/data/gallery/gemini-extended-indian-family-group-portrait-1970s-formal.json";
import youngManPortrait from "@/data/gallery/gemini-portrait-of-a-young-man-in-a-turban-vintage-monochrome.json";
import sardarAndSardarni from "@/data/gallery/gemini-sardar-and-sardarni-india-1950s-portrait.json";
import saroopRunningOne from "@/data/gallery/gemini-saroop-singh-running1.json";
import saroopRunningTwo from "@/data/gallery/gemini-saroop-singh-running2.json";
import sikhCouple from "@/data/gallery/gemini-sikh-couple-portrait-1980s-family-photo.json";
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

const collections = [
  extendedFamily,
  extendedIndianFamily,
  youngManPortrait,
  sardarAndSardarni,
  saroopRunningOne,
  saroopRunningTwo,
  sikhCouple,
] as LegacyCollection[];

export function getLegacyCollections() {
  return collections.map(collection => ({ ...curateGalleryItem(collection), fixity: preservationManifest.collections.find(item => item.id === collection.id) }));
}

export function getLegacyCollection(id: string) {
  return getLegacyCollections().find(collection => collection.id === id) || null;
}
