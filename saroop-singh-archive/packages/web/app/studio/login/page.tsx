import Link from "next/link";
import { redirect } from "next/navigation";
import {
  archiveAuthConfigured,
  getArchiveUser,
  safeRelativeReturnPath,
} from "@/lib/archive-auth";

export const metadata = {
  title: "Archive Studio Sign In",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    return_to?: string;
    error?: string;
  }>;
};

const messages: Record<string, string> = {
  invalid: "That email or archive passphrase was not accepted.",
  origin: "The sign-in request did not come from this archive.",
  configuration: "Archive sign-in is not configured yet.",
  rate: "Too many sign-in attempts. Wait fifteen minutes before trying again.",
};

export default async function ArchiveLoginPage({
  searchParams,
}: LoginPageProps) {
  const query = await searchParams;
  const returnTo = safeRelativeReturnPath(query.return_to || "/studio");
  const user = await getArchiveUser();
  if (user) redirect(returnTo);

  const configured = archiveAuthConfigured();
  const error = query.error
    ? messages[query.error] || "Archive sign-in failed."
    : null;

  return (
    <main className="min-h-screen bg-[#f5efe3] px-5 py-16 text-[#17241d] sm:px-8">
      <section className="mx-auto max-w-lg rounded-3xl border border-stone-300 bg-white p-7 shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-800">
          Private family archive
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight">
          Open the preservation studio
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          This area contains private originals, contributor contact details,
          family memories, and restoration review controls.
        </p>

        {error && (
          <p
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        )}

        <form
          action="/api/studio/session"
          method="post"
          className="mt-7 space-y-5"
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="text-sm font-semibold">Admin email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={!configured}
              className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Archive passphrase</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured}
              className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
            />
          </label>
          <button
            type="submit"
            disabled={!configured}
            className="min-h-12 w-full rounded-xl bg-[#17241d] px-5 font-semibold text-white transition hover:bg-[#25392f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in securely
          </button>
        </form>

        <Link
          href="/"
          className="mt-7 inline-block text-sm font-semibold text-amber-900 underline underline-offset-4"
        >
          Return to the public archive
        </Link>
      </section>
    </main>
  );
}