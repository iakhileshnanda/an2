# Maya MIRO
aliases: miro, market simulation, investor personas

**Pitch:** Multi-agent market simulation — hundreds of AI investor personas debate on a simulated social feed to predict sentiment.
**Status:** Built
**Stack:** Python, Neo4j, NVIDIA NIM, GraphRAG, CAMEL-OASIS
**Link:** https://github.com/iakhileshnanda/myMayaMIRO

## What it is
A market-sentiment experiment: instead of asking one model what the market thinks,
spin up hundreds of distinct AI investor personas, put them on a simulated social
feed, and let the debate itself be the signal.

## How it works
- **CAMEL-OASIS** drives the large-scale multi-agent social simulation.
- **Neo4j + GraphRAG** back the personas with a knowledge graph, so agents argue
  from structured knowledge rather than vibes.
- **NVIDIA NIM** provides the inference at a scale (hundreds of agents) that would
  be cost-prohibitive on paid APIs.

## Why it's interesting
Multi-agent systems at actual scale — hundreds of concurrent personas — plus a
graph-backed retrieval layer. It's the most research-flavored thing in the
portfolio and the code is public.
