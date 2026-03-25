# WARP

AI agent IDE for Windows — a project-centric workspace combining terminal multiplexing, a code editor, git integration, and smart notifications.

Built with [Tauri v2](https://v2.tauri.app) (Rust backend) + React (frontend) + xterm.js (terminal) + Monaco (editor).

## Features

- **Multi-project terminals** — Run multiple PTY sessions side-by-side, one per project
- **Project management** — Add/remove projects via folder picker, persisted to config
- **Session persistence** — Active project restored on restart
- **Code editor** — Monaco editor with syntax highlighting and file tabs
- **Git integration** — Branch status, changed files, inline diffs
- **Smart notifications** — Attention detection with sidebar indicators and border glow
- **Split panes** — Vertical and horizontal split views
- **Project search** — Search across all project files
- **File explorer** — Browse and open files from the sidebar
- **Keyboard-driven** — F-key project switching, Ctrl+\ splits, Ctrl+K search

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for Windows

### Install & Run

```bash
npm install
npm run dev
```

This starts both the Vite dev server and the Tauri/Rust backend.

### Run Tests

```bash
npm run test          # Frontend tests (Vitest)
cd src-tauri && cargo test   # Rust tests
```

### Build for Production

```bash
npm run build
```

Produces a Windows installer (.msi/.exe) in `src-tauri/target/release/bundle/`.

## Configuration

WARP stores its config in `warp_config.json` at the project root:

```json
{
  "projects": [
    { "name": "my-app", "path": "C:/Projects/my-app", "command": "powershell.exe" }
  ],
  "theme": "dark",
  "accent_color": "#00E5FF",
  "font_family": "Cascadia Code",
  "font_size": 14,
  "active_project": "my-app"
}
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full blueprint: layout, IPC API, milestones, and project structure.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust (Tauri v2), portable-pty (ConPTY), git2, notify |
| Frontend | React 19, TypeScript, Tailwind CSS, Zustand |
| Terminal | xterm.js |
| Editor | Monaco Editor |
| Build | Vite, Turbopack |

## License

MIT
