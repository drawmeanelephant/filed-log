---
topic: integrations
date: 2026-03-28
type: breaking
title: Webhook payload v2 migration
summary: Webhook payloads now use the v2 envelope format — v1 is deprecated and will be removed on 2026-06-01.
---

All outgoing webhook payloads have been upgraded to the **v2 envelope format**. The v1 format is deprecated effective immediately and will stop being sent on **2026-06-01**.

### What changed

| Field | v1 | v2 |
|---|---|---|
| Top-level key | `data` | `payload` |
| Timestamp format | Unix epoch (seconds) | ISO 8601 |
| Event naming | `snake_case` | `dot.notation` (e.g. `invoice.created`) |
| Signature header | `X-Webhook-Sig` | `X-Signature-256` (HMAC-SHA256) |

### Migration steps

1. Update your handler to read from `payload` instead of `data`
2. Parse timestamps as ISO 8601
3. Update event-name filters to dot notation
4. Rotate your webhook secret and verify against `X-Signature-256`

### Deprecation timeline

- **Now** — v2 payloads are the default; v1 still sent in parallel
- **2026-05-01** — v1 payloads marked as legacy in the dashboard
- **2026-06-01** — v1 payloads permanently disabled
