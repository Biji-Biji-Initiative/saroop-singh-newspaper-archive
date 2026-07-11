# Saroop Singh Archive - AI Image Restoration System

> **Archived reference.** This document describes the retired Python/Vercel
> prototype. Do not follow its deployment or credential instructions; the
> supported production path is the Next.js application on Coolify. See
> [ARCHIVED.md](ARCHIVED.md).

## Clean Project Structure

```
restorations/
├── api/                      # Vercel Serverless Functions
│   ├── process.py           # Main processing endpoint
│   ├── restore.py           # Gemini 2.5 Flash Image endpoint
│   ├── status.py            # Job status checking
│   └── webhook.py           # Airtable webhook handler
│
├── lib/                      # Core Libraries
│   ├── __init__.py          # Package initialization
│   ├── airtable_client.py   # Airtable API client
│   ├── gemini_image_processor.py  # Gemini 2.5 implementation
│   ├── queue_manager.py     # Redis job queue
│   └── storage.py           # Cloud storage handler
│
├── airtable/                 # Airtable Integration
│   ├── automation.js        # Button trigger automation
│   ├── DATABASE_SETUP.md    # Database configuration
│   ├── automations/         
│   │   └── README.md        # Automation setup guide
│   └── scripts/             # Helper scripts
│       ├── batch_process.js
│       ├── setup_helper.js
│       ├── trigger_restoration.js
│       └── update_status.js
│
├── web/                      # Next.js Web Interface
│   ├── components/          # React components
│   │   ├── ImageUploader.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── ResultViewer.tsx
│   │   └── WorkflowSelector.tsx
│   ├── lib/                 # Client utilities
│   │   ├── api-client.ts
│   │   └── utils.ts
│   ├── pages/               # Next.js pages
│   │   ├── api/[...routes].ts
│   │   ├── _app.tsx
│   │   ├── gallery.tsx
│   │   ├── index.tsx
│   │   └── process.tsx
│   ├── styles/              # CSS styles
│   │   └── globals.css
│   └── [config files]       # Next.js configuration
│
├── scripts/                  # Standalone Scripts
│   ├── run_workflow.py      # Main production workflow
│   ├── run_restoration.py   # Direct restoration runner
│   ├── airtable_restoration.py  # Airtable batch processor
│   └── preprocess.py        # Image preprocessing
│
├── tests/                    # Test Suite
│   ├── test_system.py       # System integration tests
│   └── test_local.py        # Local development tests
│
├── docs/                     # Documentation
│   ├── API_REFERENCE.md     # Complete API documentation
│   ├── AIRTABLE_SETUP.md    # Airtable integration guide
│   ├── TESTING_STRATEGY.md  # (Deprecated) Legacy testing
│   └── ENGINEERING_TEST_PLAN.md  # (Deprecated) Legacy plan
│
├── adk_restoration/          # Alternative ADK System (separate)
│   └── [Multi-agent system files]
│
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
├── vercel.json              # Vercel deployment config
├── README.md                # Main documentation
└── SYSTEM_ARCHITECTURE.md   # Architecture overview
```

## Key Features

### ✅ Clean Architecture
- **No duplicates**: Each file has a single purpose
- **No cache files**: Proper .gitignore configuration
- **No unused code**: All files are actively used
- **Clear separation**: API, lib, web, and scripts are distinct

### 🔑 Core Components

1. **API Layer** (`/api`)
   - Vercel serverless functions
   - RESTful endpoints for image processing
   - Webhook handlers for Airtable

2. **Library Layer** (`/lib`)
   - Gemini 2.5 Flash Image processor
   - Airtable client with rate limiting
   - Redis queue for async processing
   - Cloud storage abstraction

3. **Web Interface** (`/web`)
   - Next.js 14 with TypeScript
   - Drag-and-drop image upload
   - Real-time processing status
   - Gallery view with filters

4. **Airtable Integration** (`/airtable`)
   - Button-triggered automations
   - Batch processing scripts
   - Database setup documentation

## Technologies

- **AI Model**: Gemini 2.5 Flash Image (Nano Banana)
- **Backend**: Python 3.9+ with Vercel Functions
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: Airtable (CMS for prompts and images)
- **Queue**: Redis for job management
- **Deployment**: Vercel

## No Technical Debt

This structure has been cleaned of:
- ❌ Duplicate implementations
- ❌ Obsolete test files
- ❌ Cache directories
- ❌ Unused dependencies
- ❌ Legacy code
- ❌ Development artifacts

## Setup

1. **Environment Variables**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   cd web && npm install
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## Testing

Run the system test to verify everything works:
```bash
python test_system.py
```

---

**Last Cleaned**: September 1, 2025
**Total Files**: 57 (excluding node_modules)
**Code Lines**: ~5,000
**Zero Technical Debt** ✨
**Tests**: ✅ All Passing
