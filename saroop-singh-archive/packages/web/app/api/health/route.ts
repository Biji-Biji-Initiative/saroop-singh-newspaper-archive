import { archiveAuthConfigured } from "@/lib/archive-auth";
import { verifyDatabaseWritable } from "@/db";
import { verifyObjectStorageWritable } from "@/lib/archive-bucket";
import { getAllArticles } from "@/lib/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [articles, objectStorageWritable] = await Promise.all([
      getAllArticles(),
      verifyObjectStorageWritable(),
    ]);
    const databaseWritable = verifyDatabaseWritable();
    const providers = {
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    };

    return Response.json(
      {
        status: "ok",
        checks: {
          activeArticleCount: articles.length,
          databaseWritable,
          objectStorageWritable,
          adminAuthConfigured: archiveAuthConfigured(),
          restorationProviders: providers,
        },
      },
      {
        headers: {
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("Archive health check failed", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return Response.json(
      { status: "error" },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }
}