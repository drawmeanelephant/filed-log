---
topic: integrations
date: 2026-04-14
type: feature
title: Native Slack integration
summary: Push changelog updates, alerts, and weekly digests directly to Slack channels.
---

Connect your workspace to Slack in one click and start receiving changelog updates, billing alerts, and weekly digest summaries directly in the channels you choose.

### Setup

1. Navigate to **Settings → Integrations → Slack**
2. Click **Connect to Slack** and authorise the app
3. Choose a default channel for notifications
4. Optionally configure per-topic channel routing

### Notification types

| Type | Description | Default |
|---|---|---|
| **New entry** | Fires when a changelog entry is published | ✅ On |
| **Billing alert** | Payment failures, upcoming renewals | ✅ On |
| **Weekly digest** | Summary of all changes from the past 7 days | ❌ Off |

### Permissions

The Slack app requests only `chat:write` and `channels:read` scopes. No message history is accessed.
