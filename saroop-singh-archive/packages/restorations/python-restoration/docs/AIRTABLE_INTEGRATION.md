# Airtable Integration - Legacy Documentation

> **Archived reference.** This integration belongs to the retired
> Python/Vercel prototype and must not be configured for the live archive. See
> [the archive notice](../ARCHIVED.md).

> **⚠️ DEPRECATED**: This document contains outdated information. Please refer to [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md) for current setup instructions.

## Overview

This document describes the legacy Airtable integration. The system now uses **Gemini 2.5 Flash** (not Gemini Nano) and `process_workflow_final.py` as the production workflow.

## System Architecture

```
Airtable Database
├── Prompts Table (tblEKjaq3I9yfOg0d)
│   ├── Prompt Templates
│   ├── Model Configurations
│   └── Workflow Metadata
├── PhotoGallery Table (tbl4GR7nRThBJ9y5Z)
│   └── Original Images
├── Test Runs Table (tbli5AIwBu8a08yZv)
│   └── Execution Logs
└── Workflows Table (tblJEswt7T25UopXC)
    └── Multi-step Pipelines

         ↓ API Integration ↓

Python Processing Pipeline
├── airtable_restoration.py
│   ├── AirtableClient (Rate-limited API)
│   ├── GeminiProcessor (Gemini Nano)
│   └── RestorationPipeline
└── Output: generated/airtable_restorations/
```

## Features

### 1. **Rate Limiting**
- Airtable API: 5 requests/second
- Gemini API: 2 requests/second
- Automatic throttling to prevent rate limit errors

### 2. **Processing Modes**

#### Standalone Mode
Process individual prompts independently:
```bash
python airtable_restoration.py --mode standalone --use-case "Color Restoration"
```

#### Sequential Mode
Chain prompts where output of one feeds into the next:
```bash
python airtable_restoration.py --mode sequential --use-case "Modern Remake"
```

#### Workflow Mode
Execute pre-defined workflows from Airtable:
```bash
python airtable_restoration.py --mode workflow --workflow "Complete Vintage Photo Restoration"
```

### 3. **Prompt Management**

Prompts are stored in Airtable with:
- **Template**: Clean text with `{{variables}}`
- **Model Config**: JSON parameters for Gemini
- **Use Case**: Categorization (Color Restoration, Modern Remake, etc.)
- **Execution Priority**: Order for sequential processing
- **Tags**: Searchable metadata

Example prompt template:
```
Create a photorealistic COLOR image from vintage photo.
PRESERVE: {{identity}}, {{expressions}}, {{composition}}
ENHANCE: Micro-textures, warm tones, soft depth
Output: 6000px+ sRGB with cinematic polish
```

### 4. **Workflow Definitions**

Workflows link multiple prompts for complex processing:

| Workflow | Steps | Description |
|----------|-------|-------------|
| Complete Restoration | 1. Damage Repair<br>2. Color Restoration<br>3. Enhancement | Full pipeline from damaged to enhanced |
| Creative Remake | 1. Basic Restoration<br>2. Modern Reshoot<br>3. Cinematic Polish | Artistic reinterpretation |
| Document Processing | 1. Transcription<br>2. Quality Check | For newspaper clippings |

## API Configuration

### Environment Variables
```bash
# .env file
AIRTABLE_API_KEY="your_airtable_api_key_here"
GOOGLE_API_KEY="your-gemini-api-key"
```

### Airtable Base Structure
- Base ID: `appQpjCUauAy7Ut1Y`
- Prompts Table: `tblEKjaq3I9yfOg0d`
- PhotoGallery Table: `tbl4GR7nRThBJ9y5Z`
- Test Runs Table: `tbli5AIwBu8a08yZv`
- Workflows Table: `tblJEswt7T25UopXC`

## Usage Examples

### 1. Process Single Photo with Color Restoration
```bash
python airtable_restoration.py \
  --mode standalone \
  --use-case "Color Restoration" \
  --photo-limit 1
```

### 2. Run Sequential Enhancement Pipeline
```bash
python airtable_restoration.py \
  --mode sequential \
  --use-case "Modern Remake" \
  --photo-limit 5
```

### 3. Execute Complete Workflow
```bash
python airtable_restoration.py \
  --mode workflow \
  --workflow "Complete Vintage Photo Restoration" \
  --photo-limit 10
```

### 4. Test Specific Prompts
```bash
python airtable_restoration.py \
  --mode standalone \
  --prompt-limit 2 \
  --photo-limit 1
```

## AI Model Configuration (Legacy)

The legacy system used Gemini 2.0 Flash Experimental. **Current system uses Gemini 2.5 Flash** - see [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md) for updated configuration.

### Model Parameters
```json
{
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 1000,
  "safety_settings": "BLOCK_NONE"
}
```

### Image Processing
- Input: Original photos from Airtable attachments
- Output: High-resolution restored images
- Format: PNG with transparency support
- Resolution: 6000px+ on longest edge

## Prompt Chaining Strategy

For sequential processing, the system:
1. Downloads original image from Airtable
2. Processes with first prompt
3. Uses output as input for next prompt
4. Continues chain until completion
5. Saves all intermediate results

### Chain Example: Vintage to Modern
```
Original B&W Photo
    ↓ [Damage Repair]
Repaired B&W Photo
    ↓ [Color Restoration]
Colorized Photo
    ↓ [Modern Remake]
Modern High-Res Photo
    ↓ [Cinematic Enhancement]
Final Cinematic Image
```

## Test Tracking

All executions are logged to the Test Runs table with:
- Run ID (unique identifier)
- Prompt used
- Execution time
- Success/failure status
- Quality scores (when evaluated)
- API responses

## Performance Optimization

### Batch Processing
- Process multiple photos in parallel
- Respect rate limits automatically
- Cache intermediate results

### Error Handling
- Graceful failure with logging
- Retry logic for transient errors
- Skip to next photo on permanent failure

## Quality Evaluation

Success criteria for each prompt type:

| Use Case | Identity Match | Composition | Color Quality | Detail Level |
|----------|---------------|-------------|---------------|--------------|
| Color Restoration | 95% | 98% | Natural | High |
| Modern Remake | 95% | 95% | Contemporary | Forensic |
| Creative Reimagining | 90% | 90% | Artistic | High |
| 3D Reconstruction | 85% | 95% | Accurate | Very High |

## Monitoring & Analytics

### Dashboard Metrics
- Total restorations completed
- Average execution time per prompt
- Success rate by prompt type
- Most effective prompt combinations

### Performance Tracking
```sql
-- Airtable formula for success rate
COUNTIF({Success}, TRUE()) / COUNTA({Run ID})

-- Average execution time
AVERAGE({Execution Time (s)})
```

## Best Practices

### 1. **Prompt Design**
- Keep templates concise and clear
- Use variables for customization
- Test with diverse image types

### 2. **Workflow Organization**
- Start with damage repair
- Progress to enhancement
- End with artistic touches

### 3. **Rate Limit Management**
- Batch similar operations
- Use off-peak hours for large jobs
- Monitor API usage dashboard

### 4. **Quality Control**
- Review outputs regularly
- Adjust prompts based on results
- Track performance metrics

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Rate limit errors | Reduce requests_per_second in code |
| Low quality outputs | Adjust temperature and prompt specificity |
| Chain interruption | Check intermediate outputs, adjust workflow |
| Memory issues | Process smaller batches |

### Debug Mode
```bash
# Enable verbose logging
export DEBUG=1
python airtable_restoration.py --mode standalone --photo-limit 1
```

## Future Enhancements

1. **Auto-evaluation**: Implement computer vision metrics
2. **A/B Testing**: Compare prompt variations
3. **Smart Routing**: Choose prompts based on image analysis
4. **Result Caching**: Store and reuse successful outputs
5. **Web Interface**: Build UI for non-technical users

## API Reference

### AirtableClient Methods
```python
client = AirtableClient()
records = client.get_records(table_id, filter_formula)
record = client.get_record(table_id, record_id)
new_record = client.create_record(table_id, fields)
updated = client.update_record(table_id, record_id, fields)
```

### GeminiProcessor Methods
```python
processor = GeminiProcessor()
image = processor.download_image(url)
response, time = processor.process_image(url, prompt, variables)
images = processor.extract_images(response)
```

### RestorationPipeline Methods
```python
pipeline = RestorationPipeline()
prompts = pipeline.get_prompts(use_case, workflow_type)
photos = pipeline.get_photos(limit)
results = pipeline.run_prompt_chain(photo, prompts)
pipeline.process_workflow(workflow_name, photo_limit)
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Airtable data integrity
3. Verify API keys are valid
4. Check rate limit compliance

---

*Last Updated: December 2024*
*Version: 1.0.0*
