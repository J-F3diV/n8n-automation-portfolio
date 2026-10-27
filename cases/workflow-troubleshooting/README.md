# Broken Workflow -> Root Cause -> Verified Fix

## Problem
Broken workflow assumes nested customer and item fields always exist; malformed input produces a runtime exception (HTTP 500).

## Role
Self-initiated demo (not client work).

## Tech
n8n, Webhook, Code, optional chaining, validation, deterministic total.

## Solution
Fixed version uses optional access, validates email and line items, returns explicit rejection responses, and computes a deterministic total for valid input.

## How it was tested
Execution 17: broken workflow HTTP 500 on missing nested customer. Execution 18: fixed workflow HTTP 200 with invalid_email rejection. Execution 19: fixed workflow HTTP 200, valid synthetic order total EUR 211.

## Result
Verified fix with two test runs; must not imply a real client repair.
