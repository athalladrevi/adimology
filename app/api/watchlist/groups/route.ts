import { NextResponse } from 'next/server';
import { fetchWatchlistGroups } from '@/lib/stockbit';

export async function GET() {
  try {
    const groups = await fetchWatchlistGroups();
    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error('Watchlist Groups API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
