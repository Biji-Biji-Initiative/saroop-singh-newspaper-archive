# Airtable Database Setup for Photo Restoration

> **Archived reference.** Do not configure this database or its automations
> against the live archive. It belongs to the retired Python/Vercel prototype;
> see [the archive notice](../ARCHIVED.md).

This document provides detailed instructions for configuring your Airtable PhotoGallery table with all the required fields for photo restoration automation.

## PhotoGallery Table Schema

### Core Fields (Required)

#### 1. Primary Field
- **Field Name**: `Title` or `Photo Name`
- **Type**: Single line text
- **Description**: Name/title of the photo
- **Required**: Yes (Airtable primary field)

#### 2. Image Storage
- **Field Name**: `Photo` or `Image URL`
- **Type**: Attachment (for uploads) OR URL (for external images)
- **Description**: The original photo to be restored
- **Required**: Yes

### Automation Fields (Required)

#### 3. Process Button
```yaml
Field Name: Process
Type: Button
Label: 🔄 Process Photo
Action: Run script
Script: trigger_restoration.js
Description: Triggers individual photo restoration
```

#### 4. Status Tracking
```yaml
Field Name: Status
Type: Single select
Options:
  - Pending (Color: Gray)
  - Queued (Color: Yellow) 
  - Processing (Color: Orange)
  - Complete (Color: Green)
  - Failed (Color: Red)
Default: Pending
Description: Current processing status
```

#### 5. Job Management
```yaml
Field Name: Processing Job ID
Type: Single line text
Description: Unique identifier for tracking the restoration job
Format: UUID string (e.g., "123e4567-e89b-12d3-a456-426614174000")
```

#### 6. Result Storage
```yaml
Field Name: Result URL
Type: URL
Description: URL to the processed/restored image
Validation: Must be valid URL
```

### Processing Fields (Recommended)

#### 7. Restoration Configuration
```yaml
Field Name: Restoration Type
Type: Single select
Options:
  - standard (Default restoration)
  - colorization (Add color to B&W photos)
  - enhancement (Improve quality/clarity)
  - artistic (Creative restoration)
Default: standard
Description: Type of restoration to apply
```

#### 8. Error Handling
```yaml
Field Name: Error Message
Type: Long text
Description: Error details if processing fails
Rich text: No
```

#### 9. Timing Fields
```yaml
Field Name: Processing Started
Type: Date
Include time: Yes
Time zone: Local
Description: When processing began

Field Name: Processing Completed  
Type: Date
Include time: Yes
Time zone: Local
Description: When processing finished

Field Name: Last Updated
Type: Date
Include time: Yes
Time zone: Local
Auto-fill: Current time
Description: Last modification timestamp
```

### Metadata Fields (Optional)

#### 10. Photo Information
```yaml
Field Name: Description
Type: Long text
Description: Description of the photo content

Field Name: Date Taken
Type: Date
Include time: Optional
Description: When the original photo was taken

Field Name: Source
Type: Single select
Options:
  - Family Archive
  - Historical Collection
  - Personal Collection
  - Unknown
Description: Origin of the photo
```

#### 11. Technical Fields
```yaml
Field Name: Processing Progress
Type: Percent
Format: 0-100%
Description: Completion percentage (if supported by API)

Field Name: Estimated Completion
Type: Date
Include time: Yes
Description: Expected completion time

Field Name: Last API Response
Type: Long text
Description: Raw API response for debugging
Rich text: No
```

### Batch Processing Fields

#### 12. Batch Controls
```yaml
Field Name: Batch Process
Type: Button
Label: 🚀 Batch Process
Action: Run script
Script: batch_process.js
Description: Process multiple photos at once

Field Name: Update Status
Type: Button
Label: 📊 Update Status
Action: Run script  
Script: update_status.js
Description: Check and update job statuses
```

#### 13. Batch Metadata
```yaml
Field Name: Batch ID
Type: Single line text
Description: Groups photos processed together

Field Name: Priority
Type: Single select
Options:
  - Low
  - Medium
  - High
  - Urgent
Default: Medium
Description: Processing priority
```

## Views Configuration

### 1. Processing Queue View
```yaml
Name: Processing Queue
Filter: Status is "Pending" OR Status is "Queued"
Sort: Priority (Z→A), then Last Updated (oldest first)
Fields: Title, Photo, Status, Priority, Process Button
```

### 2. In Progress View
```yaml
Name: In Progress
Filter: Status is "Processing"
Sort: Processing Started (newest first)
Fields: Title, Status, Processing Job ID, Processing Started, Update Status Button
```

### 3. Completed View
```yaml
Name: Completed
Filter: Status is "Complete"
Sort: Processing Completed (newest first)
Fields: Title, Photo, Result URL, Processing Completed
```

### 4. Failed Jobs View
```yaml
Name: Failed Jobs
Filter: Status is "Failed"
Sort: Last Updated (newest first)
Fields: Title, Status, Error Message, Last Updated, Process Button
```

### 5. All Photos Grid
```yaml
Name: All Photos
Filter: None
Sort: Last Updated (newest first)
Fields: Title, Photo, Status, Result URL, Last Updated
```

## Automation Setup

### 1. Status Change Automation
```yaml
Name: Update Processing Timestamps
Trigger: When record updated
Conditions: 
  - Status changes to "Processing" → Update "Processing Started"
  - Status changes to "Complete" → Update "Processing Completed"
  - Any status change → Update "Last Updated"
Action: Update record
```

### 2. Notification Automation
```yaml
Name: Completion Notifications
Trigger: When record updated
Conditions: Status changes to "Complete"
Action: Send email/Slack notification
Content: "Photo restoration completed: {Title} - View result: {Result URL}"
```

### 3. Failed Job Alerts
```yaml
Name: Failed Job Alerts
Trigger: When record updated
Conditions: Status changes to "Failed"
Action: Send notification
Content: "Photo restoration failed: {Title} - Error: {Error Message}"
```

## Field Dependencies

### Required for Basic Operation
- `Title` (Primary field)
- `Photo` or `Image URL`
- `Process` button
- `Status`
- `Processing Job ID`
- `Result URL`

### Required for Status Updates
- `Error Message`
- `Last Updated`

### Required for Batch Processing
- All basic operation fields
- `Batch Process` button
- `Update Status` button

### Nice to Have
- `Restoration Type`
- `Processing Started/Completed`
- `Description`
- `Date Taken`

## Import/Export Templates

### CSV Import Template
```csv
Title,Description,Date Taken,Photo,Status,Restoration Type
"Family Portrait 1950s","Group photo of extended family","1955-01-01","https://example.com/photo1.jpg","Pending","standard"
"Wedding Photo","Vintage wedding photograph","1960-06-15","https://example.com/photo2.jpg","Pending","colorization"
```

### Airtable Base Template
Use the following JSON structure to create fields programmatically via API:

```json
{
  "fields": [
    {
      "name": "Title",
      "type": "singleLineText"
    },
    {
      "name": "Status",
      "type": "singleSelect",
      "options": {
        "choices": [
          {"name": "Pending", "color": "grayLight2"},
          {"name": "Queued", "color": "yellowLight2"},
          {"name": "Processing", "color": "orangeLight2"},
          {"name": "Complete", "color": "greenLight2"},
          {"name": "Failed", "color": "redLight2"}
        ]
      }
    },
    {
      "name": "Processing Job ID",
      "type": "singleLineText"
    },
    {
      "name": "Result URL",
      "type": "url"
    },
    {
      "name": "Process",
      "type": "button"
    }
  ]
}
```

## Validation Rules

### Data Validation
1. **Photo/Image URL**: Must contain valid image file or URL
2. **Status**: Must be one of the defined options
3. **Processing Job ID**: Should be UUID format when present
4. **Result URL**: Must be valid URL when present

### Business Rules
1. Cannot process without Photo/Image URL
2. Job ID should be unique across all records
3. Status should progress logically: Pending → Queued → Processing → Complete/Failed
4. Result URL should only be populated when Status is "Complete"

## Performance Considerations

### Indexing
- Create indexes on frequently filtered fields:
  - Status
  - Processing Job ID
  - Last Updated
  - Batch ID

### Record Limits
- Batch processing: Limit to 50-100 records per batch
- Concurrent jobs: Max 5-10 simultaneous processing jobs
- API rate limits: Respect Airtable's 5 requests per second limit

### Cleanup Strategy
- Archive completed jobs older than 6 months
- Delete failed jobs after manual review
- Maintain audit log of all processing activities

This database setup provides a robust foundation for automated photo restoration with full tracking, error handling, and batch processing capabilities.
