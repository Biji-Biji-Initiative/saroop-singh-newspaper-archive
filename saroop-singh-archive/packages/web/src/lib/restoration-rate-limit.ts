import 'server-only'

import { createHash } from 'node:crypto'

import {
  archiveDataPath,
  readJsonFile,
  writeJsonAtomically,
} from '@/lib/archive-storage'

const WINDOW_MS = 60 * 60 * 1_000
const DEFAULT_PER_IP_LIMIT = 3
const DEFAULT_GLOBAL_LIMIT = 20
const STATE_PATH = archiveDataPath('rate-limits', 'restoration.json')

interface RestorationRateLimitState {
  global: number[]
  byIp: Record<string, number[]>
}

export interface RestorationRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

let updateQueue: Promise<unknown> = Promise.resolve()

function configuredLimit(
  environmentName: string,
  fallback: number,
  maximum: number
): number {
  const value = Number(process.env[environmentName] ?? fallback)
  return Number.isInteger(value) && value >= 1 && value <= maximum
    ? value
    : fallback
}

function timestampsInsideWindow(values: unknown, now: number): number[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values.filter(
    (value): value is number =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > now - WINDOW_MS &&
      value <= now
  )
}

function normalizedState(
  value: unknown,
  now: number
): RestorationRateLimitState {
  const record =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const byIpRecord =
    typeof record.byIp === 'object' &&
    record.byIp !== null &&
    !Array.isArray(record.byIp)
      ? (record.byIp as Record<string, unknown>)
      : {}
  const byIp: Record<string, number[]> = {}

  for (const [ipHash, timestamps] of Object.entries(byIpRecord)) {
    const activeTimestamps = timestampsInsideWindow(timestamps, now)
    if (activeTimestamps.length > 0) {
      byIp[ipHash] = activeTimestamps
    }
  }

  return {
    global: timestampsInsideWindow(record.global, now),
    byIp,
  }
}

function retryAfterSeconds(timestamps: number[], now: number): number {
  const oldestTimestamp = Math.min(...timestamps)
  return Math.max(1, Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1_000))
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

/**
 * Persisted, rolling-window quota. The global cap bounds paid model usage even
 * if an attacker rotates IPs or the process restarts between requests.
 */
export async function consumeRestorationQuota(
  ipAddress: string
): Promise<RestorationRateLimitResult> {
  const run = async (): Promise<RestorationRateLimitResult> => {
    const now = Date.now()
    const state = normalizedState(await readJsonFile<unknown>(STATE_PATH), now)
    const perIpLimit = configuredLimit(
      'RESTORATION_PER_IP_LIMIT',
      DEFAULT_PER_IP_LIMIT,
      20
    )
    const globalLimit = configuredLimit(
      'RESTORATION_GLOBAL_LIMIT',
      DEFAULT_GLOBAL_LIMIT,
      200
    )
    const ipHash = hashIp(ipAddress)
    const ipTimestamps = state.byIp[ipHash] ?? []

    if (state.global.length >= globalLimit) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(state.global, now),
      }
    }

    if (ipTimestamps.length >= perIpLimit) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(ipTimestamps, now),
      }
    }

    state.global.push(now)
    state.byIp[ipHash] = [...ipTimestamps, now]
    await writeJsonAtomically(STATE_PATH, state)

    return { allowed: true, retryAfterSeconds: 0 }
  }

  const result = updateQueue.then(run, run)
  updateQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}
