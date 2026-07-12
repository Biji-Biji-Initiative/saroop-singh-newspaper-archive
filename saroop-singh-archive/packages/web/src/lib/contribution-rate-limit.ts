import 'server-only'

import {
  archiveDataPath,
  readJsonFile,
  writeJsonAtomically,
} from '@/lib/archive-storage'

const DEFAULT_DAILY_CONTRIBUTION_LIMIT = 100
const MAX_DAILY_CONTRIBUTION_LIMIT = 1_000
const STATE_PATH = archiveDataPath('rate-limits', 'contribution.json')

interface ContributionRateLimitState {
  date: string
  count: number
}

export interface ContributionRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

let updateQueue: Promise<unknown> = Promise.resolve()

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function configuredDailyLimit(): number {
  const configured = Number(process.env.CONTRIBUTION_DAILY_GLOBAL_LIMIT)
  return Number.isInteger(configured) &&
    configured >= 1 &&
    configured <= MAX_DAILY_CONTRIBUTION_LIMIT
    ? configured
    : DEFAULT_DAILY_CONTRIBUTION_LIMIT
}

function secondsUntilTomorrowUtc(now: Date): number {
  const tomorrow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  )
  return Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1_000))
}

function normalizedState(
  value: unknown,
  date: string
): ContributionRateLimitState {
  const record =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  const count = record?.count

  if (
    record?.date === date &&
    typeof count === 'number' &&
    Number.isSafeInteger(count) &&
    count >= 0
  ) {
    return { date, count }
  }

  return { date, count: 0 }
}

/**
 * Private uploads consume durable volume even when no AI work is requested.
 * A persisted daily cap prevents a public intake endpoint from exhausting the
 * archive volume, including across process restarts.
 */
export async function consumeContributionQuota(): Promise<ContributionRateLimitResult> {
  const run = async (): Promise<ContributionRateLimitResult> => {
    const now = new Date()
    const state = normalizedState(
      await readJsonFile<unknown>(STATE_PATH),
      todayUtc()
    )
    const limit = configuredDailyLimit()

    if (state.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: secondsUntilTomorrowUtc(now),
      }
    }

    await writeJsonAtomically(STATE_PATH, {
      ...state,
      count: state.count + 1,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  const result = updateQueue.then(run, run)
  updateQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}
