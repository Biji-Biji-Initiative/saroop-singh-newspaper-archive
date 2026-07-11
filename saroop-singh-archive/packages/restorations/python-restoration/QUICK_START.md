# Quick Start - Image Restoration System

> **Archived reference.** This prototype is not deployed or supported. Do not
> run its public-service or credential setup steps; see [ARCHIVED.md](ARCHIVED.md)
> for the current Coolify/Next.js replacement.

## Running Restorations Locally (Without Airtable Automation)

### 1. Test with Local Images

```bash
# Test with a generated vintage image
python3 test_local.py --create-test --category Restoration

# Test with your own image
python3 test_local.py --image path/to/your/image.jpg --category Enhancement

# Test all processing categories
python3 test_local.py --test-all
```

### 2. Process Images from Airtable

```bash
# Dry run - see what would be processed
python3 run_restoration.py --dry-run

# Process up to 3 pending images
python3 run_restoration.py --limit 3

# Process a specific record
python3 run_restoration.py --record-id rec7CnzWnGgCr2XSn
```

### 3. Batch Processing

```bash
# Process all images in a folder
python3 scripts/airtable_restoration.py

# Preprocess images before uploading
python3 scripts/preprocess.py input_folder/ output_folder/
```

## Processing Categories

- **Restoration**: Remove damage, enhance clarity, preserve authenticity
- **Colorization**: Add historically accurate colors
- **Enhancement**: Improve sharpness and quality
- **Creative Remake**: Modern artistic interpretation
- **Document Processing**: Extract and enhance text/details

## System Test

Verify everything is working:

```bash
python3 test_system.py
```

Expected output:
```
✓ Gemini API connected
✓ Airtable connected
✓ Image processing successful
✓ All categories configured
🎉 All tests passed! System is ready.
```

## Environment Variables

Create `.env` file with:
```
GEMINI_API_KEY=your_api_key_here
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=appQpjCUauAy7Ut1Y
```

## Results

Processed images are saved to:
- Local testing: `/tmp/` directory
- Airtable processing: Updates record status and metadata
- Web uploads: Stored in cloud storage

## Troubleshooting

1. **Module not found errors**: 
   ```bash
   pip3 install --user --break-system-packages -r requirements.txt
   ```

2. **API key issues**: Check `.env` file has correct keys

3. **Rate limits**: System automatically handles rate limiting (2 req/s)

4. **Memory issues**: Reduce image size with preprocess.py first

---

**Using Gemini 2.5 Flash Image (Nano Banana) 🍌**
