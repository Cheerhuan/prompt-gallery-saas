# 🚀 Prompt Gallery SaaS Monitoring Specification

This document defines the observability standards for the project, internalizing the 'Industrial Rigor' from GSP089.

## 1. Health Check Endpoints
| Endpoint | Frequency | Expectation | Criticality |
| :--- | :--- | :--- | :--- |
| `/api/health` | 5 min | HTTP 200 + `status: healthy` | P0 (Critical) |
| `/` (Home) | 15 min | HTTP 200 + Content match | P1 (High) |

## 2. Alerting Policies
| Alert Name | Trigger Condition | Notification Channel | Action |
| :--- | :--- | :--- | :--- |
| **Service Down** | `/api/health` $
eq$ 200 for 2 consecutive polls | Telegram | Immediate investigation |
| **DB Latency** | Supabase response > 2s | Telegram | Check Supabase dashboard |
| **Build Failure** | Vercel Deployment $ightarrow$ Failed | Telegram | Check GitHub Action/Vercel logs |

## 3. Notification Workflow
`Probe` $ightarrow$ `Webhook (JSON)` $ightarrow$ `Telegram Bot API` $ightarrow$ `Owner`

## 4. Verification Pipeline
To verify the health check system:
1. Deploy code to Vercel.
2. Request `GET /api/health`.
3. Verify response: `{"status": "healthy", ...}`.
