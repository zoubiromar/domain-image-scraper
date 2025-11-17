import { NextRequest, NextResponse } from 'next/server';
import {
  QARow,
  QAOptions,
  QAProcessedRow,
  CostTracking,
  validateQAInputs,
  processNameQABatch,
  processImageQA,
  calculateQACost,
  formatQAResults,
  determineRowsToProcess,
} from '@/lib/qa-helpers';
import { QA_CONFIG } from '@/lib/qa-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

interface QARequest {
  rows: QARow[];
  options: QAOptions;
}

interface QAResponse {
  status: 'success' | 'error';
  processedRows?: QAProcessedRow[];
  costs?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    breakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
  };
  error?: string;
  rowsProcessed?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<QAResponse>> {
  try {
    const body: QARequest = await request.json();
    const { rows, options } = body;

    console.log(`[QA API] Received request: ${rows.length} rows, Name QA: ${options.runNameQA}, Image QA: ${options.runImageQA}`);

    // Validate inputs
    const validationError = validateQAInputs(options, rows);
    if (validationError) {
      return NextResponse.json(
        { status: 'error', error: validationError },
        { status: 400 }
      );
    }

    // Determine which rows to process
    const rowsToProcess = determineRowsToProcess(
      rows,
      !options.rowCount,
      options.rowCount
    );

    console.log(`[QA API] Processing ${rowsToProcess.length} rows`);

    const allCosts: CostTracking[] = [];
    let nameQAResults: any[] | null = null;
    let imageQAResults: (any | null)[] | null = null;

    // ========================================================================
    // PHASE 1: NAME QA (Text-based, batched)
    // ========================================================================
    if (options.runNameQA) {
      console.log(`[QA API] Starting Name QA with model: ${options.model}`);
      nameQAResults = [];

      // Process in batches
      for (let i = 0; i < rowsToProcess.length; i += QA_CONFIG.batchSize) {
        const batch = rowsToProcess.slice(i, i + QA_CONFIG.batchSize);
        console.log(`[QA API] Processing Name QA batch ${Math.floor(i / QA_CONFIG.batchSize) + 1}/${Math.ceil(rowsToProcess.length / QA_CONFIG.batchSize)}`);

        const { results, costs } = await processNameQABatch(
          batch,
          options.model,
          options.apiKey,
          options.customNameQARules
        );

        nameQAResults.push(...results);
        allCosts.push(...costs);
      }

      console.log(`[QA API] Name QA complete: ${nameQAResults.length} results`);
    }

    // ========================================================================
    // PHASE 2: IMAGE QA (Vision-based, sequential)
    // ========================================================================
    if (options.runImageQA) {
      console.log(`[QA API] Starting Image QA`);
      imageQAResults = [];

      for (let i = 0; i < rowsToProcess.length; i++) {
        const row = rowsToProcess[i];
        console.log(`[QA API] Processing Image QA ${i + 1}/${rowsToProcess.length}`);

        // Determine nameToCheck (use suggestion from Name QA if available)
        let nameToCheck = row.itemName;
        if (options.runNameQA && nameQAResults && nameQAResults[i]) {
          const nameResult = nameQAResults[i];
          if (nameResult.suggestion) {
            nameToCheck = nameResult.suggestion;
          }
        }

        // Process image QA
        const { result, cost } = await processImageQA(
          row,
          nameToCheck,
          options.apiKey,
          options.customImageQARules
        );
        imageQAResults.push(result);

        if (cost) {
          allCosts.push(cost);
        }

        // Add a small delay to avoid rate limiting (reduced to 200ms for faster processing)
        if (i < rowsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`[QA API] Image QA complete: ${imageQAResults.length} results`);
    }

    // ========================================================================
    // FORMAT RESULTS
    // ========================================================================
    const processedRows = formatQAResults(rowsToProcess, nameQAResults, imageQAResults);
    const costs = calculateQACost(allCosts);

    console.log(`[QA API] Processing complete. Total cost: $${costs.totalCost.toFixed(4)}`);

    return NextResponse.json({
      status: 'success',
      processedRows,
      costs,
      rowsProcessed: rowsToProcess.length,
    });
  } catch (error: any) {
    console.error('[QA API] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Processing failed',
      },
      { status: 500 }
    );
  }
}

