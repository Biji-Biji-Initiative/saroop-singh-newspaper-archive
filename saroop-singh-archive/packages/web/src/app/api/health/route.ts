import { access, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'

import { NextResponse } from 'next/server'

import { ARCHIVE_DATA_DIR } from '@/lib/archive-storage'
import { readPublishedArticles } from '@/lib/archive-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function storageIsWritable(): Promise<boolean> {
  try {
    await mkdir(ARCHIVE_DATA_DIR, { recursive: true })
    await access(ARCHIVE_DATA_DIR, constants.R_OK | constants.W_OK)
    return true
  } catch (error) {
    console.error('Archive storage is unavailable', error)
    return false
  }
}

export async function GET() {
  const articleCount = readPublishedArticles().length
  const storageWritable = await storageIsWritable()
  const restorationConfigured = Boolean(process.env.GEMINI_API_KEY?.trim())
  const healthy = articleCount > 0 && storageWritable && restorationConfigured

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        articleCount,
        storageWritable,
        restorationConfigured,
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
