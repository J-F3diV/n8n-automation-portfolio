# Webhook + API Lead Routing

Synthetic independent demo, not a production CRM or notification integration.

## Contract

POST input example:

```json
{"leadId":"demo-1","name":"Demo","email":"demo@example.test","service":"automation","budget":1000,"source":"website"}
```

Required nonempty lead ID, name, service and syntactically valid email. Budget must be a finite nonnegative EUR number <= 1,000,000 or an unsigned decimal numeric string (no whitespace/exponent). Missing, null, boolean, object, NaN and Infinity reject. Priority: >=1000 high, >=400 normal, otherwise low. Invalid input returns `rejected/invalid_lead` through a dedicated response configured as 400 (configuration statically checked, actual n8n status not verified).

Sequential graph: validate -> IF -> enrich -> build -> CRM -> verify CRM acknowledgement -> notify -> verify notification acknowledgement -> result -> respond. Notification cannot be reached along this graph before the CRM guard. Success flags are produced only after matching acknowledgements, not merely because a branch ran.

## Local mock API and isolated n8n setup

From repository root:

```sh
node tests/support/mock-api.cjs
```

It listens only on `127.0.0.1:8787` (`PORT` can override). Keep it running in a separate terminal, stop with Ctrl-C. Replace **all three** `https://your-mock-api.example.com` URL bases in an isolated imported workflow with `http://127.0.0.1:8787` if n8n runs on this same host/network namespace. Docker loopback is different: expose/forward a mock endpoint deliberately if needed; this loopback-only server is not automatically reachable from a container. No workflow is changed or activated by this command.

Mock endpoints accept JSON POST and return JSON bodies on HTTP 200:

| Endpoint | Request | Response |
|---|---|---|
| `/enrich` | validated lead with `leadId` | `{"companySize":"synthetic-small","region":"demo-EU"}` |
| `/crm` | built row with `lead_id` | `{"saved":true,"leadId":"demo-1","crmId":"crm-demo-1"}` |
| `/notify` | alert with `leadId`, `channel:"sales-demo"`, text; requires earlier saved lead in this mock process | `{"sent":true,"leadId":"demo-1","notificationId":"notification-demo-1"}` |

CRM and notification guards require literal true flags, matching lead IDs and nonempty string record IDs. HTTP Request default JSON response bodies are used, not full-response envelopes. Non-2xx HTTP failures stop the lead workflow by default; invalid 2xx acknowledgements throw a fixed technical error and never generate a processed success. A controlled lead-side response for downstream failures is not implemented. Enrichment fields remain optional demo metadata, not an independently validated enrichment schema.

The mock is in-memory and synthetic: acknowledgement means only that this mock accepted the operation, not durable storage or real delivery. There is **no idempotency**, retry deduplication, atomic transaction or compensation; a CRM success followed by notification failure leaves a partial operation. Do not use it for real leads.

## Reproducible checks and limits

`node --test tests/regression.test.cjs` from repository root starts ephemeral loopback mocks automatically. It executes real exported Code and actual HTTP body expressions in `node:vm`, and makes real localhost HTTP requests for success, rejected CRM (notification not called), and rejected notification (no processed success). Static assertions check sequential edges and rejection routing. The harness is not n8n's expression/item-linking engine and is **not n8n E2E**.

Historical execution 16 has no supplied raw execution export and is not evidence for these changes. Import, activation, webhook HTTP status and actual CRM/notification delivery remain unverified. No external accounts or APIs are used by local tests.
