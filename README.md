# n8n Automation Portfolio

Self-initiated synthetic demos, not client work or production deployments.

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

## Cases and import files

| Case | Import |
|---|---|
| FAQ assistant, OpenAI alternative | `cases/ai-knowledge-base-assistant/workflow.json` |
| FAQ assistant, Ollama alternative | `cases/ai-knowledge-base-assistant/workflow-ollama.json` |
| Optional error metadata demo | `cases/ai-knowledge-base-assistant/error-workflow.json` |
| Lead intake | `cases/webhook-api-lead-routing/workflow.json` |
| Intentionally broken order example | `cases/workflow-troubleshooting/broken-workflow.json` |
| Validated order example | `cases/workflow-troubleshooting/fixed-workflow.json` |

In n8n use Workflows -> Import from File. All exports are inactive. Follow the case README before any isolated test activation; do not activate against real accounts or production data. The assistant alternatives share `dental-chat-demo`: select one, or change paths before activating both. Replace credentials and placeholder API URLs explicitly. Use a disposable, authenticated test environment; exported public webhooks do not provide authentication, rate limiting or a data-retention policy.

## Reproducible local regression tests

Requires Node.js 22+; verified locally with Node v26.13.0. No npm dependencies, credentials, AI, or external APIs are needed:

```sh
node --test tests/regression.test.cjs
```

Tests read the actual exported `jsCode` from JSON and execute it in `node:vm` with synthetic `$json` and prior-item mocks. Local HTTP tests bind only `127.0.0.1` on an ephemeral port and close their servers. Topology and error configuration assertions are static. The harness evaluates the actual HTTP body expressions with a small VM context, not n8n's expression engine. The controlled HTTP timeout probe uses Node fetch and then invokes the fallback Code directly; it does not prove n8n's runtime timeout dispatch.

**No n8n runtime version has been verified** for these changes. No import, activation, webhook status, item linking, branch scheduling, or model generation has been tested in n8n. These are not n8n E2E tests. Historical execution IDs and a prior T01–T15 matrix are not backed by execution exports in this repository and are not used as current evidence.

Read each case README for its input contract, setup and limits. Use synthetic data only; response sanitization does not remove upstream requests or n8n execution history.
