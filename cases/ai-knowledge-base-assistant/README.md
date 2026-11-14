# AI Knowledge-Base Assistant (synthetic dental clinic)

Self-initiated FAQ demonstration, not client work, clinical advice, or a production service.

## Flow and limited guarantees

Webhook -> normalize -> lexical top-3 retrieval -> deterministic routing -> either handoff or model request -> model output validation -> response. Emergency examples take priority over the 500-character input limit. Supported regression examples include `can't breathe`, `can’t breathe`, `Ich kann nicht atmen`, and `Я не можу дихати`, including text longer than 500 characters. This finite phrase list is **not medical triage** and gives no universal medical safety guarantee. It can miss paraphrases, languages and emergencies and can produce false positives, including quoted or negated phrases. General retrieval remains English-oriented; locale `en/de/uk` selects the requested model response language, not a multilingual retrieval guarantee. Handoff text is English.

The model request supplies an object JSON schema (OpenAI strict `json_schema`; Ollama `format` schema). The local validator requires exactly `answer`, `citations`, `handoff`, `handoffReason`, with string, string-array, boolean and string-or-null types respectively. Answered responses additionally require a nonempty answer of fewer than 80 whitespace-separated words, nonempty citations all belonging to the retrieved IDs, `handoff:false`, and `handoffReason:null`. Malformed or handoff output takes the generic handoff path, without coercing answer objects or silently dropping unknown citations.

**An allowlisted citation is not fact checking.** It checks ID membership, not whether the answer follows from the snippet. An adversarial Sunday-opening claim with a valid opening-hours ID still passes; the regression suite explicitly records this limitation. Do not describe answered output as guaranteed factual or hallucination-free. Clinical, unsupported and adversarial wording outside the finite routing rules may still reach the model.

## Import and setup (not runtime-verified)

1. Import **one** of `workflow.json` (OpenAI) or `workflow-ollama.json` (Ollama). Both POST paths are `dental-chat-demo`; use alternatives or change paths before simultaneous activation.
2. For OpenAI, replace `REPLACE_IN_N8N` / `OPENAI_DEMO_CREDENTIAL` with an n8n Header Auth credential whose header name is `Authorization` and value is `Bearer <your-key>`. Do not place keys in this repository. This setup is documented, not invoked by local tests; any real model call is a separate opt-in action with costs/data-policy implications.
3. For Ollama, make `qwen3:8b` available and set a reachable `/api/chat` URL. `localhost:11434` is the n8n host/container's loopback, not necessarily your computer. Docker Desktop may use `host.docker.internal:11434`; test network reachability in your own isolated environment. The model/version/schema compatibility is not verified here.
4. Use synthetic POST body `{"message":"What are your opening hours?","sessionId":"demo","locale":"en"}`. Test webhook URLs require the editor to listen; production URLs require activation. Exact webhook URLs/status behavior are not verified by the Node harness.
5. HTTP nodes set top-level `onError: "continueErrorOutput"`. Output 0 remains validation; output 1 goes through `Code - HTTP Failure Handoff` to `Respond to Webhook - AI` in the **current** workflow. Fallback discards all upstream error fields. The graph is statically checked, not n8n E2E verified.
6. Optionally import `error-workflow.json`, select its actual imported ID in workflow Settings -> Error workflow (`settings.errorWorkflow`), and save. It is intentionally not prebound to an invented ID. Error Trigger is separate monitoring, not the current webhook fallback; manual executions do not exercise normal automatic Error Trigger behavior. The metadata node emits only timestamp and an allowlisted error type from nested execution/trigger or top-level error; arbitrary messages, IDs, names and stack traces are omitted. Original n8n execution data may still contain sensitive content; configure retention/redaction separately.

`knowledge-base.json` is reference data, not a runtime file loader; both retrievers embed their KB. Keep those copies synchronized.

## Public upstream error-output evidence

Retrieved n8n upstream revision `5ee5c2bf152c1a5c6eb0c1183a8d4c9b202ed4bf` (not an installed/tested runtime):

- [interfaces.ts L1843–1859](https://github.com/n8n-io/n8n/blob/5ee5c2bf152c1a5c6eb0c1183a8d4c9b202ed4bf/packages/workflow/src/interfaces.ts#L1843-L1859) defines top-level `onError` and `continueErrorOutput`.
- [workflow-execute.ts L2108–2114](https://github.com/n8n-io/n8n/blob/5ee5c2bf152c1a5c6eb0c1183a8d4c9b202ed4bf/packages/core/src/execution-engine/workflow-execute.ts#L2108-L2114) dispatches to `handleNodeErrorOutput`.
- [L3076–3181](https://github.com/n8n-io/n8n/blob/5ee5c2bf152c1a5c6eb0c1183a8d4c9b202ed4bf/packages/core/src/execution-engine/workflow-execute.ts#L3076-L3181) recognizes `item.error` or a constrained `item.json.error` and places error items on the last main output. Paired input may be merged into error output. The fallback intentionally reads no error payload fields, so it does not depend on a fabricated universal error-message shape.

## Local verification

From the repository root: `node --test tests/regression.test.cjs`.

Real exported Code runs in a VM; synthetic model responses replace models. Local Node fetch timeout and fallback invocation are separate checks. Static output-1 assertions do not prove runtime HTTP error handling, import compatibility, actual LLM compliance, or medical safety. Historical T01–T15/live timeout claims have no supplied execution exports and are not claimed as reproduced.
