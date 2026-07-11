# ADK Restoration System

> **Research-only prototype.** This code is not connected to the public
> archive, is not deployed, and must never receive production credentials or
> family uploads. The supported production path is
> `packages/web /restore -> POST /api/restore -> Gemini -> durable /data`.
> Treat this folder as historical source material pending a separately reviewed
> design; do not run its server, Airtable workflow, or setup steps for archive
> operations.

A multi-agent AI restoration system for vintage photographs using Google's Gemini 2.5 Flash with structured outputs and Airtable integration.

## 🚀 Features

- **Multi-Agent Architecture**: Specialized AI agents for analysis, planning, editing, and validation
- **Airtable Integration**: Seamless workflow management with photo gallery and test tracking
- **Structured Outputs**: Deterministic JSON responses using Gemini's structured generation
- **Comprehensive Testing**: Built-in test runner with full pipeline validation
- **RESTful API**: Express.js server with endpoints for processing single photos or batches
- **Quality Assurance**: Built-in validation and quality scoring system

## 🏗️ Architecture

### Core Agents

1. **AnalysisAgent**: Analyzes image condition, defects, content, and technical details
2. **PlannerAgent**: Creates restoration strategies based on analysis results
3. **EditorAgent**: Performs actual image editing using AI prompts
4. **ValidatorAgent**: Validates restoration quality and provides recommendations
5. **OrchestratorAgent**: Coordinates the entire restoration pipeline

### Utilities

- **AirtableManager**: Handles all Airtable operations and data management
- **FileManager**: Manages image downloads, uploads, and processing

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Google Gemini API key
- Airtable API key and base access
- NPM package manager

## ⚙️ Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   The `.env` file should contain:
   ```env
   # Gemini API Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Airtable Configuration  
   AIRTABLE_API_KEY=your_airtable_api_key_here
   AIRTABLE_BASE_ID=your_airtable_base_id_here
   
   # Agent Configuration
   MAX_RETRIES=3
   RATE_LIMIT_DELAY_MS=500
   TEMPERATURE_RESTORE=0.3
   TEMPERATURE_REMAKE=0.8
   
   # Server Configuration
   PORT=3000
   LOG_LEVEL=info
   ```

## 🧪 Testing

### Quick Test Suite

Run the basic test suite (recommended for first-time setup):

```bash
npm test [optional_record_id]
```

This will test:
- Environment setup and API connectivity
- Airtable operations
- Photo record access
- Image analysis
- Plan creation

### Full Pipeline Test

Run the complete restoration test (may take several minutes and use API credits):

```bash
node src/test_runner.js [record_id] --full
```

This includes all basic tests plus:
- Complete restoration pipeline
- Image generation and processing
- Quality validation
- Upload verification

### Test with Specific Photo

```bash
npm test recOEKuWvTsZv71Qm
```

Replace `recOEKuWvTsZv71Qm` with any valid PhotoGallery record ID from your Airtable base.

## 🚀 Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3000 (or your configured PORT) and provide:
- Health check: `http://localhost:3000/health`
- API endpoints for photo processing
- Session management and status tracking

### API Endpoints

#### Process Single Photo
```http
POST /api/process
Content-Type: application/json

{
  "photoRecordId": "recOEKuWvTsZv71Qm",
  "workflowId": "optional_workflow_id",
  "mode": "RESTORE"
}
```

#### Process Batch
```http
POST /api/process-batch
Content-Type: application/json

{
  "photoRecordIds": ["rec1", "rec2", "rec3"],
  "workflowId": "optional_workflow_id", 
  "mode": "RESTORE"
}
```

#### Upload and Process Directly
```http
POST /api/upload-and-process
Content-Type: multipart/form-data

Form fields:
- image: [image file]
- mode: "RESTORE" | "REMAKE" (optional)
```

#### Get Session Status
```http
GET /api/session/{sessionId}
```

#### Get All Sessions
```http
GET /api/sessions
```

### Processing Modes

- **RESTORE**: Conservative restoration focusing on defect removal and enhancement
- **REMAKE**: Creative reimagining with modern techniques and styling

## 📊 Airtable Schema

The system expects these Airtable tables:

### PhotoGallery
- **Name**: Text (photo title)
- **Attachments**: Attachment (source images)
- **Status**: Single Select (Pending, Processing, Complete, Failed, Needs Review)
- **Result URL**: URL (restored image link)
- **Quality Score**: Number (0-100)
- **Processing Job ID**: Text (session ID)
- **Processing Started/Completed**: Date fields
- **Error Message**: Long text
- **Workflow**: Link to Workflows table
- **Notes**: Long text (processing summary)

### Workflows  
- **Workflow Name**: Text
- **Description**: Long text
- **Prompts**: Link to Prompts table
- **Active**: Checkbox
- **Input/Output Type**: Single Select

### Prompts
- **Title**: Text
- **Prompt Content**: Long text
- **Type**: Single Select (Analysis, Planning, Editing, Validation)
- **Temperature**: Number (0-1)
- **Model Requirements**: Text

### Test Runs
- **Run ID**: Text (unique identifier)
- **Test Date**: Date
- **Model Used**: Text
- **Success**: Checkbox
- **Execution Time**: Number
- **Quality Score**: Number
- **Notes**: Long text

## 📈 Quality Metrics

The system tracks multiple quality metrics:

### Analysis Metrics
- Image type classification
- Overall quality score (0-10)
- Defect detection and categorization
- Era and content identification

### Processing Metrics
- Steps completed vs. planned
- Processing time per step
- Success rate
- Temperature settings used

### Validation Metrics
- Preservation of original (0-100)
- Defect removal effectiveness (0-100)  
- Enhancement quality (0-100)
- Naturalness score (0-100)
- Technical quality (0-100)
- Overall score (0-100)

## 🔧 Configuration

### Agent Settings

Modify `.env` for different agent behaviors:

- `TEMPERATURE_RESTORE=0.3`: Lower values for consistent restoration
- `TEMPERATURE_REMAKE=0.8`: Higher values for creative interpretation
- `MAX_RETRIES=3`: Retry failed API calls
- `RATE_LIMIT_DELAY_MS=500`: Delay between requests

### Logging

Set `LOG_LEVEL` to control verbosity:
- `error`: Only errors
- `warn`: Warnings and errors  
- `info`: General information (default)
- `debug`: Detailed debugging information

## 🐛 Troubleshooting

### Common Issues

1. **"No workflows found"**
   - Check Airtable base ID and API key
   - Ensure Workflows table exists with proper schema
   - Verify API permissions

2. **"Missing required sections" in analysis**
   - Check Gemini API key validity
   - Verify image format is supported
   - Check API quota and rate limits

3. **Upload failures**
   - Network connectivity issues with transfer.sh
   - Images are still processed and saved locally
   - Check `/tmp/adk_restoration/` for generated files

4. **Processing timeouts**
   - Large images may take longer to process
   - Increase timeout values if needed
   - Monitor API rate limits

### Debugging

1. **Enable Debug Logging**
   ```bash
   LOG_LEVEL=debug npm start
   ```

2. **Test Individual Components**
   ```bash
   # Test only analysis
   node src/test_runner.js recOEKuWvTsZv71Qm
   ```

3. **Check Session Details**
   ```bash
   curl http://localhost:3000/api/session/your_session_id
   ```

## 📝 Development Notes

### Code Structure

```
src/
├── agents/           # Core AI agents
│   ├── AnalysisAgent.js
│   ├── PlannerAgent.js
│   ├── EditorAgent.js
│   ├── ValidatorAgent.js
│   ├── OrchestratorAgent.js
│   └── BaseAgent.js
├── utils/           # Utility classes
│   ├── AirtableManager.js
│   └── FileManager.js
├── schemas/         # Structured output schemas
│   └── index.js
├── test_runner.js   # Test automation
└── index.js         # Main server
```

### Adding New Agents

1. Extend `BaseAgent` class
2. Implement required methods
3. Add to `OrchestratorAgent`
4. Update schemas if needed
5. Add tests to `test_runner.js`

### Schema Validation

All AI responses use structured schemas to ensure consistent, parseable outputs. Modify `schemas/index.js` to adjust response formats.

## 📊 Performance Guidelines

### API Usage

- Analysis: ~10-30 tokens per image
- Planning: ~50-100 tokens per plan
- Editing: ~100-500 tokens per edit step
- Validation: ~50-100 tokens per validation

### Processing Times

- Small images (< 1MB): 30-60 seconds total
- Medium images (1-5MB): 1-3 minutes total  
- Large images (> 5MB): 2-5 minutes total

### Rate Limits

- Gemini API: Respect rate limits (500ms delay configured)
- Airtable API: 5 requests/second limit
- Processing: Consider batch delays for multiple images

## 🔒 Security

- API keys stored in environment variables only
- Temporary files cleaned up automatically
- No permanent storage of user images
- Rate limiting and retry logic implemented
- Input validation on all endpoints

## 📄 License

This system is designed for the Saroop Singh Archive restoration project. Modify and adapt as needed for your use case.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Run tests to isolate the problem
3. Enable debug logging for detailed information
4. Review Airtable and Gemini API documentation

## 🎯 Success Criteria

The system is working correctly when:
- ✅ All tests pass (at least 80% success rate)
- ✅ Images are successfully analyzed and restored
- ✅ Airtable records are updated with results
- ✅ Quality scores are reasonable (> 60 for good images)
- ✅ Processing completes in reasonable time (< 5 minutes)

Based on our testing:
- Environment setup: ✅ Working
- Airtable integration: ✅ Working  
- Image analysis: ✅ Working
- Plan creation: ✅ Working
- Complete restoration: ✅ Working (upload issues are network-related)

This experimental source is retained for historical context only; it is not a
production service for the archive.
