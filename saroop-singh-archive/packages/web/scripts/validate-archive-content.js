#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const matter = require('gray-matter')

const CONTENT_DIRECTORY = path.resolve(
  __dirname,
  '../../../content/articles/published'
)
const SAFE_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,180}$/
const TEXT_FIELDS = [
  ['title', 160, true],
  ['date_text', 120, false],
  ['source', 200, false],
  ['publication', 160, false],
  ['location', 160, false],
  ['category', 80, false],
  ['image', 300, false],
  ['permalink', 300, false],
]
const LIST_FIELDS = [
  ['people', 80],
  ['events', 80],
  ['tags', 80],
]

function recordError(errors, fileName, message) {
  errors.push(`${fileName}: ${message}`)
}

function isValidCalendarDate(value) {
  if (value === 'unknown') {
    return true
  }

  const normalized =
    value instanceof Date ? value.toISOString().slice(0, 10) : value
  if (
    typeof normalized !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized)
  ) {
    return false
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === normalized
  )
}

function validateArticle(fileName, errors) {
  const slug = fileName.slice(0, -'.md'.length)
  if (!SAFE_SLUG.test(slug)) {
    recordError(errors, fileName, 'filename must be a safe archive slug')
    return
  }

  let parsed
  try {
    parsed = matter(
      fs.readFileSync(path.join(CONTENT_DIRECTORY, fileName), 'utf8')
    )
  } catch (error) {
    recordError(
      errors,
      fileName,
      `frontmatter could not be parsed (${error instanceof Error ? error.message : String(error)})`
    )
    return
  }

  const { data, content } = parsed
  if (!content.trim()) {
    recordError(errors, fileName, 'article body cannot be empty')
  }

  for (const [fieldName, maximumLength, required] of TEXT_FIELDS) {
    const value = data[fieldName]
    if (value === undefined || value === null || value === '') {
      if (required) {
        recordError(errors, fileName, `${fieldName} is required`)
      }
      continue
    }

    if (typeof value !== 'string' || !value.trim()) {
      recordError(errors, fileName, `${fieldName} must be non-empty text`)
      continue
    }

    if (value.length > maximumLength) {
      recordError(
        errors,
        fileName,
        `${fieldName} must be ${maximumLength} characters or fewer`
      )
    }
  }

  if (data.date !== undefined && !isValidCalendarDate(data.date)) {
    recordError(errors, fileName, 'date must be YYYY-MM-DD or "unknown"')
  }

  if (
    typeof data.image === 'string' &&
    data.image.length > 0 &&
    !data.image.startsWith('/')
  ) {
    recordError(errors, fileName, 'image must use a site-relative path')
  }

  for (const [fieldName, maximumLength] of LIST_FIELDS) {
    const value = data[fieldName]
    if (value === undefined) {
      continue
    }

    if (!Array.isArray(value)) {
      recordError(
        errors,
        fileName,
        `${fieldName} must be a list of text values`
      )
      continue
    }

    value.forEach((entry, index) => {
      if (typeof entry !== 'string' || !entry.trim()) {
        recordError(
          errors,
          fileName,
          `${fieldName}[${index}] must be non-empty text`
        )
      } else if (entry.length > maximumLength) {
        recordError(
          errors,
          fileName,
          `${fieldName}[${index}] must be ${maximumLength} characters or fewer`
        )
      }
    })
  }
}

if (!fs.existsSync(CONTENT_DIRECTORY)) {
  console.error(`Archive content directory not found: ${CONTENT_DIRECTORY}`)
  process.exit(1)
}

const articleFiles = fs
  .readdirSync(CONTENT_DIRECTORY, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  .map(entry => entry.name)
  .filter(fileName => fileName !== 'README.md')
  .sort()

const errors = []
for (const fileName of articleFiles) {
  validateArticle(fileName, errors)
}

if (errors.length > 0) {
  console.error(
    `Archive content validation failed with ${errors.length} issue(s):`
  )
  errors.forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

console.log(
  `Archive content is valid (${articleFiles.length} published article(s)).`
)
