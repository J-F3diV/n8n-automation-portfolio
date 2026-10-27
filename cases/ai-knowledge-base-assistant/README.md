# AI Knowledge-Base Assistant (synthetic dental clinic)

## Problem
Website chatbot must answer FAQ only from a local knowledge base, avoid hallucination, and hand off unsafe/unsupported/booking/emergency/medical-advice requests to a human.

## Role
Self-initiated demo (not client work).

## Tech
n8n, Webhook, Code (lexical retriever), IF, OpenAI Chat Completions (Header Auth), Respond to Webhook, Error Trigger.

## Solution
Webhook -> normalize/validate -> top-3 KB retrieval -> IF route. Handoff branch returns handoff JSON (LLM skipped for emergency/invalid). Answer branch calls OpenAI with strict JSON contract, then validates citations against allow-list.

## How it was tested
15-case test matrix (T01-T15) on synthetic inputs, including prompt injection, malformed model output, bad citation, empty/oversized message, timeout.

## Result
Every factual answer has >=1 allow-listed citation; unsafe/unsupported/malformed cases hand off without inventing facts.
