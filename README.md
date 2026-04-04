<div align="center">

# WARP

**An AI agent IDE for Windows — project-centric workspace combining terminal multiplexing, a code editor, git integration, and smart notifications.**

[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://v2.tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-backend-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License CC BY-NC-SA 4.0](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-blue?style=for-the-badge)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![xterm.js](https://img.shields.io/badge/terminal-xterm.js-000000?logo=windowsterminal&logoColor=white)](#tech-stack)
[![Monaco](https://img.shields.io/badge/editor-Monaco-007ACC?logo=visualstudiocode&logoColor=white)](#tech-stack)
[![last commit](https://img.shields.io/github/last-commit/The-R4V3N/WARP)](https://github.com/The-R4V3N/WARP/commits/master)

<br/>

[Features](#features) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Configuration](#configuration) · [Contributing](#contributing)

</div>

---

WARP is a desktop IDE built for developers who live in the terminal. It wraps multiple PTY sessions, a Monaco code editor, git tooling, and smart notifications into a single Tauri-powered window — native performance, no Electron, no browser tab.

> **One workspace. Every project. Zero context switching.**

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Terminal

- **Multi-project terminals** — Run multiple PTY sessions side-by-side
- **Terminal tabs** — Multiple tabs per project with `+` button and per-tab close
- **Split panes** — Vertical and horizontal split views (`Ctrl+\`)
- **Session persistence** — Active project restored on restart
- **Auto-save** — Files saved automatically on tab switch and window blur
- **ConPTY native** — Real Windows terminal, not a wrapper

</td>
<td width="50%" valign="top">

### Editor & Files

- **Monaco editor** — Syntax highlighting, file tabs, full editing
- **File explorer** — Browse, open, rename, delete files from the sidebar
- **Right-click context menu** — New file/folder, rename inline, delete with confirmation, copy path
- **Project search** — Search across all project files (`Ctrl+Shift+F`)
- **Find in file** — Search within the active file (`Ctrl+F`)
- **Command Palette** — Quick access to all commands (`Ctrl+Shift+P`)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Git

- **Branch status** — Current branch always visible in status bar
- **Changed files** — Badge count on the Source Control icon
- **Inline diffs** — Review changes without leaving the IDE
- **Stage/unstage/discard** — Full git workflow from the sidebar

</td>
<td width="50%" valign="top">

### Workflow

- **Project management** — Add/remove projects via folder picker
- **Smart notifications** — Attention detection with sidebar indicators and border glow
- **Settings modal** — Font, theme, cursor, zoom, sidebar position, accent color — all configurable
- **Keyboard-driven** — F-key project switching, full keybinding support
- **Edit menu** — Find in File, Find in Project, Command Palette via menu bar

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for Windows

### Install & Run

```bash
git clone https://github.com/The-R4V3N/WARP.git
cd WARP
npm install
npm run dev
```

This starts both the Vite dev server and the Tauri/Rust backend.

### Run Tests

```bash
npm run test                    # Frontend tests (Vitest)
cd src-tauri && cargo test      # Rust tests
```

### Build for Production

```bash
npm run build
```

Produces a Windows installer (`.msi`/`.exe`) in `src-tauri/target/release/bundle/`.

---

## Architecture

```text
warp/
├── src-tauri/               Rust backend (Tauri v2)
│   └── src/
│       ├── main.rs          Tauri entry point
│       ├── pty/             PTY session management (ConPTY)
│       ├── git/             Git integration (git2)
│       ├── files/           File system ops + watcher (notify)
│       ├── config/          Config loading + validation
│       └── commands.rs      IPC command handlers
│
├── src/                     React frontend
│   ├── components/          UI — sidebar, terminal, editor, explorer, diff, panels, layout, settings, palette, search
│   ├── hooks/               useSession, useGit, useFileWatcher, useKeyboard, useAutoSave, useEditorCursor, useGitDecorations
│   ├── stores/              State management (Zustand) — session, editor, ui, config, file, palette
│   ├── lib/                 Utilities — ipc, keybindings, theme
│   └── styles/              Tailwind + custom CSS
│
└── tests/
    ├── rust/                Rust integration tests
    └── frontend/            React component + hook tests
```

<details>
<summary><strong>IPC Contract (Rust ↔ React)</strong></summary>

Commands defined in `src-tauri/src/commands.rs`, called via `@tauri-apps/api`:

| Command | Description |
|---------|-------------|
| `pty_create(path, command)` | Spawn a new PTY session → returns `session_id` |
| `pty_write(session_id, data)` | Write input to a PTY session |
| `pty_resize(session_id, rows, cols)` | Resize the terminal |
| `pty_kill(session_id)` | Kill a PTY session |
| `git_status(path)` | Get git status for a project |
| `git_diff(path)` | Get git diff output |
| `file_tree(path)` | List directory tree |
| `file_read(path)` | Read file contents |
| `file_write(path, content)` | Write file contents |
| `file_rename(old_path, new_path)` | Rename or move a file |
| `file_delete(path)` | Delete a file |
| `config_load()` | Load config from disk |
| `config_save(config)` | Persist config to disk |
| `list_fonts()` | List installed system fonts (Windows registry) |

**Events:** `pty:output` · `pty:exit` · `file:changed`

</details>

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Rust (Tauri v2) | Native performance, system access |
| **PTY** | portable-pty (ConPTY) | Real terminal sessions on Windows |
| **Git** | git2 crate | Branch, status, diff operations |
| **File Watch** | notify crate | Real-time file change detection |
| **Frontend** | React 19 + TypeScript | UI components and state |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State** | Zustand | Lightweight state management |
| **Terminal** | xterm.js | Terminal emulation in the browser view |
| **Editor** | Monaco Editor | Code editing with syntax highlighting |
| **Build** | Vite | Fast frontend bundling |

---

## Configuration

WARP stores its config in `warp_config.json` (auto-created on first run, never committed):

```json
{
  "projects": [
    { "name": "my-app", "path": "C:/Projects/my-app", "command": "powershell.exe" }
  ],
  "theme": "dark",
  "accent_color": "#00E5FF",
  "font_family": "Cascadia Code",
  "font_size": 14,
  "cursor_style": "bar",
  "terminal_theme": "dark",
  "divider_color": "#1E1E2E",
  "ui_zoom": 1.0,
  "sidebar_position": "left",
  "default_project_path": "",
  "shell_command": "powershell.exe",
  "branch_prefix": "feature/",
  "active_project": "my-app"
}
```

All settings are editable through the **Settings modal** (gear icon in the activity bar).

---

## Contributing

PRs welcome. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full blueprint.

**Development follows strict TDD** — every feature starts with a failing test. See [CLAUDE.md](CLAUDE.md) for coding conventions and commit guidelines.

---

<div align="center">

### Brand

**Accent:** `#00E5FF` Neon Cyan · **Theme:** Dark · **Font:** Cascadia Code

---

*built with Rust, driven by agents*

</div>
