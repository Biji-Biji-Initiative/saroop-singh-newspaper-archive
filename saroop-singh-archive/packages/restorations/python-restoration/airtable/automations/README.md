# Airtable Automation Setup Guide

> **Archived reference.** These automation instructions target retired
> endpoints and must not be connected to the live archive. See
> [the archive notice](../../ARCHIVED.md).

This guide walks you through setting up Airtable automations and button fields to integrate with the Saroop Singh Archive Photo Restoration API.

## Prerequisites

- An Airtable base with a PhotoGallery table
- A deployed Vercel API (from the restorations package)
- Admin access to your Airtable base

## Database Schema Updates

First, you need to add the following fields to your PhotoGallery table:

### Required Fields

1. **Process Button** (Button field)
   - Field name: `Process`
   - Action: Run script
   - Script: Use `trigger_restoration.js`

2. **Status** (Single select field)
   - Field name: `Status`
   - Options:
     - `Pending` (Gray)
     - `Processing` (Orange)
     - `Complete` (Green)
     - `Failed` (Red)
     - `Queued` (Yellow)

3. **Result URL** (URL field)
   - Field name: `Result URL`
   - Description: URL to the processed/restored image

4. **Processing Job ID** (Single line text field)
   - Field name: `Processing Job ID`
   - Description: Unique identifier for tracking the restoration job

### Optional but Recommended Fields

5. **Error Message** (Long text field)
   - Field name: `Error Message`
   - Description: Error details if processing fails

6. **Processing Started** (Date field)
   - Field name: `Processing Started`
   - Include time: Yes

7. **Processing Completed** (Date field)
   - Field name: `Processing Completed`
   - Include time: Yes

8. **Last Updated** (Date field)
   - Field name: `Last Updated`
   - Include time: Yes

9. **Restoration Type** (Single select field)
   - Field name: `Restoration Type`
   - Options:
     - `standard`
     - `colorization`
     - `enhancement`
     - `artistic`

10. **Last API Response** (Long text field)
    - Field name: `Last API Response`
    - Description: Raw API response for debugging

## Script Setup

### 1. Individual Photo Processing

1. Create a **Button field** in your PhotoGallery table
2. Set the button label to "🔄 Process Photo"
3. Choose "Run script" as the action
4. Copy the contents of `scripts/trigger_restoration.js`
5. Update the `API_BASE_URL` variable to match your deployed Vercel app
6. Save the script

### 2. Batch Processing

1. Create another **Button field** (or add to a dashboard)
2. Set the button label to "🚀 Batch Process"
3. Choose "Run script" as the action
4. Copy the contents of `scripts/batch_process.js`
5. Update the `API_BASE_URL` variable
6. Adjust batch size and concurrency settings if needed
7. Save the script

### 3. Status Updates

1. Create a third **Button field** for status checking
2. Set the button label to "📊 Update Status"
3. Choose "Run script" as the action
4. Copy the contents of `scripts/update_status.js`
5. Update the `API_BASE_URL` variable
6. Save the script

## Webhook Setup (Automatic Updates)

For real-time status updates, set up a webhook:

1. In Airtable, go to Automations
2. Create a new automation
3. Trigger: "When record matches conditions"
   - Table: PhotoGallery
   - Conditions: When `Status` is `Processing`
4. Action: "Run script"
   - Use a modified version of `update_status.js` for webhook context

### Alternative: External Webhook

Configure your Vercel API webhook endpoint in Airtable:

1. Go to your Airtable base settings
2. Navigate to Webhooks
3. Create a new webhook
4. URL: `https://your-vercel-app.vercel.app/api/webhook`
5. Events: Record created, Record updated
6. Include cell values in payload: Yes

## Environment Configuration

Make sure your Vercel API has the following environment variables:

```bash
# Airtable Configuration
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_API_KEY=your_api_key
AIRTABLE_TABLE_NAME=PhotoGallery

# API Configuration
GEMINI_API_KEY=your_gemini_key
REDIS_URL=your_redis_url (optional, for job queuing)

# Storage Configuration (choose one)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
# OR
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket
```

## Usage Workflow

### Single Photo Processing

1. Navigate to a photo record in your PhotoGallery table
2. Click the "🔄 Process Photo" button
3. The script will:
   - Update the status to "Processing"
   - Send the request to your API
   - Update the record with a Job ID
4. Use the "📊 Update Status" button to check progress

### Batch Processing

1. Click the "🚀 Batch Process" button
2. The script will:
   - Find all pending photos (no status or "Pending" status)
   - Process them in batches with rate limiting
   - Update each record with job IDs and status
3. Monitor progress with the status update script

### Status Monitoring

1. Click the "📊 Update Status" button
2. Choose to update all processing jobs or check a specific Job ID
3. The script will query the API and update record statuses
4. Completed jobs will have their Result URL populated

## Troubleshooting

### Common Issues

1. **API URL not set**: Update the `API_BASE_URL` in all scripts
2. **Missing fields**: Ensure all required fields exist in your table
3. **Permissions**: Verify script permissions allow record updates
4. **Rate limits**: Adjust batch sizes if hitting API limits

### Error Handling

- Failed requests are logged in the "Error Message" field
- The "Last API Response" field contains raw API responses for debugging
- Check the Airtable script logs for detailed error information

### API Endpoints

Your API should respond to:
- `POST /api/process` - Start restoration job
- `GET /api/status?job_id=xxx` - Check job status
- `POST /api/webhook` - Receive status updates

## Best Practices

1. **Test with a few records first** before running batch operations
2. **Monitor API quotas** and adjust batch sizes accordingly
3. **Set up notifications** for completed restorations
4. **Regular status updates** - run the status check script periodically
5. **Backup your data** before making large batch changes

## Support

If you encounter issues:
1. Check the Airtable script execution logs
2. Verify your API is deployed and accessible
3. Ensure all required environment variables are set
4. Test API endpoints manually with a tool like Postman
5. Check the API logs in Vercel for error details

## Example Automation Workflow

```
Photo Upload → Status: "Pending"
       ↓
Click "Process Photo" Button → Status: "Processing" + Job ID assigned
       ↓
API processes in background
       ↓
Click "Update Status" Button → Status: "Complete" + Result URL populated
       ↓
View restored photo via Result URL
```

This setup provides a complete workflow for managing photo restoration through Airtable with full automation capabilities.
