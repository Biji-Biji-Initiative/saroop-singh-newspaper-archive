import { createHash, timingSafeEqual } from 'node:crypto'

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PATHS = new Set(['/', '/articles'])
const ALLOWED_TAGS = new Set(['articles'])

function hasValidRevalidationBearer(request: NextRequest): boolean {
  const configuredSecret = process.env.REVALIDATE_SECRET ?? ''
  const authorization = request.headers.get('authorization') ?? ''
  const bearerMatch = /^Bearer ([^\s]+)$/.exec(authorization)
  const suppliedSecret = bearerMatch?.[1] ?? ''

  const suppliedHash = createHash('sha256').update(suppliedSecret).digest()
  const configuredHash = createHash('sha256')
    .update(configuredSecret)
    .digest()

  return (
    configuredSecret.length > 0 &&
    bearerMatch !== null &&
    timingSafeEqual(suppliedHash, configuredHash)
  )
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPath = searchParams.get('path')
    const requestedTag = searchParams.get('tag')

    if (searchParams.has('secret')) {
      return NextResponse.json(
        { message: 'Use the Authorization bearer header for revalidation.' },
        { status: 400 }
      )
    }

    if (!hasValidRevalidationBearer(request)) {
      return NextResponse.json({ message: 'Invalid authorization' }, { status: 401 })
    }

    if (requestedPath && !ALLOWED_PATHS.has(requestedPath)) {
      return NextResponse.json({ message: 'Unsupported path' }, { status: 400 })
    }

    if (requestedTag && !ALLOWED_TAGS.has(requestedTag)) {
      return NextResponse.json({ message: 'Unsupported tag' }, { status: 400 })
    }

    if (requestedPath) {
      revalidatePath(requestedPath)
    }

    if (requestedTag) {
      revalidateTag(requestedTag)
    }

    if (!requestedPath && !requestedTag) {
      revalidateTag('articles')
      revalidatePath('/articles')
      revalidatePath('/')
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path: requestedPath,
      tag: requestedTag,
    })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revalidation endpoint is active',
    endpoints: [
      'POST /api/revalidate with Authorization: Bearer <REVALIDATE_SECRET>',
      'Optional query: path=/ or path=/articles',
      'Optional query: tag=articles',
    ],
  })
}
