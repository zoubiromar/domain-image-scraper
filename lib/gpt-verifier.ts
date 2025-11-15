import OpenAI from 'openai';

interface GPTResult {
  matchedName: string | null;
  score: number;
  reasoning: string;
}

interface Candidate {
  name: string;
  score: number;
}

function getAlcoholPrompt(): string {
  return `You are an alcohol product matcher. Compare input with candidates and score based on product identity, not minor wording differences.

CRITICAL: Score HIGH (10) for same brand/product/size even with minor spelling or format differences. Score LOW only for ACTUAL mismatches.

SCORING (Use full 1-10 range):
10 = SAME PRODUCT: Same brand, same type, same size. Minor spelling/format OK
    Examples: "Rumchata 750ml" vs "RumChata Cream Liqueur Bottle (750 ml)" → 10
              "Grand marnier 750ml" vs "Grand Marnier Liqueur Bottle (750 ml)" → 10
9 = VERY CONFIDENT: Same product, one detail unclear from input
8 = CONFIDENT: Same brand/type, size not specified in input
7 = LIKELY: Same brand, variant possibly different
6 = POSSIBLE: Probably same but uncertain variant
5 = AMBIGUOUS: Might be same, significant doubt
4-1 = DIFFERENT: Actually different products/brands/types

IGNORE (Don't penalize):
✅ Spelling, Liquor/Liqueur, Added words, Apostrophes, Size format

ONLY PENALIZE:
❌ Different BRANDS → 1-3
❌ Different VARIANTS (Corona vs Corona Light) → 2-4
❌ Different TYPES (Vodka vs Whiskey) → 1
❌ Different SIZES (750ml vs 1L, 12pk vs 6pk) → 3-5

Return JSON: {"matchedName": "<name or null>", "score": <1-10>, "reasoning": "<why>"}

REMEMBER: same brand+type+size = 10!`;
}

function getCnGPrompt(): string {
  return `You are a convenience & grocery product matcher. Compare an input item with catalog candidates and score based on true product identity (brand, variant/flavor/type, package size/format), not minor wording differences.

CATALOG SCOPE: Snacks, non-alcoholic drinks, and alcohol. Think chips, candy, cookies, soda/energy drinks/water/juice, beer/wine/spirits, ready-to-drink cocktails.

CRITICAL: Score HIGH (10) for same brand + same variant/type/flavor + same package/size — even if spelling, punctuation, or format differ. Score LOW only for ACTUAL mismatches.

SCORING (Use full 1-10 range):
10 = SAME PRODUCT: Same brand, same variant/flavor/type, same size/format. Minor spelling/format OK.
   "Coke Zero Sugar 12oz x 12" vs "Coca-Cola Zero Sugar Soda Cans (12 oz × 12 ct)" → 10
   "Doritos Nacho Cheese 9.25oz" vs "Doritos Tortilla Chips Nacho Cheese (9.25 oz)" → 10
9 = VERY CONFIDENT: Same product but one detail is implicit or slightly unclear
8 = CONFIDENT: Same brand/type/variant, but size or count not specified in input
7 = LIKELY: Same brand but variant might differ
6 = POSSIBLE: Probably same line but variant/size ambiguity remains
5 = AMBIGUOUS: Might be same; significant doubt
4-1 = DIFFERENT: Actually different brands, types, flavors, or materially different sizes

IGNORE (Don't penalize):
✅ Spelling, punctuation, capitalization
✅ Filler descriptors: "Bottle", "Can(s)", "Bag", "Soda", "Chips"
✅ Size format: "12oz" = "12 oz" = "(12 oz)"

ONLY PENALIZE:
❌ Different BRANDS → 1-3
❌ Different VARIANTS/FLAVORS (Coke vs Coke Zero, Nacho vs Cool Ranch) → 2-4
❌ Different TYPES (Water vs Energy, Vodka vs Whiskey) → 1-3
❌ Different SIZES (9.25oz vs 10oz, 12pk vs 6pk) → 3-5

Return JSON: {"matchedName": "<name or null>", "score": <1-10>, "reasoning": "<why>"}`;
}

export async function verifyWithGPT(
  productName: string,
  candidates: Candidate[],
  productType: 'alcohol' | 'cng',
  apiKey: string
): Promise<GPTResult> {
  const client = new OpenAI({ apiKey });
  
  const candidateList = candidates
    .map((c, i) => `${i + 1}. ${c.name} (Hybrid score: ${c.score.toFixed(1)}/10)`)
    .join('\n');
  
  const systemPrompt = productType === 'cng' ? getCnGPrompt() : getAlcoholPrompt();
  
  const userPrompt = `Product: "${productName}"

Candidates:
${candidateList}

REMINDERS:
- Score 10 for clear matches
- Default lower if uncertain
- Below 5 = REJECTED`;
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      matchedName: result.matchedName || null,
      score: result.score || 0,
      reasoning: result.reasoning || '',
    };
  } catch (error) {
    console.error('GPT verification error:', error);
    // Fallback to best hybrid candidate
    return {
      matchedName: candidates[0]?.name || null,
      score: Math.round(candidates[0]?.score || 0),
      reasoning: 'GPT failed, using hybrid score',
    };
  }
}

// Batch GPT verification for multiple products
export async function batchVerifyWithGPT(
  products: Array<{ name: string; candidates: Candidate[] }>,
  productType: 'alcohol' | 'cng',
  apiKey: string
): Promise<GPTResult[]> {
  // Process in parallel (up to 5 at a time to avoid rate limits)
  const CONCURRENT_LIMIT = 5;
  const results: GPTResult[] = [];
  
  for (let i = 0; i < products.length; i += CONCURRENT_LIMIT) {
    const batch = products.slice(i, i + CONCURRENT_LIMIT);
    const batchResults = await Promise.all(
      batch.map(p => verifyWithGPT(p.name, p.candidates, productType, apiKey))
    );
    results.push(...batchResults);
  }
  
  return results;
}

