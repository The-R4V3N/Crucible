---
name: Missing test (TDD debt)
about: Flag production code that was shipped without a failing test first
title: "test: missing coverage for "
labels: tdd-debt
assignees: ""
---

## What is untested

<!-- File, function, or behaviour that has no test. -->

**File:** `src/...`
**Function / behaviour:**

## Why it matters

<!-- What bug could slip through without this test? What regression risk does it create? -->

## Suggested test cases

<!-- List the behaviours that should be covered. -->

- [ ]
- [ ]

## TDD note

Per `CLAUDE.md`, no production code should exist without a prior failing test.
This issue tracks the debt so it can be paid back with a proper RED → GREEN cycle.
