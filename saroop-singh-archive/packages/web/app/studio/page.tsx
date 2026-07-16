import { requireArchiveAdmin } from "@/lib/archive-auth";
import { Studio } from "./studio";

export const metadata = { title: "Preservation Studio", robots: { index: false, follow: false } };

type StudioPageProps = {
  searchParams: Promise<{ image?: string; commission?: string }>;
};

function requestedImageId(value: string | undefined) {
  return value && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : undefined;
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const query = await searchParams;
  const initialImageId = requestedImageId(query.image);
  const commissioning = query.commission === "1" && Boolean(initialImageId);
  const returnTo = initialImageId
    ? `/studio?image=${encodeURIComponent(initialImageId)}${commissioning ? "&commission=1" : ""}#new-render`
    : "/studio";
  const user = await requireArchiveAdmin(returnTo);
  return <Studio displayName={user.fullName || user.email} initialImageId={initialImageId} commissioning={commissioning} />;
}
