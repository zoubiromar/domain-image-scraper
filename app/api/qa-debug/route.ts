import { NextRequest, NextResponse } from 'next/server';
import { QA_CONFIG, NAME_QA_PROMPT } from '@/lib/qa-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Debug endpoint to test a single QA request
 * Helps identify issues with payload, response, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemName, size, rawData, model, apiKey } = body;

    console.log('[QA Debug] Testing with:', { itemName, size, rawData, model });

    const nameLength = itemName ? itemName.length : 0;

    const payload = {
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: NAME_QA_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            itemName,
            size: String(size),
            rawData: rawData || '',
            nameLength,
          }),
        },
      ],
    };

    console.log('[QA Debug] Payload size:', JSON.stringify(payload).length, 'bytes');

    const response = await fetch(QA_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('[QA Debug] Response status:', response.status);
    console.log('[QA Debug] Response OK:', response.ok);

    const responseText = await response.text();
    console.log('[QA Debug] Response preview:', responseText.substring(0, 500));

    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e: any) {
      return NextResponse.json({
        status: 'error',
        error: 'Response is not valid JSON',
        responseStatus: response.status,
        responsePreview: responseText.substring(0, 500),
        payloadSize: JSON.stringify(payload).length,
      });
    }

    // Try to parse the message content
    let messageContent;
    try {
      if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].message) {
        messageContent = JSON.parse(parsedData.choices[0].message.content);
      }
    } catch (e: any) {
      return NextResponse.json({
        status: 'error',
        error: 'Failed to parse message content',
        responseData: parsedData,
        messageContentPreview: parsedData.choices?.[0]?.message?.content?.substring(0, 200),
      });
    }

    return NextResponse.json({
      status: 'success',
      response: parsedData,
      parsedResult: messageContent,
      usage: parsedData.usage,
    });
  } catch (error: any) {
    console.error('[QA Debug] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

