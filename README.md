# n8n Automation Portfolio

Self-initiated demo projects built with n8n on synthetic data. Not client work.

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
