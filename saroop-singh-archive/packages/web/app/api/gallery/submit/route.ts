import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Direct public uploads are disabled. Contact the archive to contribute historical material.' },
    { status: 410 }
  );
}
