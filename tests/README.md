# Local regression harness

Run from repository root with Node 22+ (actually verified on v26.13.0):

```sh
node --test tests/regression.test.cjs
```

No dependencies to install. Only ephemeral `127.0.0.1` HTTP listeners are used; all model responses, lead records and errors are synthetic. `tests/support/mock-api.cjs` can also be run directly on loopback port 8787 for an isolated manual setup. It is not a persistent CRM.

| Coverage | Evidence type |
|---|---|
| Emergency precedence, English contractions, selected German/Ukrainian examples | Real retriever `jsCode` in VM, both exports |
| Strict output contract, unknown citation rejection, under-80-word rule | Real validator `jsCode` with synthetic model responses |
| Structured request schemas | Real builder `jsCode`; no model invocation |
| Contradictory answer with allowlisted citation still passes | Explicit characterization of a limitation, not a safety success |
| Budget domain and invalid lead rejection | Real validation `jsCode`; IF/response wiring static |
| Order input types, cent precision, bounds and overflow | Real fixed `jsCode`; broken missing-customer behavior retained |
| Error metadata whitelist | Real sanitization `jsCode` with synthetic top-level, execution and trigger errors |
| Current-webhook HTTP failure handoff | Static `onError`/output-index/response edge checks plus real fallback Code |
| Sequential CRM -> guard -> notify -> result | Static edges; real guards with missing/rejected/mismatched acknowledgements |
| Mock HTTP success and rejection | Node fetch -> local server -> real Code/HTTP body expressions; harness controls execution order |
| HTTP timeout | Real Node fetch abort against local `/slow`, followed by explicit fallback Code call; not n8n timeout dispatch |
| JSON/Code syntax, names/connections, inactive workflows | Static controls, not import validation |

`run()` loads actual Code text from the workflow JSON on each call. There is no copied business implementation. Prior-item access is an explicit small `$()` mock; it is not n8n item linking. HTTP body expressions are evaluated from the export in a VM; this is not the n8n expression engine. `node:vm` is used for trusted repository code, not as an untrusted-code security sandbox.

Test fixtures are declared in `regression.test.cjs`; mock endpoint behavior is in `support/mock-api.cjs`. The HTTP harness intentionally drives a known valid sequence while separate static assertions ensure that the exported graph expresses that sequence. This does not exercise the n8n scheduler, IF engine, webhook server, credentials or execution settings. No n8n E2E or runtime compatibility claim is made.

Historical live execution exports and T01–T15 fixtures were not present. These tests do not retroactively validate them. RED/GREEN logs for this local repair are outside the repository, listed in the local audit report.
