import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Public photo restoration has been retired. See /methodology for the archive restoration standard.' },
    { status: 410 }
  );
}
