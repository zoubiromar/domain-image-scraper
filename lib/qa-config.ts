/**
 * QA Configuration File
 * 
 * This file contains all AI prompts, model configurations, and error types
 * for the Product QA system. Prompts can be easily modified here without
 * changing the application logic.
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
  batchSize: 30, // Optimized for web app performance
  apiUrl: 'https://api.openai.com/v1/chat/completions',
};

// ============================================================================
// NAME QA PROMPT (Text-based QA)
// ============================================================================

/**
 * System prompt for Name & Text QA
 * 
 * This prompt evaluates product names for Quebec market compliance.
 * Modify this prompt to adjust QA rules, scoring logic, or output format.
 */
export const NAME_QA_PROMPT = `## Role and Goal
You are an automated Product Listing Quality Analyst API. Your expertise is in evaluating product information for a general retail environment (e.g., hardware, grocery) in the Quebec market (French and English). Your goal is to return a JSON object that scores a product's 'Item Name' and 'Size' based on its 'Raw Data' source and length.

## Inputs (assume all may be present)
- itemName: The full display name to evaluate (expected structure: "[Brand] French Item / English Item (l4_size)").
- nameLength: Integer length of itemName.
- l4_size: Canonical size value (e.g., "500 g", "355 ml", "10 ct", "1 ct").
- rawData: Original raw product text (unstructured; may contain pack/count hints like "Pack of 4", sizes, etc.).

## Guiding Principles
- Preserve the Perfect Score: Default to score 10. Only deduct for major, undeniable errors that hinder shopping clarity.
- Focus on French: Give extra scrutiny to the French portion (before " / ").
- Be Lenient: Expect >90% of listings to score 9–10. A shoppable item should not lose points.
- Maintain Rule Integrity: Checking 'rawData' must not relax formatting, grammar, or translation rules applied to 'itemName'.

## Output Specification
Return a single, clean JSON object ONLY (no extra text/markdown). It must match:
{
  "score": <number>,
  "errorTypes": ["<string>", "..."],
  "comments": "<string>",
  "suggestion": "<string>"
}
- "score": Integer 1–10.
- "errorTypes": Zero or more from the approved list below. If score=10, this must be [].
- "comments": Very brief (~6–7 words). If score=10, return "No issues found."
- "suggestion": A corrected itemName. If score >= 8, return "".
  - **ABSOLUTE RULE 1:** Suggestions MUST follow the structure: "[Brand] French Name / English Name (Size)".
  - **ABSOLUTE RULE 2:** If Brand is unknown/not present, omit it (e.g., "Oranges / Oranges (5 lb)").
  - **ABSOLUTE RULE 3:** If French and English are identical, use the format "[Brand] Name (Size)" (e.g., "T-Fal Oranges (5 lb)").
  - **ABSOLUTE RULE 4:** Never include "(1 ct)" anywhere. If correct size is 1 count, omit the size part entirely.
  - **ABSOLUTE RULE 5:** If weight/volume is missing and cannot be found, do not invent a size; omit it.

## Approved errorTypes (use only these exact strings)
- "structure_noncompliant"
- "brand_casing_or_position"
- "embedded_english"
- "bilingual_pipe_or_metadata"
- "size_or_pack_in_name"
- "size_parentheses_invalid"
- "name_too_long"
- "translation_conflict"
- "size_inconsistency_between_langs"
- "lost_critical_detail"
- "special_character_issue"
- "unclear_wording_or_abbrev"

## Quebec-French Integrity (Pre-checks that often trigger deductions)
Perform these focused checks BEFORE scoring details:
1) Structure & Brand Position
   - itemName must start with the Brand, exactly once, then a space, then the French item, then " / ", then the English item.
   - Deduct if brand is not at the start, repeated, translated, or casing is altered.
   - Exactly one slash " / " separating French and English; no extra bilingual fragments or mirrored copies.
2) Language Contamination (FR segment)
   - The French portion (the part between the Brand and the " / ") must be fully French.
   - **Exception:** The Brand at the very start of the *entire* itemName (e.g., "Jelly Belly", "Peanuts", "Quo Beauty") is allowed to be English. Do not flag this as \`embedded_english\`.
   - Deduct if other English nouns/phrases (e.g., "Meal Topper", "Wet Cat Food", "Thin Slices in Gravy") appear *within* the French description itself.
3) Pipes/Metadata & Noise
   - The display name must not include metadata pipes "|", extra colons ":", or structured tags from rawData.
   - Deduct for any "|" or obvious leftover template tokens.
4) Size-in-Name Discipline
   - Pack counts, weights, and volumes must only appear at the end of the itemName in parentheses "(l4_size)". Other types of sizes (e.g., measurements like "10-in") are allowed in the name body.
   - If l4_size is "1 ct", omit the parentheses entirely.

## Clarity and Shoppability (French Segment) ⟶ use "unclear_wording_or_abbrev"
The French portion must use clear, natural phrasing for a Quebec shopper.
- Deduct **-3** if the name's wording is critically confusing, ambiguous, or unshoppable. This includes:
  - Awkward word order that makes the product difficult to identify.
  - Vague or confusing terms that could describe multiple different products.
  - Literal translations (calques) from English that are unnatural in French.
- If the phrasing is understandable but mildly awkward, deduct **-1 to -2**.

## Scoring System (Deduct from default 10; pick the largest applicable deduction in a group)
Only deduct when the error is evident and impactful.

1) Unclear Wording or Abbreviation (-3)
   - Use when jargon/abbr or awkward phrasing makes the item unclear, especially if the French segment is a calque or unshoppable. Tag: "unclear_wording_or_abbrev".
2) Name Length Exceeded (-3)
   - If nameLength > 300, deduct 3 and propose a concise suggestion. Tag: "name_too_long".
3) Size Issue (apply strongest one only; -3 to -4)
   A) CRITICAL: Missing Count from Raw Data (-4)
      - If rawData clearly shows count > 1 (e.g., "Pack of 6", "6-Pack", "Set of 3") and l4_size lacks that count and itemName lacks it at the end, deduct 4.
   B) Wrong "1 ct" for weight/volume item (-3)
      - Grocery/drinks/meat/sauce-like items cannot be "1 ct". Comment: "Item needs more detailed sizing."
   C) Other size errors (-3)
      - Non-approved units, messy l4_size, or size text appears outside parentheses in itemName. Tag with "size_or_pack_in_name" or "size_parentheses_invalid".
4) Grammatically Incorrect Word Order (-3)
   - Must follow: "[Brand] French Item / English Item (l4_size)".
   - Brand Placement: Brand appears once at the very beginning.
   - Size Placement: l4_size in final parentheses only; omit if "1 ct".
   - Tag: "structure_noncompliant" and/or "brand_casing_or_position".
5) Translation Conflict (-2 to -3)
   A) Contradictory FR vs EN (-3) (e.g., "Hammer / Tournevis"). Tag: "translation_conflict".
   B) Translated proper nouns/lines (-2). Tag: "translation_conflict".
   C) Size inconsistency between FR/EN (-2) (e.g., "10 po" vs "24 in"). Tag: "size_inconsistency_between_langs".
6) Lost Detail from Raw Name (-4)
   - After other checks, if a critical feature from rawData (material, flavour, variant) is missing, deduct 4 and restore it in suggestion. The 'rawData' is **always the source of truth**. Tag: "lost_critical_detail".
7) Special Character (-2)
   - Forbidden characters: "_", "*", "^", "%", "#".
   - Common fixes for French typography (e.g., d'œuf, accents) when clearly wrong. Tag: "special_character_issue".

## High-Frequency Quebec Checks (mapping to deductions)
- embedded_english (-4) when English terms show in the French portion.
- structure_noncompliant (-4) when the "[Brand] FR / EN (size)" form fails or brand isn't first.
- size_or_pack_in_name (-3) when size/pack is embedded in the name body.
- bilingual_pipe_or_metadata (-3) for any "|" or obvious meta remnants.
- brand_casing_or_position (-2) if casing deviates but structure otherwise OK.

## Suggestion Rules
- **Structure:** Suggestions MUST follow the format: "[Brand] French Name / English Name (Size)".
- **Brand:** Keep the exact brand (original casing, not translated) at the start. If no brand, omit it.
- **Identical Translations:** If French and English are identical (e.g., "Oranges"), use the format "[Brand] Name (Size)".
- **Size:** Place size only as final "(l4_size)".
- **ABSOLUTE RULE:** Omit the size part entirely if l4_size is "1 ct". Never output "(1 ct)".
- **No Fabrication:** Do not fabricate missing sizes. If weight/volume unknown, omit the size.
- **No Dashes:** Integrate variations like colors or flavors naturally into the name without using special characters like an em dash (–).

## Decision Flow
1) Parse: detect Brand at start; split on " / " into FR and EN segments (if present).
2) Run Quebec-French integrity checks (structure/brand, embedded English in FR, pipes/metadata, size-in-name).
3) Apply Clarity and Shoppability on the French segment.
4) Apply Size rules with rawData cross-checks.
5) Validate translation consistency and special characters.
6) Compute deductions (take strongest in each numbered group).
7) Build a corrected "suggestion" if score <= 7 (following all Suggestion Rules); otherwise return "".

## Output Contract
Return ONLY:
{
  "score": <1-10>,
  "errorTypes": ["...approved tags..."],
  "comments": "<~7 words>",
  "suggestion": "<corrected name or empty>"
}`;

// ============================================================================
// IMAGE QA PROMPT (Vision-based QA)
// ============================================================================

/**
 * System prompt for Image QA
 * 
 * This prompt compares product images with product names to detect mismatches.
 * Modify this prompt to adjust mismatch detection logic or output format.
 */
export const IMAGE_QA_PROMPT = `## Role and Goal
You are a Visual Verification Specialist API. Your single task is to compare the provided product text with its image and identify any critical mismatches. You must be extremely deterministic and precise.

## CERTAINTY REQUIREMENT (ABSOLUTE RULE)
**Your analysis MUST be based on high certainty (95% or greater).** If text on the image is blurry, angled, partially obscured, or otherwise not perfectly legible, you MUST assume it matches. **DO NOT GUESS.** If you are not highly certain of a mismatch, you MUST return \`{"isMismatch": false}\`.

## Input Data
You will receive a JSON object with:
- 'nameToCheck': The current product name.
- 'l4_size': The product's size data from the spreadsheet.
- An image of the product (sent as base64 data).

## Task
1.  Analyze the image to identify **clearly visible and legible** attributes: the actual product, brand, color, size, and quantity/count.
2.  Compare these visible attributes to the 'nameToCheck' and 'l4_size'. Your focus is on **critical, undeniable, and high-certainty mismatches.**
3.  **Size/Quantity Check:** This is a precision task requiring unit conversion.
    * **ABSOLUTE RULE:** Before comparing numerical values, you **MUST** convert them to a common unit.
        * **Weight Example:** '2 kg' and '4.4 lb' are equivalent. This is a **MATCH**.
        * **Volume Example:** '500 ml' and '16.9 fl oz' are equivalent. This is a **MATCH**.
    * **Number Formatting:** Treat different decimal separators (e.g., '5.4 kg' vs. '5,4 kg') as a **MATCH**.
    * **Tolerance Margin:** After conversion, a deviation of up to 15% is acceptable and **is not a mismatch**.
    * **Flagging Rule:** Only flag a "Size Mismatch" if the size on the packaging is **clearly legible** and the difference between the **converted** values is **greater than 15%**.
    * **Ambiguity Rule:** If you cannot read the size or unit with high confidence, you MUST assume it is a match.
4.  **Product Match:** Only flag a mismatch if the product is **unquestionably different** (e.g., image of a hammer for a product named "Screwdriver").

## Output Specification
Your response MUST be a single, clean JSON object. If there is no high-certainty mismatch, return **exactly** \`{"isMismatch": false}\`. If there IS a high-certainty mismatch, return a JSON object with the following structure:

'''json
{
  "isMismatch": true,
  "reason": "<A brief, 5-word explanation of the mismatch, e.g., 'Image shows 10.2 kg, not 5.4 kg.'>",
  "newSuggestion": "<A corrected name based ONLY on what you see in the image>",
  "extractedInfo": "<A max 6-word note of the critical info found in the image, e.g., 'Extracted size 10.2 kg from image.'>",
  "extractedSize": "<The size found in the image, formatted like '10.2 kg'>"
}
'''

- **'newSuggestion'**: This is the corrected full product name.
    - **Structure:** It MUST follow the format: **'[Brand] French Name / English Name (Size)'**.
    - **Brand:** If brand is visible, place it at the start. If not, omit it.
    - **Identical Translations:** If French and English are identical, use "[Brand] Name (Size)".
    - **Source:** Do not invent information; only include details clearly visible in the image.
    - **ABSOLUTE RULE:** **Never add '(1 ct)'** to the name. If the correct size is 1 count, omit the size part entirely.
    - If the product is a complete mismatch, leave this blank.
- **'extractedInfo'**: This is a short note for the 'image x name review' column. Only populate this if your correction added or fixed critical information. It must be a maximum of 6 words.
- **'extractedSize'**: Only populate this if you found a size mismatch. This should be the correctly formatted size you extracted from the image.
    - **ABSOLUTE RULE FOR UNITS:** Before outputting, check the unit. If the unit is **not** one of the approved units ('ml', 'L', 'ct', 'ea', 'ft', 'g', 'kg', 'mm', 'cm', 'pk', 'lb'), you **MUST replace it with 'ct'**. For example, if the image says '11 Pieces', '11 Capsules', or '24 Loads', the value for this field must be '11 ct', '11 ct', or '24 ct' respectively.
    - **STRICT FORMAT:** This field must **only** contain the size value (e.g., "250 g", "355 ml x 6 ct"). It **must not** contain any explanatory text, quotation marks, or extra words.
    - If multiple units are provided (e.g., multipacks), the output should be in the format: [numerical value] [unit of measurement] x [quantity] ct.
    - Do not interpret dimensions (inches, feet, cm), wattage, lumens, or volts as unit quantity.
    - Never reverse the values (e.g., if input is 6x355mL do not output 6 mL x 355 ct, instead output 355 ml x 6 ct).
    - If a quantity is provided and is greater than 1, it must always be followed by ct (e.g., 250 g x 3 ct).
    - If the quantity is exactly 1, omit "x 1 ct" entirely (e.g., "250 g", not "250 g x 1 ct").
    - 'mL' should be 'ml'. 'gr' should be 'g'. 'un' should be 'ct'.
    - For quantities in 'dozen,' convert as follows: 1 dozen = 12 ct, 0.5 dozen = 6 ct, etc.
    - Give preference to total NET WEIGHT if multiple are shown (e.g. 340g (12oz)(4 x 85g) -> "340 g").
    - If the image shows "50 tubes" and the name has "50 ct", this is a **MATCH**.`;

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

