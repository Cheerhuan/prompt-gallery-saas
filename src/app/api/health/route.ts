import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      env: 'unknown',
    },
  };

  try {
    // 1. Check Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      healthCheck.status = 'unhealthy';
      healthCheck.checks.env = 'missing_env_vars';
      return NextResponse.json(healthCheck, { status: 500 });
    }
    healthCheck.checks.env = 'ok';

    // 2. Check Database Connectivity
    // We perform a simple count or a small query to verify the connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('_health_check_dummy').select('count', { count: 'exact', head: true });

    // We don't care if the table doesn't exist (which it won't), 
    // we care if the response is a 404 (DB is alive) or a connection timeout/auth error (DB is dead).
    if (error && error.code === 'PGRST116') { // Table not found is actually a sign the DB responded
      healthCheck.checks.database = 'ok';
    } else if (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.checks.database = `error: ${error.message}`;
      return NextResponse.json(healthCheck, { status: 500 });
    } else {
      healthCheck.checks.database = 'ok';
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'unhealthy', error: e.message },
      { status: 500 }
    );
  }
}
