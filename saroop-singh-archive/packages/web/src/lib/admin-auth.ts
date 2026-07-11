import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Verify the operator bearer token without leaking token-length timing
 * information. This is intentionally server-only: no administrative token is
 * ever shipped to the browser bundle.
 */
export function hasValidAdminBearerToken(request: Request): boolean {
  const configuredToken = process.env.ADMIN_API_TOKEN ?? ''
  const authorization = request.headers.get('authorization') ?? ''
  const bearerMatch = /^Bearer ([^\s]+)$/.exec(authorization)
  const suppliedToken = bearerMatch?.[1] ?? ''

  const suppliedHash = createHash('sha256').update(suppliedToken).digest()
  const configuredHash = createHash('sha256').update(configuredToken).digest()
  const tokensMatch = timingSafeEqual(suppliedHash, configuredHash)

  return configuredToken.length > 0 && bearerMatch !== null && tokensMatch
}
