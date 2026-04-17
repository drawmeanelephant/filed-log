---
topic: billing
date: 2026-03-12
type: feature
title: Multi-currency support
summary: Accept payments in 30+ currencies with automatic exchange-rate conversion.
---

We've rolled out full multi-currency support across the billing pipeline. When a customer checks out, the system now detects their locale and presents prices in their local currency, backed by daily exchange-rate feeds from the ECB.

### What's included

- Automatic locale detection at checkout
- Real-time exchange-rate sync (updated every 4 hours)
- Per-invoice currency locking so the rate is fixed at time of purchase
- Dashboard reporting toggle to view revenue in your base currency or the customer's

### Migration notes

Existing invoices are unaffected. New invoices created after this release will include a `currency` field in the API response. See the [Billing API docs](#) for details.
