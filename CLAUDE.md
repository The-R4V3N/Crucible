# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WARP** is an AI agent IDE for Windows — a project-centric workspace combining terminal multiplexing, a code editor, git integration, and smart notifications. Built with Tauri v2 (Rust backend) + React (frontend) + xterm.js (terminal) + Monaco (editor).

See `ARCHITECTURE.md` for the full blueprint: layout, IPC API, milestones, and project structure.

## Tech Stack

- **Backend:** Rust (Tauri v2) — PTY management, git ops, file watching, IPC commands
- **Frontend:** React 19 + TypeScript + Tailwind CSS — UI components, layout, state
- **Terminal:** xterm.js — terminal emulation in the browser view
- **Editor:** Monaco Editor — code editing with syntax highlighting
- **Git:** git2 crate (Rust) — branch, status, diff
- **File watching:** notify crate (Rust) — real-time file change detection
- **PTY:** portable-pty crate (Rust) — ConPTY on Windows

## Development Methodology: TDD (Non-negotiable)

**Every feature follows Red-Green-Refactor. No exceptions.**

1. **Red** — Write a failing test first. The test defines the expected behavior.
2. **Green** — Write the minimum code to make the test pass.
3. **Refactor** — Clean up the code while keeping tests green.

### Rules

- Never write production code without a failing test first.
- Never skip tests "to save time." Tests ARE the work.
- Rust tests go in `src-tauri/src/` (unit) and `tests/rust/` (integration).
- Frontend tests go in `tests/frontend/` using Vitest + React Testing Library.
- Run tests before every commit. Broken tests block commits.
- Test names describe behavior: `test_session_starts_in_starting_state`, not `test1`.

## AI Workflow (Non-negotiable)

These rules govern how Claude approaches every task in this project.

### Feature workflow

1. **Plan** — Enter planning mode first. Identify every file to create/modify, define data structures, list all test cases, and flag gotchas. Get confirmation before writing anything.
2. **Red** — Write all failing tests for the feature. Run them to confirm they fail for the right reason.
3. **Green** — Write the minimum implementation to make the tests pass.
4. **Refactor** — Clean up without breaking tests.

Never skip the planning step, even for "small" changes. Planning surfaces design issues before code is written.

### Debugging workflow

1. **Reproduce** — Write a failing test that isolates and reproduces the bug. If a test already exists, confirm it fails.
2. **Fix** — Write the minimum code to make the failing test pass.
3. **Verify** — Run the full test suite to confirm nothing regressed.

Never patch code without a test that proves the bug existed and is now gone.

## Build & Run Commands

```bash
# Frontend
npm install                  # Install dependencies
npm run dev                  # Start Tauri dev mode (frontend + backend)
npm run test                 # Run frontend tests (Vitest)
npm run test:watch           # Watch mode
npm run lint                 # ESLint + Prettier check
npm run build                # Production build

# Rust backend
cd src-tauri
cargo test                   # Run all Rust tests
cargo test pty::             # Run PTY module tests only
cargo test git::             # Run git module tests only
cargo clippy                 # Lint Rust code
cargo build                  # Build backend only
```

## Project Structure

```
warp/
├── src-tauri/               # Rust backend (Tauri)
│   └── src/
│       ├── main.rs          # Tauri entry point
│       ├── lib.rs           # Module root
│       ├── pty/             # PTY session management
│       ├── git/             # Git integration
│       ├── files/           # File system ops + watcher
│       ├── config/          # Config loading + validation
│       └── commands.rs      # Tauri IPC command handlers
├── src/                     # React frontend
│   ├── components/          # UI components (sidebar/, terminal/, editor/, diff/, panels/, layout/)
│   ├── hooks/               # React hooks (useSession, useGit, useFileWatcher, useKeyboard)
│   ├── stores/              # State management (Zustand)
│   ├── lib/                 # Utilities (ipc.ts, keybindings.ts, theme.ts)
│   └── styles/              # Tailwind + custom CSS
├── tests/
│   ├── rust/                # Rust integration tests
│   └── frontend/            # React component + hook tests
├── .claude/                 # Claude Code configuration
│   ├── agents/              # Specialized sub-agents
│   ├── commands/            # Custom slash commands
│   └── skills/              # Reusable skills
└── ARCHITECTURE.md          # Full project blueprint
```

## Coding Conventions

### Rust

- Use `thiserror` for error types. No `.unwrap()` in production code (tests are fine).
- Every public function has a doc comment (`///`).
- Modules expose a clean public API via `mod.rs`. Keep internals private.
- Use `#[cfg(test)]` modules for unit tests inside source files.
- Run `cargo clippy` before committing — zero warnings policy.
- Naming: `snake_case` for functions/variables, `PascalCase` for types, `SCREAMING_SNAKE` for constants.

### TypeScript / React

- Functional components only. No class components.
- Use TypeScript strict mode. No `any` types.
- State management via Zustand stores. No prop drilling beyond 2 levels.
- Components are small and focused — one file, one responsibility.
- Use custom hooks for logic. Components should be mostly JSX.
- CSS via Tailwind utility classes. Custom CSS only for animations and complex layouts.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities/hooks.

### Git

- Commit messages: imperative mood, lowercase. Example: `add PTY session spawn logic`
- One logical change per commit. Don't bundle unrelated changes.
- Branch naming: `m1/core-terminal`, `m2/sidebar`, `m3/editor`, etc.
- Never commit to `master` directly. Always use feature branches + PR.
- Run all tests before pushing.

### General

- No hardcoded paths or secrets. Use config or environment variables.
- Add `.omc/` and `node_modules/` and `target/` to `.gitignore`.
- Keep dependencies minimal. Justify every new crate/package.
- Prefer composition over inheritance. Small functions over large ones.
- When in doubt, refer to `ARCHITECTURE.md`.

## IPC Contract (Rust ↔ React)

Commands defined in `src-tauri/src/commands.rs`. Frontend calls via `@tauri-apps/api`:

- `pty_create(path, command) → session_id`
- `pty_write(session_id, data)` / `pty_resize(session_id, rows, cols)` / `pty_kill(session_id)`
- `git_status(path)` / `git_diff(path)`
- `file_tree(path)` / `file_read(path)` / `file_write(path, content)`
- Events: `pty:output`, `pty:exit`, `file:changed`

## Brand

- Accent color: Neon Cyan `#00E5FF`
- Theme: Dark (VS Code dark base)
- Font: Cascadia Code (monospace)
- See `ARCHITECTURE.md` for full color token reference.

## Skills

### Self-Learning Skill (`.claude/skills/SKILLS.md`)

Active during all sessions. Detects learning opportunities (corrections, debug fixes, architecture decisions, gotchas) and proposes saving them to persistent memory. Always confirm before saving. See the skill file for trigger types, confirmation protocol, and storage routing.

**Memory file locations:**

```
~/.claude/projects/D--Development-WARP/memory/
├── MEMORY.md        # Index + hard rules (auto-loaded)
├── patterns.md      # Code patterns & conventions
├── debugging.md     # Debug solutions & workarounds
├── preferences.md   # User preferences
├── decisions.md     # Architecture Decision Records
└── gotchas.md       # Known pitfalls & edge cases
```

## Agents

Specialized sub-agents in `.claude/agents/`:

- **rust-backend** — Rust/Tauri backend work (PTY, git, files, IPC)
- **react-frontend** — React/TypeScript frontend (components, hooks, xterm.js, Monaco)
- **reviewer** — Code review with TDD compliance checklist
- **architect** — Architecture decisions, module boundaries, trade-off analysis

## Milestones

Current milestone tracked in branch names:

- **M1** — Core Terminal (Tauri + xterm.js + PTY)
- **M2** — Multi-session + Sidebar
- **M3** — File Editor + Explorer
- **M4** — Smart Features (notifications, splits)
- **M5** — Polish + Release
