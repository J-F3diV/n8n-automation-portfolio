# Webhook + API Lead Routing

## Problem
Accept a webhook lead, validate it, enrich via API, compute priority, store CRM-style row, notify, return sanitized response.

## Role
Self-initiated demo (not client work).

## Tech
n8n, Webhook, Code, HTTP Request, mock API (no external credentials).

## Solution
Webhook -> validation -> enrichment API -> priority logic -> CRM write -> notification -> sanitized HTTP 200 response.

## How it was tested
Live execution 16 completed successfully on 2026-10-15: synthetic lead accepted, enrichment called, CRM row saved, notification sent, HTTP 200 returned.

## Result
Live-tested independent demo on synthetic data; not a client deployment or real Google Sheets/Telegram integration.
