# AI Loan Discovery Platform
aliases: loan discovery, loan matching, rag loans

**Pitch:** RAG-based loan matching for the Indian market.
**Status:** In Progress
**Stack:** RAG pipeline, Claude API, Node.js, Python

## What it is
A loan discovery product for India: a Claude API backend over a retrieval pipeline
that matches borrowers to suitable loan products.

## The plan
Deliberate crawl-walk-run: start with retrieval (RAG) over loan product data, then
fine-tune on Kaggle once real user data is collected. Retrieval first because it
ships now; tuning later because it needs data that only a shipped product produces.

## Why it's interesting
The sequencing is the point — most people either stop at RAG or jump straight to
fine-tuning without data. This has an explicit path from one to the other, gated
on real usage.
