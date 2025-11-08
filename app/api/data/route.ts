import { NextRequest, NextResponse } from 'next/server';
import { generateInitialDataset, generateNewDataPoint } from '@/lib/dataGenerator';
import { DataPoint } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const count = parseInt(searchParams.get('count') || '10000', 10);
  const type = searchParams.get('type') || 'initial';

  try {
    if (type === 'initial') {
      const data = generateInitialDataset(count);
      return NextResponse.json({ data, count: data.length });
    } else if (type === 'new') {
      const lastTimestamp = parseInt(searchParams.get('lastTimestamp') || '0', 10);
      const newPoint = generateNewDataPoint(lastTimestamp);
      return NextResponse.json({ data: [newPoint] });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate data' },
      { status: 500 }
    );
  }
}

