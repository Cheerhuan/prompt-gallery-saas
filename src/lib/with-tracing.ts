import { NextRequest, NextResponse } from 'next/server';
import { Tracer } from './observability';

export function withTracing(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    const trace = Tracer.startTrace(`API_REQUEST: ${req.nextUrl.pathname}`, {
      method: req.method,
      ip: req.ip,
    });

    try {
      const response = await handler(req, ...args);
      const duration = trace.end();
      
      // Inject trace ID into response headers for debugging
      const res = new NextResponse(response.body, response);
      res.headers.set('X-Trace-ID', Tracer.getTraceId() || 'none');
      res.headers.set('X-Response-Time', `${duration}ms`);
      
      return res;
    } catch (error: any) {
      trace.end();
      console.error(`[TRACE-ERROR] traceId=${Tracer.getTraceId()} error=${error.message}`);
      throw error;
    } finally {
      Tracer.clearTrace();
    }
  };
}
