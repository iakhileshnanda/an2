# Ghost
aliases: latency rig, testbed, measurement

**Pitch:** Two-laptop latency measurement system — screen capture, audio loopback, real-time message overlay.
**Status:** Built
**Stack:** Node.js, WebSockets, screen capture APIs, Oracle Cloud

## The problem
Wing-Man's coaching has to arrive within a tight latency budget or it's useless.
You can't optimize what you can't measure, so Ghost exists to measure the full
capture → transport → overlay pipeline end to end, on real hardware.

## How it works
- Two physical laptops: one captures and sends, one receives and overlays.
- Supports both **P2P** and **Oracle-relay** transport modes, so the two paths can
  be compared under identical conditions.
- Measures screen capture, audio loopback, and message overlay latency across the
  whole pipeline — not just network round-trip.

## Why it's interesting
This is the unglamorous project that makes Wing-Man credible. Building a dedicated
measurement rig before optimizing is how real-time engineering is supposed to be
done, and almost nobody does it for side projects.

## What to tell an engineer
If they only read one project, this one. Rigs are where the engineering discipline
shows — the product (Wing-Man) is downstream of the numbers this thing produced.
