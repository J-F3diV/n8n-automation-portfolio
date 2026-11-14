# Broken Workflow -> Validated Order Demo

Self-initiated synthetic example, not client work.

Import `broken-workflow.json` to inspect the intentionally broken baseline; it remains unchanged. Missing nested customer data throws in its Code node. The local suite proves the exception, not an actual n8n HTTP 500.

Import `fixed-workflow.json` for the validated alternative. Both exports are inactive and use distinct webhook paths. Use only an isolated test instance and synthetic data.

## Fixed input and money contract

```json
{"orderId":"order-demo","customer":{"email":"demo@example.test"},"items":[{"sku":"demo","price":19.99,"qty":3}]}
```

- Invalid email or items return `status:"rejected"` with `invalid_email` or `invalid_items`.
- Items: 1–100 entries. Price and quantity must be JSON numbers, never numeric strings, null or booleans. A genuine zero price is allowed.
- Price: finite, nonnegative, <= EUR 1,000,000,000,000. Canonical JavaScript number text must have at most two fractional digits; subcent values such as 1.005 are **rejected**, not rounded. Scientific-notation canonical text is rejected. Lexical distinctions lost by JSON parsing (e.g. 1.000 vs 1) cannot be enforced.
- Quantity: safe integer 1–10,000. Unit cents are built from decimal string components. Unit cents, line products and running cent sums must all be safe integers; overflow rejects.
- `totalCents` is the authoritative integer amount; `total` is its numeric EUR display value (`totalCents / 100`), not an arbitrary-precision decimal. Currency is EUR.

## Local verification

From repository root: `node --test tests/regression.test.cjs`.

The tests run the real exported Code in a VM with synthetic inputs: broken missing-customer exception, fixed rejection, null/blank/string/boolean values, zero price, bounded quantities, item limit, subcent policy, multiplication/aggregate overflow and an exact cent result. Connections and Code syntax are statically checked. These are not n8n E2E tests; import, webhook response status and execution behavior are not runtime verified.

Historical execution IDs 17–19 and EUR 211 were not supplied with reproducible execution exports. They are not claimed as verified results for the local changes.
