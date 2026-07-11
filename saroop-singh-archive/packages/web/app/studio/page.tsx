import { requireArchiveAdmin } from "@/app/chatgpt-auth";
import { Studio } from "./studio";

export const metadata = { title: "Preservation Studio", robots: { index: false, follow: false } };

export default async function StudioPage() {
  const user = await requireArchiveAdmin("/studio");
  return <Studio displayName={user.fullName || user.email} />;
}
