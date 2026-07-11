# API Reference - Photo Restoration System

> **Archived reference.** The API below is the retired Python/Vercel contract,
> not the live archive API. Do not integrate against it; see
> [the archive notice](../ARCHIVED.md).

## Overview

The Saroop Singh Archive Photo Restoration API provides endpoints for automated vintage photograph restoration using Gemini 2.5 Flash. The API is deployed on Vercel and integrates with Airtable for workflow management.

**Base URL**: `https://your-deployment.vercel.app`

## Authentication

API endpoints use environment variable authentication:
- Gemini API key for AI processing
- Airtable API key for data management  
- Redis URL for job queuing
- Cloudinary credentials for image storage

## Endpoints

### POST /api/process

Main endpoint for processing image restoration requests. Supports both single image and batch processing.

#### Request

```http
POST /api/process
Content-Type: application/json

{
  "image_url": "string",
  "restoration_type": "standard|colorization|enhancement|artistic", 
  "metadata": {
    "description": "string",
    "date_taken": "string",
    "subject": "string"
  },
  "batch": boolean,
  "workflow": "string"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_url` | string | Yes | URL of the image to restore |
| `restoration_type` | string | No | Type of restoration (default: "standard") |
| `metadata` | object | No | Additional image metadata |
| `batch` | boolean | No | Process multiple images (default: false) |
| `workflow` | string | No | Predefined workflow name from Airtable |

#### Restoration Types

- **standard**: Basic damage repair and quality improvement
- **colorization**: Add realistic colors to black & white photos  
- **enhancement**: Advanced quality improvement with professional retouching
- **artistic**: Creative restoration with enhanced dramatic effects

#### Response

```json
{
  "success": true,
  "job_id": "uuid-string",
  "result": {
    "original_url": "string",
    "restored_url": "string", 
    "processing_time": "float",
    "restoration_type": "string"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### POST /api/webhook

Airtable webhook endpoint for automated processing when records are created or updated.

#### Request

```http
POST /api/webhook
Content-Type: application/json
X-Airtable-Signature: webhook-signature

{
  "base": {
    "id": "appQpjCUauAy7Ut1Y"
  },
  "webhook": {
    "id": "webhook-id"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "changedTablesById": {
    "tbl4GR7nRThBJ9y5Z": {
      "createdRecordsById": {
        "recXXXXXXXXXXXXXX": {
          "fields": {
            "Original Image": [{"url": "https://example.com/photo.jpg"}],
            "Restoration Type": "colorization"
          }
        }
      }
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "processed_records": 1,
  "job_ids": ["uuid-string"]
}
```

### GET /api/status

Check processing status of jobs. Supports individual job status, batch status, and queue statistics.

#### Request

```http
GET /api/status?job_id=uuid-string
GET /api/status?stats=queue
GET /api/status?batch_id=batch-uuid
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | string | Individual job status |
| `batch_id` | string | Batch job status |
| `stats` | string | Queue statistics ("queue", "performance") |

#### Response - Job Status

```json
{
  "job_id": "uuid-string",
  "status": "processing|complete|failed",
  "progress": 75,
  "created_at": "2024-01-01T00:00:00.000Z",
  "processing_time": 45.2,
  "result": {
    "original_url": "string",
    "restored_url": "string",
    "restoration_type": "colorization"
  }
}
```

#### Response - Queue Statistics

```json
{
  "queue_stats": {
    "active_jobs": 5,
    "pending_jobs": 12,
    "completed_today": 47,
    "failed_today": 2,
    "average_processing_time": 38.5
  },
  "performance": {
    "success_rate": 95.8,
    "total_processed": 1247,
    "total_errors": 52
  }
}
```

### POST /api/restore

Direct restoration endpoint with base64 image upload support.

#### Request

```http
POST /api/restore
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...",
  "prompt": "Restore and enhance this vintage photograph",
  "category": "Restoration|Colorization|Enhancement|Creative"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | string | Yes | Base64 encoded image data |
| `prompt` | string | No | Custom restoration prompt |
| `category` | string | No | Restoration category (default: "Restoration") |

#### Response

```json
{
  "success": true,
  "result": {
    "restored_image": "base64-encoded-result",
    "processing_time": 32.1,
    "model_used": "gemini-2.5-flash-image-preview"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_IMAGE_URL` | Image URL is invalid or inaccessible |
| `UNSUPPORTED_FORMAT` | Image format not supported |
| `PROCESSING_FAILED` | AI processing failed |
| `QUEUE_FULL` | Processing queue is at capacity |
| `RATE_LIMITED` | Too many requests, please retry later |
| `INVALID_WEBHOOK` | Webhook signature verification failed |
| `JOB_NOT_FOUND` | Requested job ID does not exist |

## Rate Limits

- **API Requests**: 100 requests per minute per IP
- **Gemini Processing**: 2 requests per second (automatically managed)
- **Airtable Operations**: 5 requests per second (automatically managed)
- **File Uploads**: 50MB maximum file size

## Webhooks

### Airtable Webhook Configuration

1. Create webhook in Airtable base settings
2. Set URL: `https://your-deployment.vercel.app/api/webhook`
3. Configure for PhotoGallery table changes
4. Set webhook secret in environment variables

### Webhook Signature Verification

```javascript
// Example signature verification
const crypto = require('crypto');
const signature = request.headers['x-airtable-signature'];
const body = JSON.stringify(request.body);
const expectedSignature = crypto
  .createHmac('sha256', process.env.AIRTABLE_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
```

## SDK Examples

### JavaScript/Node.js

```javascript
// Process single image
const response = await fetch('/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/vintage-photo.jpg',
    restoration_type: 'colorization',
    metadata: {
      description: 'Family portrait from 1950s',
      subject: 'Saroop Singh family'
    }
  })
});

const result = await response.json();
console.log('Job ID:', result.job_id);

// Check status
const statusResponse = await fetch(`/api/status?job_id=${result.job_id}`);
const status = await statusResponse.json();
console.log('Status:', status.status);
console.log('Progress:', status.progress + '%');
```

### Python

```python
import requests
import time

# Process image
response = requests.post('https://your-api.vercel.app/api/process', json={
    'image_url': 'https://example.com/vintage-photo.jpg',
    'restoration_type': 'enhancement',
    'metadata': {
        'description': 'Athletic event photo',
        'date_taken': '1937-07-19'
    }
})

result = response.json()
job_id = result['job_id']

# Poll for completion
while True:
    status_response = requests.get(f'https://your-api.vercel.app/api/status?job_id={job_id}')
    status = status_response.json()
    
    if status['status'] == 'complete':
        print(f"Restored image: {status['result']['restored_url']}")
        break
    elif status['status'] == 'failed':
        print(f"Processing failed: {status.get('error', 'Unknown error')}")
        break
    
    time.sleep(5)  # Wait 5 seconds before next check
```

### cURL

```bash
# Process image
curl -X POST https://your-api.vercel.app/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "restoration_type": "colorization"
  }'

# Check status
curl -X GET "https://your-api.vercel.app/api/status?job_id=abc-123-def"

# Get queue stats
curl -X GET "https://your-api.vercel.app/api/status?stats=queue"
```

## Environment Variables

Required environment variables for deployment:

```bash
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_API_KEY=your-gemini-api-key  # Alternative key name

# Airtable
AIRTABLE_API_KEY=your-airtable-key  
AIRTABLE_BASE_ID=appQpjCUauAy7Ut1Y
AIRTABLE_WEBHOOK_SECRET=your-webhook-secret

# Redis Queue
REDIS_URL=redis://localhost:6379

# Image Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Optional
DEBUG=true  # Enable verbose logging
MAX_CONCURRENT_JOBS=5  # Limit concurrent processing
```

## Production Deployment

### Vercel Configuration

```json
{
  "functions": {
    "api/process.py": { "maxDuration": 300 },
    "api/restore.py": { "maxDuration": 180 },
    "api/webhook.py": { "maxDuration": 60 },
    "api/status.py": { "maxDuration": 30 }
  },
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "AIRTABLE_API_KEY": "@airtable-api-key",
    "REDIS_URL": "@redis-url"
  }
}
```

### Performance Monitoring

Monitor these metrics in production:
- Request latency per endpoint
- Processing success/failure rates
- Queue depth and processing times
- API rate limit usage
- Error frequency by type

### Scaling Considerations

- Use Redis cluster for high-volume processing
- Configure Cloudinary auto-scaling for image storage
- Monitor Gemini API quotas and request limits
- Implement circuit breaker for external API failures

---

**Last Updated**: September 2024  
**API Version**: 1.0.0  
**Contact**: See project documentation for support
