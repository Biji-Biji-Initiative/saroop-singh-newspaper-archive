export type CuratorialOverride = { title: string; date?: string; familyMember: string; description: string; originalUrl: string };

export const galleryCuration: Record<string, CuratorialOverride> = {
  "gemini-extended-family-portrait-1970s-group": { title: "Extended family group portrait", familyMember: "People not yet identified", description: "An extended family group portrait. The identities, location and date remain open to family research.", originalUrl: "/gallery-images/gemini-extended-family-portrait-1970s-group-original.jpg" },
  "gemini-extended-indian-family-group-portrait-1970s-formal": { title: "Formal family group portrait", familyMember: "People not yet identified", description: "A formal family group portrait. The identities, location and date remain open to family research.", originalUrl: "/gallery-images/gemini-extended-indian-family-group-portrait-1970s-formal-original.jpg" },
  "gemini-portrait-of-a-young-man-in-a-turban-vintage-monochrome": { title: "Portrait of an unidentified young Sikh man", familyMember: "Identity not yet confirmed", description: "A studio portrait of a young Sikh man whose identity and date have not yet been confirmed.", originalUrl: "/gallery-images/gemini-portrait-of-a-young-man-in-a-turban-vintage-monochrome-original.jpg" },
  "gemini-sardar-and-sardarni-india-1950s-portrait": { title: "Portrait of an unidentified Sikh couple", familyMember: "Identities not yet confirmed", description: "A portrait of a Sikh couple. The identities, location and date require family corroboration.", originalUrl: "/gallery-images/gemini-sardar-and-sardarni-india-1950s-portrait-original.jpg" },
  "gemini-saroop-singh-running1": { title: "M. Thomas and Saroop Singh after a mile race", familyMember: "M. Thomas and Saroop Singh", description: "A newspaper crop captioned as M. Thomas and Saroop Singh, second and first respectively in a mile race at Kuala Lumpur. The publication date remains under review.", originalUrl: "/gallery-images/gemini-saroop-singh-running1-original.jpg" },
  "gemini-saroop-singh-running2": { title: "Saroop Singh — half-mile winner portrait", date: "19 July 1937", familyMember: "Saroop Singh", description: "A crop from The Straits Times page of 19 July 1937 identifying Saroop Singh as the half-mile winner in state-record time. It is a newspaper source crop, not an untouched family print.", originalUrl: "/gallery-images/saroop-singh-running2.png" },
  "gemini-sikh-couple-portrait-1980s-family-photo": { title: "Cropped portrait of an unidentified Sikh couple", familyMember: "Identities not yet confirmed", description: "A cropped couple portrait. Its relationship to the formal group photograph, identities and date are under review.", originalUrl: "/gallery-images/gemini-sikh-couple-portrait-1980s-family-photo-original.jpg" },
};

export const galleryDimensions: Record<string, { width: number; height: number }> = {
  "gemini-extended-family-portrait-1970s-group": { width: 1280, height: 956 },
  "gemini-extended-indian-family-group-portrait-1970s-formal": { width: 1080, height: 709 },
  "gemini-portrait-of-a-young-man-in-a-turban-vintage-monochrome": { width: 1536, height: 2048 },
  "gemini-sardar-and-sardarni-india-1950s-portrait": { width: 1080, height: 1073 },
  "gemini-saroop-singh-running1": { width: 670, height: 874 },
  "gemini-saroop-singh-running2": { width: 706, height: 894 },
  "gemini-sikh-couple-portrait-1980s-family-photo": { width: 622, height: 960 },
};

export function curateGalleryItem<T extends { id: string; title?: string; date?: string; isPublic?: boolean; thumbnailUrl?: string; originalImageUrl?: string; metadata?: Record<string, unknown> }>(item: T) {
  const curated = galleryCuration[item.id];
  if (!curated) return item;
  const metadata = item.metadata || {};
  return {
    ...item,
    title: (metadata.title as string | undefined) || curated.title,
    date: (metadata.date as string | undefined) || item.date || curated.date,
    thumbnailUrl: curated.originalUrl,
    originalImageUrl: curated.originalUrl,
    metadata: {
      ...metadata,
      title: (metadata.title as string | undefined) || curated.title,
      date: (metadata.date as string | undefined) || item.date || curated.date,
      familyMember: (metadata.familyMember as string | undefined) || curated.familyMember,
      description: (metadata.description as string | undefined) || curated.description,
      tags: Array.isArray(metadata.tags) ? metadata.tags : ["Family archive"],
      isPublic: typeof metadata.isPublic === "boolean" ? metadata.isPublic : Boolean(item.isPublic),
    },
  };
}
