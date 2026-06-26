import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: 'unhealthy', error: e.message },
      { status: 500 }
    );
  }
}
