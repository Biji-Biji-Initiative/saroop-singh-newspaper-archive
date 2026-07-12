import { requireArchiveAdmin } from "@/lib/archive-auth";
import { MemoryReview } from "./review";

export const metadata = { title: "Memory Review", robots: { index: false, follow: false } };
export default async function MemoryReviewPage() { await requireArchiveAdmin("/studio/memories"); return <MemoryReview />; }
