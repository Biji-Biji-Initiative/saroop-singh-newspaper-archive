import 'server-only'

export interface PhotoFaceObservation {
  location: string
  visibility: 'clear' | 'partial' | 'uncertain'
}

/**
 * Private, curator-facing observations about an uploaded photograph. This is
 * deliberately not facial recognition: it never assigns names or infers
 * sensitive personal attributes from an image.
 */
export interface PhotoAnalysis {
  faceCount: number
  faces: PhotoFaceObservation[]
  photoSummary: string
  suggestedTags: string[]
  reviewRequired: true
}

interface GeminiInteractionPart {
  text?: string
}

interface GeminiInteractionResponse {
  output_text?: string
  outputText?: string
  steps?: Array<{
    content?: GeminiInteractionPart[]
  }>
}

const MAX_FACES = 20
const MAX_TAGS = 8
const MAX_SUMMARY_LENGTH = 500
const MAX_LOCATION_LENGTH = 80
const MAX_TAG_LENGTH = 60

const photoAnalysisSchema = {
  type: 'object',
  properties: {
    face_count: { type: 'integer' },
    faces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          visibility: { type: 'string' },
        },
        required: ['location', 'visibility'],
      },
    },
    photo_summary: { type: 'string' },
    suggested_tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['face_count', 'faces', 'photo_summary', 'suggested_tags'],
} as const

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asBoundedText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (
    !normalized ||
    normalized.length > maximumLength ||
    /\u0000/.test(normalized)
  ) {
    return null
  }

  return normalized
}

function outputText(response: GeminiInteractionResponse): string | null {
  const directText = response.output_text ?? response.outputText
  if (typeof directText === 'string' && directText.trim().length > 0) {
    return directText.trim()
  }

  const text = response.steps
    ?.flatMap(step => step.content ?? [])
    .map(part => part.text)
    .find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    )

  return text?.trim() ?? null
}

function normalizeFaces(value: unknown): PhotoFaceObservation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.slice(0, MAX_FACES).flatMap(entry => {
    const face = asRecord(entry)
    const location = asBoundedText(face?.location, MAX_LOCATION_LENGTH)
    const visibility = face?.visibility

    if (!location) {
      return []
    }

    let normalizedVisibility: PhotoFaceObservation['visibility'] = 'uncertain'
    if (
      visibility === 'clear' ||
      visibility === 'partial' ||
      visibility === 'uncertain'
    ) {
      normalizedVisibility = visibility
    }

    return [{ location, visibility: normalizedVisibility }]
  })
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const tags = new Map<string, string>()
  for (const tagValue of value) {
    const tag = asBoundedText(tagValue, MAX_TAG_LENGTH)
    if (tag) {
      tags.set(tag.toLocaleLowerCase(), tag)
    }
  }

  return [...tags.values()].slice(0, MAX_TAGS)
}

export function parsePhotoAnalysis(value: unknown): PhotoAnalysis | null {
  const data = asRecord(value)
  if (!data) {
    return null
  }

  const faces = normalizeFaces(data.faces)
  const reportedFaceCount = data.face_count
  const faceCount =
    typeof reportedFaceCount === 'number' &&
    Number.isInteger(reportedFaceCount) &&
    reportedFaceCount >= 0 &&
    reportedFaceCount <= MAX_FACES
      ? reportedFaceCount
      : faces.length
  const photoSummary = asBoundedText(data.photo_summary, MAX_SUMMARY_LENGTH)

  if (!photoSummary) {
    return null
  }

  return {
    faceCount,
    faces: faces.slice(0, faceCount),
    photoSummary,
    suggestedTags: normalizeTags(data.suggested_tags),
    reviewRequired: true,
  }
}

export async function analyzePhotoWithGemini({
  apiKey,
  model,
  image,
  mimeType,
}: {
  apiKey: string
  model: string
  image: Buffer
  mimeType: string
}): Promise<PhotoAnalysis | null> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            type: 'text',
            text: [
              'Analyse this uploaded historical photograph for a private family archive review queue.',
              'Count only visible human faces and describe their broad image locations.',
              'Never identify, name, or guess who a person is.',
              'Never infer age, gender, ethnicity, health, emotion, relationship, or any other sensitive trait.',
              'If a face is obscured or damaged, mark its visibility as uncertain.',
              'Suggested tags must be neutral visual or archival context only, never names or sensitive characteristics.',
              'These are suggestions for a human curator and must not be published automatically.',
            ].join(' '),
          },
          {
            type: 'image',
            mime_type: mimeType,
            data: image.toString('base64'),
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: photoAnalysisSchema,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  )

  if (!response.ok) {
    console.warn('Gemini photo analysis request failed', {
      status: response.status,
    })
    return null
  }

  const result = (await response.json()) as GeminiInteractionResponse
  const text = outputText(result)
  if (!text) {
    console.warn('Gemini photo analysis result did not include text')
    return null
  }

  try {
    return parsePhotoAnalysis(JSON.parse(text))
  } catch {
    console.warn('Gemini photo analysis result was not valid JSON')
    return null
  }
}
