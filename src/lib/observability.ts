import { v4 as uuidv4 } from 'uuid';

export interface TraceSpan {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class Tracer {
  private static traceId: string | null = null;

  static startTrace(name: string, metadata: Record<string, any> = {}) {
    if (!this.traceId) {
      this.traceId = uuidv4();
    }
    
    const spanId = uuidv4().slice(0, 8);
    const startTime = Date.now();
    
    console.log(`[TRACE-START] traceId=${this.traceId} spanId=${spanId} name=${name}`, metadata);
    
    return {
      spanId,
      startTime,
      end: () => {
        const duration = Date.now() - startTime;
        console.log(`[TRACE-END] traceId=${this.traceId} spanId=${spanId} duration=${duration}ms`);
        return duration;
      }
    };
  }

  static getTraceId() {
    return this.traceId;
  }

  static clearTrace() {
    this.traceId = null;
  }
}
