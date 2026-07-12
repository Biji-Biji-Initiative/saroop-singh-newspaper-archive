import 'server-only'

/**
 * Coolify terminates TLS before forwarding to the Node server. Use the public
 * archive origin for browser-origin checks instead of request.url, which can
 * be http:// inside the container.
 */
export function publicArchiveOrigin(): string {
  const configuredOrigin =
    process.env.ARCHIVE_PUBLIC_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim()

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin
    } catch {
      console.warn('Ignoring invalid ARCHIVE_PUBLIC_ORIGIN configuration')
    }
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://saroop.mereka.dev'
    : ''
}

/**
 * Form submissions from a browser must originate at this archive. Requests
 * without an Origin header remain supported for same-process tests and trusted
 * server-side automation; every upload path still enforces its own validation.
 */
export function hasTrustedArchiveOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    return true
  }

  const expectedOrigin = publicArchiveOrigin() || new URL(request.url).origin
  return origin === expectedOrigin
}
