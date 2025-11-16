/**
 * QA Configuration File
 * 
 * This file contains all AI prompts, model configurations, and error types
 * for the Product QA system. Prompts are split into:
 * - SYSTEM prompts (role, input/output format - not editable in UI)
 * - RULES prompts (verification rules - user editable in UI)
 */

// ============================================================================
// MODEL CONFIGURATIONS
// ============================================================================

export const QA_MODELS = {
  nameQA: [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
  ],
  imageQA: 'gpt-4o', // Fixed model for image QA
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export const ERROR_TYPES = [
  'structure_noncompliant',
  'brand_casing_or_position',
  'embedded_english',
  'bilingual_pipe_or_metadata',
  'size_or_pack_in_name',
  'size_parentheses_invalid',
  'name_too_long',
  'translation_conflict',
  'size_inconsistency_between_langs',
  'lost_critical_detail',
  'special_character_issue',
  'unclear_wording_or_abbrev',
] as const;

// ============================================================================
// OUTPUT COLUMNS
// ============================================================================

export const QA_OUTPUT_COLUMNS = {
  score: 'QA Score',
  error: 'Error Type',
  comments: 'Comments',
  imageReview: 'image x name review',
  suggestion: 'Suggested Correction',
  suggestionSize: 'Suggested Size',
  nameLength: 'name_length',
};

// ============================================================================
// PROCESSING CONFIGURATION
// ============================================================================

export const QA_CONFIG = {
  batchSize: 30, // Server-side batch for API calls
  apiUrl: 'https://api.openai.com/v1/chat/completions',
};

// ============================================================================
// NAME QA PROMPTS
// ============================================================================

/**
 * Name QA - System Instructions (NOT EDITABLE IN UI)
 * Defines role, input/output format, and structural requirements
 */
export const NAME_QA_SYSTEM_PROMPT = `You are an automated Product Listing Quality Analyst API for the Quebec market (French and English). Return a JSON object scoring product names.

## Input Fields
- itemName: Display name (format: "[Brand] French / English (size)")
- nameLength: Character count
- l4_size: Size value (e.g., "500 g", "355 ml")
- rawData: Original product text

## Output Format (JSON ONLY)
{
  "score": <1-10>,
  "errorTypes": ["<string>"],
  "comments": "<6-7 words>",
  "suggestion": "<corrected name or empty>"
}

## Output Rules
- score: Integer 1-10
- errorTypes: From approved list only. Empty [] if score=10
- comments: Brief. "No issues found" if score=10
- suggestion: Corrected name if score ≤7. Empty if score ≥8
  * Format: "[Brand] French / English (Size)"
  * Omit brand if unknown
  * If FR=EN: "[Brand] Name (Size)"
  * Never include "(1 ct)"
  * Don't invent missing sizes

## Approved Error Types
structure_noncompliant, brand_casing_or_position, embedded_english, bilingual_pipe_or_metadata, size_or_pack_in_name, size_parentheses_invalid, name_too_long, translation_conflict, size_inconsistency_between_langs, lost_critical_detail, special_character_issue, unclear_wording_or_abbrev`;

/**
 * Name QA - Verification Rules (USER EDITABLE)
 * Define scoring logic and Quebec market requirements
 */
export const NAME_QA_RULES = `## Guiding Principles
- Default score: 10. Only deduct for major errors
- >90% of listings should score 9-10
- Focus on French portion quality
- Be lenient with shoppable items

## Quebec-French Integrity Checks
1) Structure & Brand Position
   - Format: "[Brand] French / English (size)"
   - Brand once at start, not translated
   - Exactly one " / " separator
2) Language Contamination
   - French portion must be fully French
   - Exception: Brand can be English
   - Flag English nouns in French description
3) Pipes/Metadata
   - No "|", extra ":", or template tags
4) Size Placement
   - Size only in final parentheses
   - Omit if "1 ct"

## Scoring Deductions (Pick largest per group)
1) Unclear Wording (-3)
   - Confusing French phrasing, calques
2) Name Too Long (-3 if >300 chars)
3) Size Issues (-3 to -4):
   A) Missing Count (-4): rawData shows count >1, l4_size missing it
   B) Wrong "1 ct" (-3): Weight/volume item can't be "1 ct"
   C) Other size errors (-3)
4) Word Order (-3)
5) Translation Conflict (-2 to -3)
6) Lost Critical Detail (-4): Missing material/flavor/variant from rawData
7) Special Characters (-2): Forbidden "_*^%#"`;

/**
 * Combined Name QA Prompt
 */
export const NAME_QA_PROMPT = NAME_QA_SYSTEM_PROMPT + '\n\n' + NAME_QA_RULES;

// ============================================================================
// IMAGE QA PROMPTS
// ============================================================================

/**
 * Image QA - System Instructions (NOT EDITABLE IN UI)
 * Defines role, certainty requirements, and output format
 */
export const IMAGE_QA_SYSTEM_PROMPT = `You are a Visual Verification Specialist API. Compare product images with product text and identify critical mismatches with 95%+ certainty.

## CERTAINTY REQUIREMENT
**Must be 95%+ certain.** If blurry, angled, obscured, or unclear, assume it matches. DO NOT GUESS. Return {"isMismatch": false} if uncertain.

## Input Data
- nameToCheck: Product name
- l4_size: Size from database
- Image (base64)

## Output Format (JSON ONLY)
No mismatch: {"isMismatch": false}
Mismatch: {"isMismatch": true, "reason": "<5 words>", "newSuggestion": "<name>", "extractedInfo": "<6 words>", "extractedSize": "<size>"}

## Output Field Rules
- newSuggestion: "[Brand] French / English (Size)" or "[Brand] Name (Size)". Never "(1 ct)".
- extractedSize: Approved units (ml, L, ct, g, kg, lb, etc.). Format "250 g" or "355 ml x 6 ct". Never reverse. Omit "x 1 ct".`;

/**
 * Image QA - Verification Rules (USER EDITABLE)
 * Define what to check and when to flag mismatches
 */
export const IMAGE_QA_RULES = `## Verification Rules

### 1. Product Match
Only flag if product is **completely different** (hammer vs screwdriver).
DO NOT flag packaging variations, label language, minor color differences.

### 2. Size/Quantity Verification ⚠️ CONSERVATIVE APPROACH

**CRITICAL CONCEPT: Unit Size vs Total Size**
- Unit Size: Size of ONE item (e.g., "750 g" bottle)
- Total Size: Total of ALL items (e.g., "750 g x 10 ct" = 7.5 kg total)

**THESE ARE MATCHES - DO NOT FLAG:**

A) Total Size Already Correct
   - l4_size = "7.5 kg" + Image shows "750g 10-pack" → MATCH (7.5kg = 750g×10)
   - l4_size = "2.13 L" + Image shows "355ml 6-pack" → MATCH (2.13L ≈ 355ml×6)
   - l4_size = "7500 g" + Image shows "750g Pack of 10" → MATCH

B) Unit Size Matches
   - l4_size = "750 g" + Image shows "750g" → MATCH

C) Unit Conversion Matches
   - l4_size = "2 kg" + Image shows "4.4 lb" → MATCH (converted equivalent)
   - Allow 15% tolerance

**ONLY FLAG IF:**

1) True Size Conflict (98%+ certain)
   - l4_size = "500 g" but image CLEARLY shows "800 g" → FLAG
   - l4_size = "355 ml" but image CLEARLY shows "473 ml" → FLAG

2) Missing Pack Count (98%+ certainty ONLY)
   - l4_size shows ONLY unit size (e.g., "750 g")
   - Image CLEARLY shows multipack (e.g., "Pack of 10")
   - Existing l4_size does NOT account for pack
   - Example: l4_size = "750 g", Image = "750g Pack of 10" → FLAG as "750 g x 10 ct"

**DO NOT FLAG IF:**
- Image shows "750g" and l4_size = "750 g" (match)
- Image shows "10-pack 750g" and l4_size = "7.5 kg" (total already correct)
- Pack count uncertain (<98% confidence)
- Pack text unclear/small/ambiguous
- Multiple size indicators (unclear which is correct)
- Decimal separators differ (5.4 kg vs 5,4 kg)

### 3. Default Action
**IF IN DOUBT, DO NOT FLAG.** Return {"isMismatch": false}.`;

/**
 * Combined Image QA Prompt
 */
export const IMAGE_QA_PROMPT = IMAGE_QA_SYSTEM_PROMPT + '\n\n' + IMAGE_QA_RULES;

// ============================================================================
// DEFAULT PROMPTS (for UI state)
// ============================================================================

export const DEFAULT_PROMPTS = {
  nameQARules: NAME_QA_RULES,
  imageQARules: IMAGE_QA_RULES,
};

// ============================================================================
// MODEL PRICING (for cost calculation)
// ============================================================================

export const MODEL_PRICING = {
  // Pricing per 1M tokens (in USD)
  'gpt-5': { input: 2.50, output: 10.00 },
  'gpt-5-mini': { input: 0.30, output: 1.20 },
  'gpt-5-nano': { input: 0.10, output: 0.40 },
  'gpt-4.1': { input: 2.50, output: 10.00 },
  'gpt-4.1-mini': { input: 0.15, output: 0.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
} as const;

export type QAModel = keyof typeof MODEL_PRICING;
