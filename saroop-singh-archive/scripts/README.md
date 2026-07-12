# Historical content reorganization scripts

> **Do not run these scripts.** They are retained only as an historical record
> of a completed migration and target retired paths, old local machines, and
> obsolete symlink assumptions. The live archive has one validated source:
> `../packages/web/content/articles/published/`. For current contribution
> work, use [CONTRIBUTING.md](../../CONTRIBUTING.md).

This directory contains scripts to reorganize the Saroop Singh Archive project into a clean, scalable content management system.

## Overview

The current project structure has several issues:
- Duplicate images scattered across multiple directories
- Articles separated from their corresponding images
- No clear workflow for content management
- Poor separation between source and processed files

These scripts will migrate everything into a well-organized structure while maintaining backwards compatibility.

## New Directory Structure

```
content/
├── articles/
│   ├── published/    # Current published articles
│   ├── drafts/       # Work in progress
│   └── archive/      # Old versions
├── media/
│   ├── originals/    # Source files
│   │   ├── clippings/  # Newspaper clippings
│   │   ├── photos/     # Family photos
│   │   └── documents/  # Other documents
│   ├── processed/    # Optimized versions
│   │   ├── web/        # Web-ready images
│   │   ├── thumbnails/ # Auto-generated
│   │   └── gallery/    # Display versions
│   └── restorations/ # AI-enhanced images
│       ├── queue/      # To be processed
│       ├── processing/ # Currently being worked on
│       └── completed/  # Finished restorations
├── submissions/      # User contributions
└── metadata/        # Structured data
```

## Scripts

### 1. reorganize-content.js

Main migration script that reorganizes the entire content structure.

**Features:**
- Analyzes current directory structure
- Identifies and handles duplicate files
- Creates new organized directory structure
- Migrates all content to appropriate locations
- Creates symlinks for backwards compatibility
- Updates code references (basic)
- Creates backup and rollback scripts
- Detailed logging and validation

**Usage:**

```bash
# Preview changes without making them (RECOMMENDED FIRST)
node scripts/reorganize-content.js --dry-run

# Execute the migration
node scripts/reorganize-content.js

# Execute with verbose logging
node scripts/reorganize-content.js --verbose

# Show help
node scripts/reorganize-content.js --help
```

**Safety Features:**
- Dry run mode to preview all changes
- Complete backup of original structure
- Detailed manifest tracking all moves
- Automatic rollback script generation
- Extensive validation and error handling

### 2. validate-migration.js

Validates that the migration was successful and the system still functions properly.

**Usage:**

```bash
# Run validation after migration
node scripts/validate-migration.js
```

**Validation Checks:**
- Directory structure created correctly
- All files migrated successfully
- Symlinks working properly
- Article integrity maintained
- Image counts match expectations
- Backup created successfully
- Web application still functional

## Migration Process

Follow these steps to safely reorganize your content:

### Step 1: Preparation

1. **Backup your work** (the script will also create a backup, but it's good to have your own)
2. **Commit any pending changes** to Git
3. **Stop any running development servers**

### Step 2: Preview the Migration

```bash
cd /Users/agent-g/Saroop\ Singh\ Project/saroop-singh-archive
node scripts/reorganize-content.js --dry-run
```

This will show you exactly what changes will be made without actually making them.

### Step 3: Execute the Migration

```bash
node scripts/reorganize-content.js
```

The script will:
- Create a timestamped backup in `backup-[timestamp]/`
- Create the new `content/` directory structure
- Move all files to their new locations
- Create symlinks in `packages/web/public/` for backwards compatibility
- Generate a migration manifest and rollback script

### Step 4: Validate the Migration

```bash
node scripts/validate-migration.js
```

This will verify that everything was migrated correctly.

### Step 5: Test the Application

```bash
cd packages/web
npm run dev
```

Visit the application and verify that:
- Articles load correctly
- Images display properly
- Gallery functionality works
- Restoration features function

### Step 6: Update Code References (Manual)

While the script creates symlinks for backwards compatibility, you may want to update code references to use the new paths:

**Article image paths in markdown:**
```markdown
# Old
image: /images/1936-07-18_straits-times_athletic-results-saroop-singh.jpg

# New (recommended)
image: /content/media/processed/web/1936-07-18_straits-times_athletic-results-saroop-singh.jpg
```

**Component imports:**
Update any hardcoded paths in React components to use the new structure.

## Generated Files

After migration, several new files will be created:

### migration-manifest.json
Complete record of all changes made, including:
- File moves and copies
- Symlinks created
- Timestamps for all operations
- Any errors encountered

### rollback-reorganization.sh
Executable script to restore the original structure if needed:

```bash
# If you need to rollback
./rollback-reorganization.sh
```

### Logs
Detailed logs are saved in the `logs/` directory with timestamps.

### Validation Report
The validation script creates `migration-validation-report.json` with test results.

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
chmod +x scripts/*.js
```

**2. Symlinks Not Working**
- Make sure you're on a filesystem that supports symlinks
- Check that the target directories exist
- Verify symlink paths in the manifest

**3. Missing Files After Migration**
- Check the migration manifest for the file's new location
- Look in the backup directory
- Run the validation script to identify issues

**4. Web Application Broken**
- Verify symlinks in `packages/web/public/`
- Check console for 404 errors
- Run `npm run build` to test production build

### Recovery Options

**Option 1: Use Rollback Script**
```bash
./rollback-reorganization.sh
```

**Option 2: Manual Recovery**
```bash
# Restore from backup
cp -r backup-[timestamp]/* .

# Remove new content directory
rm -rf content/

# Remove symlinks
rm -f packages/web/public/images
rm -f packages/web/public/gallery
rm -f packages/web/public/restorations
```

**Option 3: Git Reset**
If you committed the changes:
```bash
git log --oneline  # Find commit before migration
git reset --hard [commit-hash]
```

## Benefits After Migration

1. **Organized Structure**: Clear separation between source and processed content
2. **Duplicate Elimination**: Automatic deduplication of identical files
3. **Scalable Workflow**: Support for drafts, review, and publishing workflows
4. **Better Performance**: Optimized directory structure for faster file access
5. **Future-Proof**: Extensible structure for new content types
6. **Maintainability**: Clear organization makes the project easier to maintain

## Next Steps

After successful migration:

1. **Update Documentation**: Revise any documentation that references old paths
2. **Configure CI/CD**: Update deployment scripts if they reference old paths
3. **Implement Workflows**: Use the new draft/published workflow for content
4. **Optimize Images**: Use the processed/ directories for optimized web images
5. **Set Up Automation**: Create scripts to automatically process new submissions

## Support

If you encounter issues:

1. Check the logs in the `logs/` directory
2. Review the migration manifest
3. Run the validation script
4. Use the rollback script if needed
5. Commit your changes after successful migration

Remember: The migration includes complete backup and rollback capabilities, so you can always restore the original structure if needed.