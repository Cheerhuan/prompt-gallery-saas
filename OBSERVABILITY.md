# 👁️ Prompt Gallery SaaS 可觀測性指南

本文件定義了本專案的監控與追蹤標準，旨在實現「工業級精準」的運維能力。

## 1. 健康檢查 (Health Check)
- **端點**: `/api/health`
- **用途**: 外部探針 (UptimeRobot/GCP) 用於檢測服務可用性。
- **檢查項目**: 
  - 環境變數完整性 $\checkmark$
  - Supabase 資料庫連線 $\checkmark$
- **期望結果**: `HTTP 200` 且 `status: "healthy"`。

## 2. 監控規範 (Monitoring Spec)
詳細配置定義請參閱：`/.hermes/monitoring-spec.md`。
- **P0 級別**: `/api/health` 每 5 分鐘檢查一次 $ightarrow$ 失敗則發送 Telegram 通知。

## 3. 分佈式追蹤 (Distributed Tracing)
本專案採用輕量級追蹤模式，可精確定位 API 延遲。

### 🚀 如何在 API 中啟用追蹤？
使用 `withTracing` 包裹你的 Route Handler：

```typescript
import { withTracing } from '@/lib/with-tracing';

async function handler(req: Request) {
  // 業務邏輯...
  return Response.json({ success: true });
}

export const GET = withTracing(handler);
```

### 🔍 如何分析效能？
1. 打開瀏覽器 **DevTools $ightarrow$ Network**。
2. 查看 API 響應頭 (Response Headers)：
   - `X-Trace-ID`: 該次請求的唯一 ID（可用於在日誌中搜索）。
   - `X-Response-Time`: 該請求的精確處理時間 (ms)。

### ⏱️ 如何記錄細分步驟 (Spans)？
在函數內部使用 `Tracer`：
```typescript
import { Tracer } from '@/lib/observability';

const span = Tracer.startTrace('name_of_step', { detail: 'value' });
// ... 執行耗時操作 ...
span.end(); // 自動記錄 duration 並輸出至日誌
```
