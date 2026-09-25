import { NextRequest, NextResponse } from 'next/server';
import { LemonadeClient } from '@/lib/ai/lemonade-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get('baseUrl') || process.env.LEMONADE_BASE_URL || 'http://localhost:8000/v1';
  const apiKey = searchParams.get('apiKey') || process.env.LEMONADE_API_KEY || 'lemonade';
  const model = searchParams.get('model') || process.env.LEMONADE_MODEL || 'default';

  const client = new LemonadeClient(baseUrl, apiKey, model);
  const status = await client.checkHealth();

  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl, apiKey, model, testPrompt } = body;

    const client = new LemonadeClient(baseUrl, apiKey, model);
    const health = await client.checkHealth();

    if (!health.isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Could not connect to Lemonade Server at ' + (baseUrl || 'http://localhost:8000/v1'),
        health,
      });
    }

    // Run quick test calibration
    const testResult = await client.judgeRound({
      proposition: testPrompt || 'Resolved: Open Source models will surpass proprietary models.',
      roundNumber: 1,
      p1Name: 'Test Affirmative',
      p2Name: 'Test Negative',
      transcript: [
        { speakerName: 'Test Affirmative', text: 'Decentralized open research moves faster than any closed lab.' },
        { speakerName: 'Test Negative', text: 'Capital expenditure required for compute clusters favors frontier labs.' },
      ],
      claims: [
        { speakerName: 'Test Affirmative', text: 'Open research iterates faster', status: 'ASSERTED' },
        { speakerName: 'Test Negative', text: 'Frontier compute clusters dominate', status: 'ASSERTED' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Lemonade Server calibrated successfully!',
      health,
      testResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
