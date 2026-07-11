import { NextResponse } from 'next/server'
import { readPublishedArticles } from '@/lib/archive-content'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const articles = readPublishedArticles()
    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
