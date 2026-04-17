---
topic: billing
date: 2026-04-01
type: fix
title: Fix duplicate invoice emails
summary: Resolved a race condition that sent customers the same invoice email twice.
---

A race condition in the invoice finalization queue caused duplicate delivery of invoice emails when two webhook events fired within the same 200 ms window. The deduplication layer now uses an idempotency key derived from the invoice ID and event timestamp.

### Root cause

The `invoice.finalized` webhook was retried by the payment provider before our acknowledgement timeout elapsed, resulting in two parallel jobs entering the email queue.

### Fix

- Added a composite idempotency key (`invoice_id + event_ts`) to the email queue consumer
- Extended the webhook acknowledgement window from 3 s to 8 s
- Added a dead-letter queue for failed dedup lookups

No customer action is required.
