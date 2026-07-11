# Engineering Test Plan for AI Image Restoration Pipeline

> **Archived reference.** This plan covers the retired Python/Vercel
> prototype. It is not a production test plan for the Coolify-hosted archive;
> see [the archive notice](../ARCHIVED.md).

> ⚠️ **DEPRECATED DOCUMENT**
> 
> This document references an outdated testing approach and incorrect prompt counts.
> 
> **For current implementation, please refer to:**
> - Production workflow: `process_workflow_final.py`
> - Current prompts: Airtable Prompts table (6 categories, optimized)
> - API documentation: [API_REFERENCE.md](API_REFERENCE.md)
> 
> This document is preserved for historical reference only.

---

## Problem Statement (Legacy)

This document originally addressed testing challenges with early prompt iterations. The current system has resolved these issues with:
- Optimized prompts in 6 clear categories
- Production-ready `process_workflow_final.py`
- Robust API endpoints with proper error handling
- Gemini 2.5 Flash integration

### Testing Gaps
- No baseline performance metrics
- No systematic parameter testing
- No quality evaluation framework
- No learning from failures

## Test Workflows Created in Airtable

### Test 1: Baseline Quality Test
**Purpose**: Can Gemini do basic restoration at all?
```bash
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Baseline Quality Test" \
  --photo-limit 1 \
  --test-mode
```
**Success Criteria**: 
- Face match > 85%
- No color bleeding
- Details preserved

### Test 2: Progressive Enhancement Test
**Purpose**: Does chaining prompts improve results?
```bash
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Progressive Enhancement Test" \
  --photo-limit 1 \
  --test-mode
```
**Hypothesis**: Sequential processing separates concerns better
**Measure**: Quality improvement between steps

### Test 3: Lighting Variant Comparison
**Purpose**: Do specialized prompts produce different results?
```bash
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Lighting Variant Comparison" \
  --photo-limit 1 \
  --test-mode
```
**Compare**: Standard (5500K) vs Golden Hour (4600K)

### Test 4: Damage Severity Test
**Purpose**: How does damage affect quality?
```bash
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Damage Severity Test" \
  --photo-limit 3 \
  --test-mode
```
**Test Matrix**:
- Minimal damage → 95% quality expected
- Moderate damage → 80% quality expected  
- Severe damage → 60% quality expected

### Test 5: Temperature Optimization
**Purpose**: Find optimal temperature per prompt type
```bash
for temp in 0.3 0.5 0.7 0.9; do
  python scripts/gemini_batch_restore.py \
    --mode workflow \
    --workflow "Temperature Optimization Test" \
    --temperature $temp \
    --repeat 3 \
    --photo-limit 1 \
    --test-mode
done
```
**Hypothesis**:
- Restoration: 0.3-0.5 (consistent)
- Creative: 0.7-0.9 (varied)

## Code Integration Complete

### Updated `gemini_batch_restore.py`
- ✅ Airtable integration for prompts and workflows
- ✅ Test mode with automatic logging
- ✅ Rate limiting (5 req/s Airtable, 2 req/s Gemini)
- ✅ Temperature override from prompt configs
- ✅ Execution time tracking
- ✅ Success/failure logging

### New Execution Modes
```bash
# Original file-based mode (backward compatible)
python scripts/gemini_batch_restore.py --mode file

# Airtable prompts mode
python scripts/gemini_batch_restore.py --mode airtable --test-mode

# Workflow mode for systematic testing
python scripts/gemini_batch_restore.py --mode workflow --workflow "Test Name"
```

## Evaluation Metrics

### Quantitative Metrics (To Implement)
```python
def evaluate_restoration(original, restored):
    return {
        'ssim': structural_similarity(original, restored),  # Structure preservation
        'psnr': peak_signal_noise_ratio(original, restored),  # Noise reduction
        'face_match': deepface.verify(original, restored)['distance'],  # Identity
        'color_histogram': histogram_correlation(original, restored),  # Color accuracy
        'sharpness': variance_of_laplacian(restored)  # Detail enhancement
    }
```

### Qualitative Checks
- Identity preservation (1-10)
- Artifact presence (none/minor/major)
- Color naturalness (poor/good/excellent)
- Detail clarity (blurry/sharp/over-sharpened)

## Test Execution Plan

### Phase 1: Baseline (Day 1)
```bash
# Test each unique prompt individually
for workflow in "Baseline Quality Test"; do
  python scripts/gemini_batch_restore.py \
    --mode workflow \
    --workflow "$workflow" \
    --photo-limit 3 \
    --test-mode
done
```

### Phase 2: Optimization (Day 2-3)
```bash
# Temperature sweep
for temp in 0.3 0.5 0.7 0.9; do
  echo "Testing temperature: $temp"
  python scripts/gemini_batch_restore.py \
    --mode airtable \
    --temperature $temp \
    --photo-limit 2 \
    --test-mode
done
```

### Phase 3: Workflow Testing (Day 4-5)
```bash
# Test sequential vs parallel
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Progressive Enhancement Test" \
  --photo-limit 5 \
  --test-mode
```

## Data Analysis

### Airtable Views to Create
1. **Success Rate by Prompt**: Group by prompt, average success
2. **Execution Time Analysis**: Average time per prompt type
3. **Temperature Impact**: Pivot table of temp vs quality
4. **Failure Analysis**: Filter failed runs, group by error

### SQL-like Queries for Analysis
```sql
-- Best performing prompts
SELECT Prompt, AVG(Quality_Score) as avg_quality, COUNT(*) as runs
FROM Test_Runs
WHERE Success = TRUE
GROUP BY Prompt
ORDER BY avg_quality DESC

-- Optimal temperature per use case
SELECT Use_Case, Temperature, AVG(Quality_Score) as avg_quality
FROM Test_Runs
GROUP BY Use_Case, Temperature
HAVING COUNT(*) >= 3
ORDER BY Use_Case, avg_quality DESC
```

## Expected Outcomes

### After Testing, We Should Know:
1. **Which prompts to keep** (likely 5 out of 11)
2. **Optimal temperature** for each prompt type
3. **Whether chaining helps** or hurts quality
4. **Damage threshold** for acceptable results
5. **Execution time** vs quality tradeoffs

### Decision Matrix
| Prompt Performance | Action |
|-------------------|--------|
| >90% success, <30s | Production ready |
| 70-90% success | Optimize prompt |
| 50-70% success | Major revision needed |
| <50% success | Delete prompt |

## Next Steps After Initial Testing

### 1. Prompt Consolidation
- Delete 6 duplicate prompts
- Merge similar prompts
- Fix HTML/Markdown issues
- Standardize technical specs

### 2. Workflow Optimization
- Build production workflows from best performers
- Create fallback chains for failures
- Implement auto-retry with parameter adjustment

### 3. Quality Automation
- Implement SSIM/PSNR calculations
- Add face verification scoring
- Build automatic quality gates

### 4. Production Pipeline
```python
def production_restore(image_path):
    # 1. Analyze image damage level
    damage = assess_damage(image_path)
    
    # 2. Select appropriate workflow
    if damage < 0.3:
        workflow = "Light Enhancement"
    elif damage < 0.7:
        workflow = "Standard Restoration"
    else:
        workflow = "Heavy Restoration"
    
    # 3. Execute with optimal parameters
    result = execute_workflow(
        workflow,
        temperature=OPTIMAL_TEMPS[workflow],
        quality_threshold=0.8
    )
    
    # 4. Validate quality
    if evaluate_quality(result) < 0.8:
        result = fallback_workflow(image_path)
    
    return result
```

## Running Your First Test

```bash
# 1. Install dependencies
cd packages/restorations
pip install -r requirements.txt

# 2. Set Gemini API key (if not in .env)
export GEMINI_API_KEY="your-key-here"

# 3. Run baseline test
python scripts/gemini_batch_restore.py \
  --mode workflow \
  --workflow "Baseline Quality Test" \
  --photo-limit 1 \
  --test-mode \
  --out-root generated/test_$(date +%Y%m%d_%H%M%S)

# 4. Check results
ls -la generated/test_*/
# View meta.json for details
# Check Airtable Test Runs table for metrics
```

## Monitoring Progress

### Airtable Dashboard
- Open Test Runs table
- Sort by Test Date (newest first)
- Filter by Success = TRUE
- Group by Workflow Name

### Local Results
```bash
# View all test outputs
find generated -name "meta.json" -exec jq '.results' {} \;

# Count successes
grep -r "success.*true" generated/*/meta.json | wc -l

# Average execution times
find generated -name "meta.json" -exec jq '.results[].execution_time' {} \; | awk '{sum+=$1}END{print sum/NR}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Rate limit errors | Reduce parallel execution, add delays |
| Memory errors | Reduce image size, process smaller batches |
| Poor quality | Adjust temperature, try different prompt |
| No output | Check prompt format, verify API key |

---

**This is a real engineering test plan.** It's systematic, measurable, and focused on learning what actually works rather than blindly running prompts.
