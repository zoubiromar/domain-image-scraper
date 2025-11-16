import {
  QA_CONFIG,
  NAME_QA_PROMPT,
  IMAGE_QA_PROMPT,
  MODEL_PRICING,
  QAModel,
  QA_OUTPUT_COLUMNS,
} from './qa-config';

// ============================================================================
// TYPES
// ============================================================================

export interface QARow {
  itemName: string;
  size: string;
  rawData?: string;
  imageUrl?: string;
  [key: string]: any; // Original CSV columns
}

export interface NameQAResult {
  score: number;
  errorTypes: string[];
  comments: string;
  suggestion: string;
}

export interface ImageQAResult {
  isMismatch: boolean;
  reason?: string;
  newSuggestion?: string;
  extractedInfo?: string;
  extractedSize?: string;
}

export interface QAProcessedRow extends QARow {
  'QA Score': number | string;
  'Error Type': string;
  'Comments': string;
  'Suggested Correction': string;
  'name_length': number;
  'image x name review'?: string;
  'Suggested Size'?: string;
}

export interface CostTracking {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface QAOptions {
  runNameQA: boolean;
  runImageQA: boolean;
  model: QAModel;
  apiKey: string;
  rowCount?: number; // undefined = process all
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateQAInputs(options: QAOptions, rows: QARow[]): string | null {
  if (!options.apiKey || options.apiKey.length < 10) {
    return 'Invalid API key';
  }

  if (!options.runNameQA && !options.runImageQA) {
    return 'Please select at least one QA type';
  }

  if (rows.length === 0) {
    return 'No rows to process';
  }

  // Validate required columns
  const firstRow = rows[0];
  if (!firstRow.itemName || !firstRow.size) {
    return 'Missing required columns: itemName or size';
  }

  if (options.runNameQA && !firstRow.rawData) {
    return 'Name QA requires rawData column';
  }

  if (options.runImageQA && !firstRow.imageUrl) {
    return 'Image QA requires imageUrl column';
  }

  return null; // Valid
}

// ============================================================================
// NAME QA (Text-based)
// ============================================================================

export async function processNameQABatch(
  rows: QARow[],
  model: QAModel,
  apiKey: string
): Promise<{ results: NameQAResult[]; costs: CostTracking[] }> {
  const costs: CostTracking[] = [];
  
  // Build parallel requests
  const requests = rows.map(row => {
    const nameLength = row.itemName ? row.itemName.length : 0;
    
    return fetch(QA_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NAME_QA_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              itemName: row.itemName,
              size: String(row.size),
              rawData: row.rawData || '',
              nameLength,
            }),
          },
        ],
      }),
    });
  });

  // Execute all requests in parallel
  const responses = await Promise.all(requests);
  
  // Parse results
  const results: NameQAResult[] = [];
  
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const rowInfo = `Row ${i + 1}: ${rows[i].itemName?.substring(0, 50) || 'unknown'}`;
    
    if (response.ok) {
      try {
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (jsonError: any) {
          console.error(`[Name QA] Invalid JSON response for ${rowInfo}`);
          console.error('Response preview:', responseText.substring(0, 200));
          results.push({
            score: 1,
            errorTypes: ['API Error'],
            comments: `Invalid JSON response from API`,
            suggestion: '',
          });
          continue;
        }
        
        // Track costs
        if (data.usage) {
          costs.push({
            model,
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens,
          });
        }
        
        // Parse result
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error(`[Name QA] Unexpected response structure for ${rowInfo}`);
          results.push({
            score: 1,
            errorTypes: ['API Error'],
            comments: `Unexpected API response structure`,
            suggestion: '',
          });
          continue;
        }

        const messageContent = data.choices[0].message.content;
        let resultJson;
        
        try {
          resultJson = JSON.parse(messageContent);
        } catch (contentError: any) {
          console.error(`[Name QA] Failed to parse message content for ${rowInfo}`);
          console.error('Content preview:', messageContent?.substring(0, 200));
          results.push({
            score: 1,
            errorTypes: ['API Error'],
            comments: `Failed to parse AI response`,
            suggestion: '',
          });
          continue;
        }

        results.push({
          score: resultJson.score || 1,
          errorTypes: resultJson.errorTypes || [],
          comments: resultJson.comments || 'No comment.',
          suggestion: resultJson.suggestion || '',
        });
      } catch (e: any) {
        console.error(`[Name QA] Processing error for ${rowInfo}:`, e.message);
        results.push({
          score: 1,
          errorTypes: ['API Error'],
          comments: `Error: ${e.message.substring(0, 50)}`,
          suggestion: '',
        });
      }
    } else {
      // Try to get error details
      let errorDetails = `Status ${response.status}`;
      try {
        const errorText = await response.text();
        errorDetails = errorText.substring(0, 200);
        console.error(`[Name QA] API Error for ${rowInfo}:`, errorDetails);
      } catch (e) {
        console.error(`[Name QA] Could not read error for ${rowInfo}`);
      }
      
      results.push({
        score: 1,
        errorTypes: ['API Error'],
        comments: `API Error ${response.status}`,
        suggestion: '',
      });
    }
  }
  
  return { results, costs };
}

// ============================================================================
// IMAGE QA (Vision-based)
// ============================================================================

export async function processImageQA(
  row: QARow,
  nameToCheck: string, // May be suggestion from Name QA
  apiKey: string
): Promise<{ result: ImageQAResult; cost?: CostTracking }> {
  if (!row.imageUrl || typeof row.imageUrl !== 'string' || !row.imageUrl.startsWith('http')) {
    return {
      result: {
        isMismatch: false,
      },
    };
  }

  try {
    // Fetch image
    const imageResponse = await fetch(row.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Check image size (OpenAI has a limit of ~20MB for base64 images)
    const imageSizeMB = imageBuffer.byteLength / (1024 * 1024);
    if (imageSizeMB > 18) {
      console.warn(`[Image QA] Image too large: ${imageSizeMB.toFixed(2)}MB for ${row.imageUrl}`);
      return {
        result: {
          isMismatch: false,
        },
      };
    }

    // Call vision API
    const apiResponse = await fetch(QA_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: IMAGE_QA_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  nameToCheck,
                  l4_size: row.size,
                }),
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!apiResponse.ok) {
      // Try to get error details
      let errorText = `Status ${apiResponse.status}`;
      try {
        const errorData = await apiResponse.text();
        errorText = errorData.substring(0, 200);
      } catch (e) {
        // Ignore if we can't read the error
      }
      console.error(`[Image QA] Vision API Error: ${errorText}`);
      throw new Error(`Vision API Error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    // Track cost
    const cost: CostTracking | undefined = data.usage
      ? {
          model: 'gpt-4o',
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
        }
      : undefined;

    // Parse result
    const resultJson = JSON.parse(data.choices[0].message.content);
    
    return { result: resultJson, cost };
  } catch (e: any) {
    console.error(`[Image QA] Error processing image for ${row.imageUrl}:`, e.message);
    return {
      result: {
        isMismatch: false,
      },
    };
  }
}

// ============================================================================
// COST CALCULATION
// ============================================================================

export function calculateQACost(costs: CostTracking[]): {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  breakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
} {
  const breakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  costs.forEach(({ model, inputTokens, outputTokens }) => {
    if (!breakdown[model]) {
      breakdown[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
    }

    breakdown[model].inputTokens += inputTokens;
    breakdown[model].outputTokens += outputTokens;

    // Calculate cost
    const pricing = MODEL_PRICING[model as QAModel];
    if (pricing) {
      const inputCost = (inputTokens / 1_000_000) * pricing.input;
      const outputCost = (outputTokens / 1_000_000) * pricing.output;
      breakdown[model].cost += inputCost + outputCost;
      totalCost += inputCost + outputCost;
    }

    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
  });

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    breakdown,
  };
}

// ============================================================================
// RESULT FORMATTING
// ============================================================================

export function formatQAResults(
  rows: QARow[],
  nameQAResults: NameQAResult[] | null,
  imageQAResults: (ImageQAResult | null)[] | null
): QAProcessedRow[] {
  return rows.map((row, index) => {
    const processedRow: QAProcessedRow = {
      ...row,
      'QA Score': 10,
      'Error Type': '',
      'Comments': 'No issues found',
      'Suggested Correction': '',
      'name_length': row.itemName ? row.itemName.length : 0,
    };

    // Apply Name QA results
    if (nameQAResults && nameQAResults[index]) {
      const nameResult = nameQAResults[index];
      processedRow['QA Score'] = nameResult.score;
      processedRow['Error Type'] = nameResult.errorTypes.join(', ');
      processedRow['Comments'] = nameResult.comments;
      processedRow['Suggested Correction'] = nameResult.suggestion;
    }

    // Apply Image QA results (modifies existing Name QA results)
    if (imageQAResults && imageQAResults[index] && imageQAResults[index]?.isMismatch) {
      const imageResult = imageQAResults[index]!;
      
      // Deduct 3 from score
      const currentScore = typeof processedRow['QA Score'] === 'number'
        ? processedRow['QA Score']
        : 10;
      processedRow['QA Score'] = Math.max(1, currentScore - 3);

      // Append to error types
      const currentErrors = processedRow['Error Type']
        ? processedRow['Error Type'].split(', ').filter(e => e)
        : [];
      if (!currentErrors.includes('Image Mismatch')) {
        currentErrors.push('Image Mismatch');
      }
      processedRow['Error Type'] = currentErrors.join(', ');

      // Append to comments
      const currentComments = processedRow['Comments'] || '';
      const newComments = currentComments === 'No issues found'
        ? `Image: ${imageResult.reason || 'Mismatch'}`
        : `${currentComments}; Image: ${imageResult.reason || 'Mismatch'}`;
      processedRow['Comments'] = newComments;

      // Update suggestion and size if provided
      if (imageResult.newSuggestion) {
        processedRow['Suggested Correction'] = imageResult.newSuggestion;
      }
      if (imageResult.extractedInfo) {
        processedRow['image x name review'] = imageResult.extractedInfo;
      }
      if (imageResult.extractedSize) {
        processedRow['Suggested Size'] = imageResult.extractedSize;
      }
    } else if (imageQAResults && imageQAResults[index]) {
      // No mismatch, but still populate imageReview if needed
      processedRow['image x name review'] = '';
      processedRow['Suggested Size'] = '';
    }

    return processedRow;
  });
}

// ============================================================================
// DETERMINE ROWS TO PROCESS
// ============================================================================

export function determineRowsToProcess(
  allRows: QARow[],
  processAll: boolean,
  customRowCount?: number
): QARow[] {
  if (processAll) {
    return allRows;
  }
  
  if (customRowCount && customRowCount > 0) {
    return allRows.slice(0, customRowCount);
  }
  
  return allRows;
}

