import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.ARCHIVE_REVALIDATE_SECRET;
    if (!configuredSecret) {
      return NextResponse.json({ message: 'Revalidation is not configured.' }, { status: 503 });
    }
    if (request.headers.get('authorization') !== `Bearer ${configuredSecret}`) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({})) as { path?: unknown; tag?: unknown };
    const path = typeof body.path === 'string' ? body.path : null;
    const tag = typeof body.tag === 'string' ? body.tag : null;
    if (path && (!path.startsWith('/') || path.startsWith('//'))) {
      return NextResponse.json({ message: 'Invalid revalidation path.' }, { status: 400 });
    }
    if (tag && !/^[a-zA-Z0-9:_-]{1,80}$/.test(tag)) {
      return NextResponse.json({ message: 'Invalid revalidation tag.' }, { status: 400 });
    }

    if (path) {
      revalidatePath(path);
    }

    if (tag) {
      revalidateTag(tag);
    }

    // If no specific path or tag, revalidate articles
    if (!path && !tag) {
      revalidateTag('articles');
      revalidatePath('/articles');
      revalidatePath('/');
    }

    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path,
      tag 
    });
  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json({ 
      message: 'Error revalidating' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Revalidation endpoint is active',
    authentication: 'Bearer token required',
    input: 'JSON body with an optional path or tag'
  });
}
