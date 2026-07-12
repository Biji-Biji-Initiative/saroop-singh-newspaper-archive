import "server-only";

import { dailyRequestSourceHash } from "@/lib/request-source";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

type AttemptState = {
  failures: number[];
};

const globalAttempts = globalThis as typeof globalThis & {
  __saroopLoginAttempts?: Map<string, AttemptState>;
};

function attempts(): Map<string, AttemptState> {
  globalAttempts.__saroopLoginAttempts ??= new Map();
  return globalAttempts.__saroopLoginAttempts;
}

function activeFailures(request: Request): {
  key: string;
  failures: number[];
} {
  const key = dailyRequestSourceHash(request, "login");
  const cutoff = Date.now() - WINDOW_MS;
  const failures = (attempts().get(key)?.failures || []).filter(
    timestamp => timestamp >= cutoff,
  );
  if (failures.length) attempts().set(key, { failures });
  else attempts().delete(key);
  return { key, failures };
}

export function archiveLoginAllowed(request: Request): boolean {
  return activeFailures(request).failures.length < MAX_FAILURES;
}

export function recordArchiveLogin(
  request: Request,
  succeeded: boolean,
): void {
  const { key, failures } = activeFailures(request);
  if (succeeded) {
    attempts().delete(key);
    return;
  }
  attempts().set(key, { failures: [...failures, Date.now()] });
}