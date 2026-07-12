# DevBrain / Engram
aliases: devbrain, engram, memory system, mcp server

**Pitch:** Personal developer memory system — context, decisions, and code snippets that persist across AI sessions.
**Status:** Built
**Stack:** SQLite, ChromaDB, MCP Server, Node.js

## The problem
Every new AI coding session starts from zero — prior decisions, conventions, and
snippets are gone. DevBrain gives any MCP-aware agent long-term memory of
Akhilesh's past work.

## How it works
- **SQLite** stores the structured record: decisions, context, snippets.
- **ChromaDB** adds vector search over the same corpus for semantic recall.
- Both sit behind an **MCP server**, so any MCP-compatible AI agent (Claude Code,
  Cursor, etc.) can query it as a native tool.

## Why it's interesting
Built end-to-end in a single Claude Code session — the memory system was itself an
exercise in the AI-assisted velocity it's designed to amplify. It's also a clean,
minimal example of the MCP pattern: local data, standard protocol, any client.
