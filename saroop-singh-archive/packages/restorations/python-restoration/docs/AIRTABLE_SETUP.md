# Airtable Setup & Integration Guide

> **Archived reference.** These setup steps target the retired Python/Vercel
> prototype and must not be used against the live archive. See
> [the archive notice](../ARCHIVED.md).

## Overview

The photo restoration system uses Airtable as a content management system (CMS) for organizing restoration workflows, managing prompts, tracking photos, and monitoring system performance.

**Base ID**: `appQpjCUauAy7Ut1Y`

## Table Structure

### 1. PhotoGallery Table (`tbl4GR7nRThBJ9y5Z`)

Stores original images and tracks restoration status.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Name** | Single line text | Photo identifier/name |
| **Original Image** | Attachment | Source image file(s) |
| **Status** | Single select | `Pending`, `Processing`, `Complete`, `Failed` |
| **Restoration Type** | Single select | `Standard`, `Colorization`, `Enhancement`, `Artistic` |
| **Restored Image** | Attachment | Output image file(s) |
| **Processing Time** | Number | Time in seconds |
| **Job ID** | Single line text | API job identifier |
| **Date Added** | Date | When record was created |
| **Last Modified** | Date | Last update timestamp |
| **Description** | Long text | Photo details/metadata |
| **Subject** | Single line text | Main subject of photo |
| **Era** | Single select | `1930s`, `1940s`, `1950s`, etc. |
| **Quality Score** | Number | Generated quality assessment (0-100) |
| **Notes** | Long text | Processing notes/comments |

#### Button Fields (Automations)

| Button | Script | Purpose |
|--------|--------|---------|
| **Process Photo** | `trigger_restoration.js` | Start single photo restoration |
| **Batch Process** | `batch_process.js` | Process multiple photos |
| **Check Status** | `check_status.js` | Update job status |

### 2. Prompts Table (`tblEKjaq3I9yfOg0d`)

Manages restoration prompts and AI model configurations.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Name** | Single line text | Prompt identifier |
| **Category** | Single select | `Restoration`, `Colorization`, `Enhancement`, `Creative`, `Document Processing` |
| **Template** | Long text | Prompt template with `{{variables}}` |
| **Model Config** | Long text | JSON configuration for Gemini |
| **Temperature** | Number | AI creativity setting (0.0-1.0) |
| **Top P** | Number | AI nucleus sampling (0.0-1.0) |
| **Model** | Single select | `understanding`, `generation`, `legacy` |
| **Use Case** | Single line text | When to use this prompt |
| **Priority** | Number | Execution order for sequential processing |
| **Tags** | Multiple select | Searchable metadata tags |
| **Success Rate** | Number | Historical success percentage |
| **Last Used** | Date | Most recent usage |
| **Created By** | Single line text | Prompt author |
| **Version** | Number | Prompt version number |

#### Example Prompt Templates

```text
# Colorization Prompt
Create a photorealistic COLOR image from this vintage black and white photograph.
PRESERVE: {{identity}}, {{facial_expressions}}, {{composition}}
ENHANCE: Natural skin tones, period-appropriate clothing colors, environmental context
TECHNICAL: 6000px resolution, sRGB color space, professional retouching quality
STYLE: Historically accurate colors for {{era}} photography
```

```text
# Enhancement Prompt  
Enhance and restore this vintage photograph to professional modern standards.
REPAIR: Scratches, tears, stains, fading, grain reduction
IMPROVE: Sharpness, contrast, lighting, detail preservation
MAINTAIN: Original composition, authentic character, historical accuracy
OUTPUT: High resolution with natural, realistic enhancement
```

### 3. Workflows Table (`tblJEswt7T25UopXC`)

Defines multi-step restoration workflows.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Name** | Single line text | Workflow identifier |
| **Description** | Long text | Workflow purpose and steps |
| **Steps** | Multiple select | Linked to Prompts table |
| **Step Order** | Long text | JSON array defining sequence |
| **Category** | Single select | Workflow type |
| **Estimated Time** | Number | Expected processing time (minutes) |
| **Success Rate** | Number | Historical success percentage |
| **Use Cases** | Multiple select | When to use this workflow |
| **Active** | Checkbox | Enable/disable workflow |
| **Created Date** | Date | When workflow was created |
| **Last Modified** | Date | Last update timestamp |

#### Example Workflows

**Complete Vintage Restoration**
1. Damage Assessment (`understanding` model)
2. Basic Repair (`generation` model, temp: 0.5)
3. Colorization (`generation` model, temp: 0.4) 
4. Quality Enhancement (`generation` model, temp: 0.6)
5. Final Polish (`generation` model, temp: 0.3)

**Quick Enhancement**
1. Quality Analysis (`understanding` model)
2. Enhancement Only (`generation` model, temp: 0.5)

### 4. Test Runs Table (`tbli5AIwBu8a08yZv`)

Tracks system performance and test results.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Run ID** | Single line text | Unique test identifier |
| **Photo** | Link to PhotoGallery | Source photo record |
| **Prompt Used** | Link to Prompts | Applied prompt |
| **Workflow** | Link to Workflows | Applied workflow |
| **Status** | Single select | `Success`, `Failed`, `Partial` |
| **Execution Time** | Number | Total processing time (seconds) |
| **Model Used** | Single line text | Gemini model version |
| **Temperature** | Number | AI temperature setting used |
| **Quality Score** | Number | Output quality assessment (0-100) |
| **Error Message** | Long text | Failure details if applicable |
| **API Response** | Long text | Full Gemini API response |
| **Created At** | Date | Test execution timestamp |
| **Batch ID** | Single line text | Group related test runs |
| **Performance Metrics** | Long text | JSON with detailed metrics |

## Setup Instructions

### 1. Base Configuration

1. **Create Airtable Account** if you don't have one
2. **Import Base Structure**:
   - Copy base ID: `appQpjCUauAy7Ut1Y`  
   - Or create new base with tables above
3. **Configure API Access**:
   - Generate personal access token
   - Set permissions: `data:read`, `data:write`, `schema:read`

### 2. API Integration Setup

#### Environment Variables

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your-personal-access-token
AIRTABLE_BASE_ID=appQpjCUauAy7Ut1Y

# Table IDs (if creating new base)
PHOTO_GALLERY_TABLE=tbl4GR7nRThBJ9y5Z
PROMPTS_TABLE=tblEKjaq3I9yfOg0d  
WORKFLOWS_TABLE=tblJEswt7T25UopXC
TEST_RUNS_TABLE=tbli5AIwBu8a08yZv
```

#### Rate Limiting

Airtable API limits: **5 requests per second**

The system automatically handles rate limiting with exponential backoff:

```python
# Configured in lib/airtable_client.py
RATE_LIMITS = {
    "requests_per_second": 5,
    "max_retries": 3,
    "backoff_factor": 2.0
}
```

### 3. Automation Scripts Setup

#### Button Field Scripts

Place these in Airtable Extensions > Scripting:

**Single Photo Processing (`trigger_restoration.js`)**

```javascript
// Get current record
let table = base.getTable("PhotoGallery");
let record = await input.recordAsync("Select photo to process", table);

// Trigger processing
let response = await fetch("https://your-api.vercel.app/api/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        base: { id: "appQpjCUauAy7Ut1Y" },
        webhook: { id: "webhook-id" },
        timestamp: new Date().toISOString(),
        changedTablesById: {
            "tbl4GR7nRThBJ9y5Z": {
                createdRecordsById: {
                    [record.id]: {
                        fields: {
                            "Original Image": record.getCellValue("Original Image"),
                            "Restoration Type": record.getCellValue("Restoration Type") || "Standard"
                        }
                    }
                }
            }
        }
    })
});

// Update status
await table.updateRecordAsync(record.id, {
    "Status": "Processing",
    "Job ID": await response.json().job_ids[0]
});
```

**Batch Processing (`batch_process.js`)**

```javascript
let table = base.getTable("PhotoGallery");
let query = await table.selectRecordsAsync({
    sorts: [{ field: "Date Added", direction: "desc" }]
});

// Filter pending records
let pendingRecords = query.records.filter(record => 
    record.getCellValue("Status") === "Pending"
);

// Process in batches of 10
for (let i = 0; i < Math.min(pendingRecords.length, 10); i++) {
    let record = pendingRecords[i];
    
    // Update status
    await table.updateRecordAsync(record.id, {
        "Status": "Processing"
    });
    
    // Trigger processing (same API call as above)
}
```

### 4. Webhook Configuration

#### Create Airtable Webhook

1. Go to base settings > Webhooks
2. Create new webhook:
   - **URL**: `https://your-api.vercel.app/api/webhook`
   - **Tables**: PhotoGallery
   - **Events**: Record created, Record updated

#### Webhook Security

```bash
# Set webhook secret for signature verification
AIRTABLE_WEBHOOK_SECRET=your-webhook-secret-key
```

### 5. Views and Filters

#### Recommended Views

**Processing Dashboard**
- Group by: Status
- Sort by: Date Added (newest first)
- Filter: Show all except deleted

**Performance Tracking**  
- Group by: Restoration Type
- Fields: Name, Processing Time, Quality Score, Success Rate
- Sort by: Quality Score (highest first)

**Failed Jobs**
- Filter: Status = "Failed"
- Fields: Name, Error Message, Last Modified
- Sort by: Last Modified (newest first)

**Ready for Processing**
- Filter: Status = "Pending" AND Original Image is not empty
- Sort by: Date Added (oldest first)

#### Formula Fields

**Success Rate Calculation**
```javascript
// In Test Runs table
IF({Status} = "Success", 1, 0)

// Rollup in PhotoGallery  
AVERAGE(values) * 100
```

**Processing Efficiency**
```javascript
// Quality per second
IF({Processing Time} > 0, {Quality Score} / {Processing Time}, 0)
```

## Usage Examples

### Python Integration

```python
from pyairtable import Api

# Initialize client
api = Api("your-airtable-api-key")
base_id = "appQpjCUauAy7Ut1Y"

# Get photos ready for processing
photos_table = api.table(base_id, "tbl4GR7nRThBJ9y5Z")
photos = photos_table.all(
    filter_by_formula="AND({Status} = 'Pending', {Original Image} != '')"
)

# Process each photo
for photo in photos[:5]:  # Limit to 5 photos
    # Update status
    photos_table.update(photo['id'], {
        "Status": "Processing",
        "Job ID": f"job-{uuid.uuid4()}"
    })
    
    # Trigger restoration workflow
    result = process_photo(photo['fields']['Original Image'][0]['url'])
    
    # Update with results
    photos_table.update(photo['id'], {
        "Status": "Complete",
        "Restored Image": [{"url": result['restored_url']}],
        "Processing Time": result['processing_time'],
        "Quality Score": result['quality_score']
    })
```

### Workflow Automation

```python
# Get workflow definition
workflows_table = api.table(base_id, "tblJEswt7T25UopXC")
workflow = workflows_table.get("recWorkflowID")

# Parse workflow steps
steps = json.loads(workflow['fields']['Step Order'])

# Execute workflow
for step in steps:
    prompt = prompts_table.get(step['prompt_id'])
    result = process_with_prompt(image_url, prompt['fields']['Template'])
    
    # Log test run
    test_runs_table.create({
        "Run ID": f"test-{uuid.uuid4()}",
        "Photo": [photo['id']],
        "Prompt Used": [prompt['id']],
        "Status": "Success" if result['success'] else "Failed",
        "Execution Time": result['time'],
        "Quality Score": result['quality']
    })
```

## Performance Optimization

### Batch Operations

```python
# Update multiple records at once
updates = []
for photo in processing_photos:
    updates.append({
        "id": photo['id'],
        "fields": {"Status": "Complete", "Quality Score": 95}
    })

# Batch update (max 10 records per batch)
for i in range(0, len(updates), 10):
    batch = updates[i:i+10]
    photos_table.batch_update(batch)
```

### Caching Strategies

- Cache prompt templates in memory
- Store frequently used workflow definitions locally
- Use Airtable sync for real-time updates

### Error Handling

```python
import time
from pyairtable.exceptions import RequestTimeoutError

def safe_airtable_operation(operation_func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return operation_func()
        except RequestTimeoutError:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise
```

## Monitoring & Analytics

### Key Metrics

Track these metrics in the Test Runs table:

1. **Success Rate**: `COUNT(Status="Success") / COUNT(total) * 100`
2. **Average Processing Time**: `AVERAGE(Execution Time)`
3. **Quality Distribution**: Group by Quality Score ranges
4. **Model Performance**: Compare success rates by model type
5. **Prompt Effectiveness**: Success rate by prompt category

### Airtable Dashboard

Create interface with:
- Processing status overview
- Recent completions gallery
- Performance metrics charts
- Failed jobs alerts
- System health indicators

### Automated Reports

Set up Airtable automations to:
- Email daily processing summaries
- Alert on high failure rates
- Archive completed records monthly
- Backup critical data weekly

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|--------|----------|
| Rate limit exceeded | Too many requests | Implement exponential backoff |
| Webhook not firing | Invalid URL/signature | Verify endpoint and secret |
| Records not updating | API key permissions | Check token permissions |
| Upload failures | File size limits | Compress images before upload |

### Debug Mode

```bash
# Enable verbose Airtable logging
export AIRTABLE_DEBUG=1
export LOG_LEVEL=debug

python process_workflow_final.py --debug
```

### Data Integrity Checks

```python
# Verify record consistency
def audit_data_integrity():
    photos = photos_table.all()
    for photo in photos:
        # Check for orphaned records
        if photo['fields'].get('Status') == 'Processing':
            # Check if job actually exists
            job_id = photo['fields'].get('Job ID')
            if not check_job_exists(job_id):
                # Reset to pending
                photos_table.update(photo['id'], {"Status": "Pending"})
```

## Migration & Backup

### Data Export

```python
# Export all tables
for table_name, table_id in TABLES.items():
    table = api.table(base_id, table_id)
    records = table.all()
    
    with open(f"backup_{table_name}.json", "w") as f:
        json.dump(records, f, indent=2)
```

### Base Cloning

1. Use Airtable Universe to share base template
2. Script to recreate structure:

```python
def setup_new_base():
    # Create tables with proper field types
    # Import essential prompts and workflows
    # Set up automations
    pass
```

---

**Last Updated**: September 2024  
**Integration Version**: 1.2.0  
**Compatible Airtable Plan**: Team or higher (for webhooks)
