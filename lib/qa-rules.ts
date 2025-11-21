/**
 * QA Rules - Structured Definitions
 * 
 * This file defines all QA rules as structured objects that can be:
 * - Enabled/disabled individually
 * - Edited for description/logic
 * - Assigned custom point deductions
 * 
 * This powers the advanced rule editing UI.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface QARule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  pointDeduction: number; // 1-3 for English, 1-4 for French
  errorType: string; // Maps to approved error types
  editable: boolean; // false for system-critical rules
}

export interface RuleSet {
  systemPrompt: string; // Not editable
  rules: QARule[];
}

// ============================================================================
// FRENCH TEXT QA RULES
// ============================================================================

export const FRENCH_TEXT_QA_RULES: QARule[] = [
  {
    id: 'fr_structure_brand',
    name: 'Structure & Brand Position',
    description: `itemName must start with Brand, then French item, then " / ", then English item.
Deduct if brand not at start, repeated, or translated.
Format: "[Brand] French Item / English Item (size)"`,
    enabled: true,
    pointDeduction: 4,
    errorType: 'structure_noncompliant',
    editable: true,
  },
  {
    id: 'fr_embedded_english',
    name: 'Embedded English in French',
    description: `French portion must be fully French.
Exception: Brand at start can be English.
Flag if English nouns appear in French description.`,
    enabled: true,
    pointDeduction: 4,
    errorType: 'embedded_english',
    editable: true,
  },
  {
    id: 'fr_pipes_metadata',
    name: 'Pipes & Metadata',
    description: `No metadata pipes "|", extra colons, or template tags.
Clean product names only.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'bilingual_pipe_or_metadata',
    editable: true,
  },
  {
    id: 'fr_size_placement',
    name: 'Size Placement',
    description: `Pack counts, weights, volumes only in final parentheses.
Other measurements (10-in, etc.) allowed in name body.
Omit parentheses if "1 ct".`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'size_or_pack_in_name',
    editable: true,
  },
  {
    id: 'fr_unclear_wording',
    name: 'Unclear Wording or Abbreviations',
    description: `French portion must be clear and shoppable.
Deduct 3 for confusing/ambiguous/unnatural phrasing.
Deduct 1-2 for mildly awkward wording.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'unclear_wording_or_abbrev',
    editable: true,
  },
  {
    id: 'fr_name_length',
    name: 'Name Length',
    description: `Name must be ≤ 300 characters.
Deduct 3 if too long.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'name_too_long',
    editable: true,
  },
  {
    id: 'fr_missing_count',
    name: 'Missing Count from Raw Data',
    description: `If rawData shows count > 1 (e.g., "Pack of 6") and l4_size lacks it, deduct 4.
Critical: Data loss from raw source.`,
    enabled: true,
    pointDeduction: 4,
    errorType: 'size_or_pack_in_name',
    editable: true,
  },
  {
    id: 'fr_wrong_one_ct',
    name: 'Wrong "1 ct" for Weight/Volume',
    description: `Grocery/drinks/meat cannot be "1 ct".
Needs detailed sizing (weight/volume).`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'size_parentheses_invalid',
    editable: true,
  },
  {
    id: 'fr_translation_conflict',
    name: 'Translation Conflict',
    description: `French and English must match.
Contradictory (e.g., Hammer/Tournevis): -3
Translated proper nouns: -2
Size mismatch (10 po vs 24 in): -2`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'translation_conflict',
    editable: true,
  },
  {
    id: 'fr_lost_detail',
    name: 'Lost Detail from Raw Name',
    description: `Missing critical features from rawData (material, flavor, variant).
RawData is source of truth. Restore in suggestion.`,
    enabled: true,
    pointDeduction: 4,
    errorType: 'lost_critical_detail',
    editable: true,
  },
  {
    id: 'fr_special_chars',
    name: 'Special Characters',
    description: `Forbidden: _ * ^ % #
Fix French typography (d'œuf, accents) when wrong.`,
    enabled: true,
    pointDeduction: 2,
    errorType: 'special_character_issue',
    editable: true,
  },
];

// ============================================================================
// ENGLISH TEXT QA RULES
// ============================================================================

export const ENGLISH_TEXT_QA_RULES_STRUCTURED: QARule[] = [
  {
    id: 'en_formatting',
    name: 'Formatting Error',
    description: `Brand at start. Size placement:
- Parentheses: Volume, Weight, Count, Clothing sizes
- In name: Length, Width, Watts, Dimensions
Example: "Samsung 55-inch TV (1 ct)" ✅
Example: "Nike T-Shirt Size L" ✅`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'formatting_error',
    editable: true,
  },
  {
    id: 'en_lost_data',
    name: 'Lost Data from Raw Data',
    description: `Missing critical details from rawData.
Wrong product identified vs raw.
Compare cleaned vs raw carefully.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'lost_data_from_raw',
    editable: true,
  },
  {
    id: 'en_unable_identify',
    name: 'Unable to Identify Item',
    description: `Product must be clearly identifiable to customers.
No vague or ambiguous names.
Customers should know what they're buying.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'unable_to_identify_item',
    editable: true,
  },
  {
    id: 'en_unclear_wording',
    name: 'Unclear Wording or Abbreviations',
    description: `No confusing abbreviations.
Clear product description.
Avoid jargon customers won't understand.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'unclear_wording_or_abbreviations',
    editable: true,
  },
  {
    id: 'en_special_chars',
    name: 'Special Characters',
    description: `Forbidden characters: _ * ^ % #
Remove or replace with appropriate alternatives.`,
    enabled: true,
    pointDeduction: 2,
    errorType: 'special_characters',
    editable: true,
  },
];

// ============================================================================
// FRENCH IMAGE QA RULES
// ============================================================================

export const FRENCH_IMAGE_QA_RULES_STRUCTURED: QARule[] = [
  {
    id: 'fr_img_product_match',
    name: 'Product Match',
    description: `Only flag if product is completely different.
DO NOT flag packaging variations, label language, minor colors.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
  {
    id: 'fr_img_size_conflict',
    name: 'True Size Conflict',
    description: `Sizes clearly contradict (98%+ certain).
Example: l4_size = "500 g" but image shows "800 g"
Allow 15% tolerance after unit conversion.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
  {
    id: 'fr_img_pack_count',
    name: 'Missing Pack Count',
    description: `Only flag if 98%+ certain pack count is missing.
Image CLEARLY shows multipack.
Suggest format: "unit size x pack ct" (e.g., "750 g x 10 ct")
NEVER suggest: "whole size x pack"`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
];

// ============================================================================
// ENGLISH IMAGE QA RULES
// ============================================================================

export const ENGLISH_IMAGE_QA_RULES_STRUCTURED: QARule[] = [
  {
    id: 'en_img_product_match',
    name: 'Product Match',
    description: `Only flag if product is completely different.
DO NOT flag packaging, labeling, or minor variations.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
  {
    id: 'en_img_size_conflict',
    name: 'True Size Conflict',
    description: `Sizes clearly contradict (98%+ certain).
Example: l4_size = "500 g" but image shows "800 g"
Allow 15% tolerance.`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
  {
    id: 'en_img_pack_count',
    name: 'Missing Pack Count',
    description: `Only flag if 98%+ certain.
Suggest: "unit size x pack ct" (e.g., "750 g x 10 ct")
NEVER: "whole size x pack"`,
    enabled: true,
    pointDeduction: 3,
    errorType: 'image_mismatch',
    editable: true,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build prompt from rule set
 */
export function buildPromptFromRules(rules: QARule[]): string {
  const enabledRules = rules.filter(r => r.enabled);
  
  let prompt = '## Scoring System (Deduct from default 10)\n\n';
  
  enabledRules.forEach((rule, index) => {
    prompt += `${index + 1}) ${rule.name} (-${rule.pointDeduction} points)\n`;
    prompt += `   ${rule.description.replace(/\n/g, '\n   ')}\n`;
    prompt += `   Error type: "${rule.errorType}"\n\n`;
  });
  
  return prompt;
}

/**
 * Get default rules for language and QA type
 */
export function getDefaultRules(
  language: 'french' | 'english',
  qaType: 'text' | 'image'
): QARule[] {
  if (language === 'french') {
    return qaType === 'text' ? FRENCH_TEXT_QA_RULES : FRENCH_IMAGE_QA_RULES_STRUCTURED;
  } else {
    return qaType === 'text' ? ENGLISH_TEXT_QA_RULES_STRUCTURED : ENGLISH_IMAGE_QA_RULES_STRUCTURED;
  }
}


