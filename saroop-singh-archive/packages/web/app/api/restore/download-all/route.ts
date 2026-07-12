import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'This legacy download endpoint has been retired.' }, { status: 410 });
}
