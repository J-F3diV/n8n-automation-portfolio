# n8n Automation Portfolio

Self-initiated demo projects built with n8n on synthetic data. Not client work.

## 🚀 Live demo

**[demo.wiquall.com](https://demo.wiquall.com)** — try the lead-routing workflow in your browser.

A sample lead goes through a real n8n workflow: validation → enrichment → budget-based
priority → storage → team notification. The dashboard shows the result immediately.

- Success is reported only after storage and notification are both acknowledged
- Idempotent: repeating the same lead does not create duplicates
- Invalid input → HTTP 400; downstream failure → controlled HTTP 503
- Isolated container without internet access, rate limiting, strict origin checks

The demo uses synthetic data only; the CRM and notifications are demo stand-ins,
not real integrations. The workflow is derived from
[`cases/webhook-api-lead-routing`](cases/webhook-api-lead-routing).

## Cases

| Case | Description | Files |
|------|-------------|-------|
| AI Knowledge-Base Assistant | Grounded FAQ chatbot: lexical retrieval, safety routing, OpenAI answer with citation validation, human handoff, emergency branch (LLM skipped) | `cases/ai-knowledge-base-assistant/` |
| Webhook + API Lead Routing | Webhook intake -> validation -> enrichment API -> priority -> CRM row -> notification -> sanitized response | `cases/webhook-api-lead-routing/` |
| Workflow Troubleshooting | Broken workflow (HTTP 500 on missing nested customer) -> root cause -> verified fix (two test runs) | `cases/workflow-troubleshooting/` |

## Import into n8n

1. In n8n, go to Workflows -> Import from File.
2. Import the `workflow.json` (and `error-workflow.json` where present) of a case.
3. Recreate credentials in your n8n instance (exported files contain placeholder credential IDs).
4. Adjust webhook paths / mock API URLs as needed.

## Note

All data is synthetic/demo. No real clients, patients, or production deployments.
