import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const SESSION_ACCESS_TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ADMIN_TOKEN = 'family-review-test-token'
const RESTORATION_ID = `${SESSION_ID}-archival`
const RESTORATION_FILE_NAME = 'archival-restoration.png'

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function availablePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const { port } = address
  server.close()
  await once(server, 'close')
  return port
}

async function waitForRoute(baseUrl, child, logs) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(
        `Gallery access test server exited early with code ${child.exitCode}.\n${logs.value}`
      )
    }

    try {
      const response = await fetch(`${baseUrl}/api/gallery/submit`, {
        signal: AbortSignal.timeout(1_000),
      })
      if (response.ok) {
        return
      }
    } catch {
      // The Next development server is still starting or compiling this route.
    }

    await delay(100)
  }

  throw new Error(
    `Gallery access test server did not become ready.\n${logs.value}`
  )
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')
  await Promise.race([
    once(child, 'exit'),
    delay(5_000).then(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL')
      }
      return once(child, 'exit')
    }),
  ])
}

async function main() {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'saroop-gallery-access-'))
  const sessionDirectory = join(dataDirectory, 'restorations', SESSION_ID)
  const imageUrl = `/api/restorations/${SESSION_ID}/${RESTORATION_FILE_NAME}?token=${SESSION_ACCESS_TOKEN}`
  const port = await availablePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const logs = { value: '' }
  let child

  try {
    await mkdir(sessionDirectory, { recursive: true })
    await writeFile(join(sessionDirectory, RESTORATION_FILE_NAME), 'fixture')
    await writeFile(
      join(sessionDirectory, 'session.json'),
      JSON.stringify({
        id: SESSION_ID,
        createdAt: '2026-07-12T00:00:00.000Z',
        accessToken: SESSION_ACCESS_TOKEN,
        originalFileName: 'original.png',
        originalMimeType: 'image/png',
        photoAnalysis: {
          faceCount: 2,
          faces: [
            { location: 'left foreground', visibility: 'clear' },
            { location: 'right foreground', visibility: 'partial' },
          ],
          photoSummary: 'Two people are visible in a family photograph.',
          suggestedTags: ['family photograph', 'indoor'],
          reviewRequired: true,
        },
        restorations: [
          {
            id: RESTORATION_ID,
            name: 'Archival restoration',
            style: 'archival',
            description: 'Fixture restoration',
            fileName: RESTORATION_FILE_NAME,
            mimeType: 'image/png',
          },
        ],
      })
    )

    child = spawn(
      process.execPath,
      [
        './node_modules/next/dist/bin/next',
        'dev',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ARCHIVE_DATA_DIR: dataDirectory,
          ADMIN_API_TOKEN: ADMIN_TOKEN,
          GEMINI_API_KEY: 'fixture-key-not-used-by-this-test',
          NEXT_TELEMETRY_DISABLED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )
    child.stdout.on('data', chunk => {
      logs.value += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      logs.value += chunk.toString()
    })

    await waitForRoute(baseUrl, child, logs)

    const baseSubmission = {
      sessionId: SESSION_ID,
      selectedRestorations: [
        {
          id: RESTORATION_ID,
          name: 'Archival restoration',
          imageUrl,
          selected: true,
        },
      ],
      metadata: {
        title: 'Token-gated contribution',
        description: 'Fixture contribution',
        tags: ['fixture'],
        contributorConsent: true,
      },
    }

    const submit = async payload => {
      const response = await fetch(`${baseUrl}/api/gallery/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return { response, body: await response.json() }
    }

    const missingToken = await submit(baseSubmission)
    assert.equal(missingToken.response.status, 404)
    assert.equal(missingToken.body.error, 'Restoration session not found')

    const invalidToken = await submit({
      ...baseSubmission,
      sessionAccessToken: 'wrong-token',
    })
    assert.equal(invalidToken.response.status, 404)
    assert.equal(invalidToken.body.error, 'Restoration session not found')

    const validToken = await submit({
      ...baseSubmission,
      sessionAccessToken: SESSION_ACCESS_TOKEN,
    })
    assert.equal(validToken.response.status, 200)
    assert.equal(validToken.body.success, true)
    assert.equal(validToken.body.status, 'pending')
    assert.equal(validToken.body.submittedRestorations, 1)

    const unauthorizedQueue = await fetch(
      `${baseUrl}/api/gallery/moderation?status=pending&limit=10`
    )
    assert.equal(unauthorizedQueue.status, 401)

    const moderationQueue = await fetch(
      `${baseUrl}/api/gallery/moderation?status=pending&limit=10`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    )
    const moderationPayload = await moderationQueue.json()
    assert.equal(moderationQueue.status, 200)
    assert.equal(moderationPayload.count, 1)
    assert.equal(moderationPayload.items[0].id, `gallery-${SESSION_ID}`)
    assert.equal(
      moderationPayload.items[0].metadata.title,
      'Token-gated contribution'
    )
    assert.equal(moderationPayload.items[0].photoAnalysis.faceCount, 2)
    assert.equal(
      moderationPayload.items[0].photoAnalysis.faces[1].location,
      'right foreground'
    )

    const publish = await fetch(
      `${baseUrl}/api/gallery?id=gallery-${SESSION_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      }
    )
    const publishPayload = await publish.json()
    assert.equal(publish.status, 200)
    assert.equal(publishPayload.status, 'published')
    assert.equal(publishPayload.isPublic, true)

    const publicGallery = await fetch(`${baseUrl}/api/gallery?limit=10`)
    const publicGalleryPayload = await publicGallery.json()
    assert.equal(publicGallery.status, 200)
    const publishedFixture = publicGalleryPayload.items.find(
      item => item.id === `gallery-${SESSION_ID}`
    )
    assert.ok(publishedFixture)
    assert.equal(publishedFixture.title, 'Token-gated contribution')
    assert.equal('photoAnalysis' in publishedFixture, false)

    const publicAsset = await fetch(
      `${baseUrl}/api/gallery/assets/gallery-${SESSION_ID}/restoration-1.png`
    )
    assert.equal(publicAsset.status, 200)

    console.log('Family contribution pipeline checks passed.')
  } finally {
    if (child) {
      await stopServer(child)
    }
    await rm(dataDirectory, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
