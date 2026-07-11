import 'server-only'

/**
 * A runtime kill switch for paid restoration and contribution intake. It
 * defaults to enabled for local development, while any explicit false-like
 * value closes both public write paths immediately.
 */
export function contributionsEnabled(): boolean {
  const configuredValue = process.env.CONTRIBUTIONS_ENABLED?.trim().toLowerCase()

  return !['0', 'false', 'no', 'off'].includes(configuredValue ?? '')
}
