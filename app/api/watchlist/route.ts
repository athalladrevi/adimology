import { NextRequest, NextResponse } from 'next/server';
import { fetchWatchlist, fetchEmitenInfo } from '@/lib/stockbit';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const watchlistData = await fetchWatchlist(groupId ? Number(groupId) : undefined);
    
    // Fetch sector for each watchlist item in parallel
    const items = watchlistData.data?.result || [];
    const itemsWithSector = await Promise.all(
      items.map(async (item: any) => {
        try {
          const emitenInfo = await fetchEmitenInfo(item.symbol || item.company_code);
          return {
            ...item,
            sector: emitenInfo?.data?.sector || undefined
          };
        } catch {
          return item; // Return without sector if fetch fails
        }
      })
    );
    
    // Update the response with sector data
    const updatedData = {
      ...watchlistData,
      data: {
        ...watchlistData.data,
        result: itemsWithSector
      }
    };

    return NextResponse.json({
      success: true,
      data: updatedData
    });

  } catch (error) {
    console.error('Watchlist API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
