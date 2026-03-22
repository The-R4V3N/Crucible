# WARP — Architecture & Requirements

## Vision

WARP is an AI agent IDE for Windows — a project-centric workspace that combines terminal multiplexing, a code editor, git integration, and smart notifications into one native application. Think "VS Code meets cmux, built for AI coding agents."

## Target Users

- Primary: Developer using AI coding agents (Claude Code, Codex, etc.)
- Secondary: Open source release for Windows developers managing multiple agent sessions

## Core Principles

1. **Project-centric** — Each project is a full workspace (terminal + files + git). No tab management.
2. **Agent-aware** — Knows when an agent needs attention, tracks file changes, shows diffs.
3. **Keyboard-first** — Everything reachable via shortcuts. Mouse optional.
4. **Native performance** — Rust backend, GPU-accelerated terminal (xterm.js), instant response.

---

## Tech Stack

| Layer         | Technology                  | Why                                                     |
| ------------- | --------------------------- | ------------------------------------------------------- |
| Backend       | **Rust**                    | PTY management, git ops, file watching, process control |
| Frontend      | **React 19 + Tailwind CSS** | UI components, layout, styling                          |
| App shell     | **Tauri v2**                | Native window, IPC, system integration                  |
| Terminal      | **xterm.js**                | Battle-tested terminal emulator (same as VS Code)       |
| Editor        | **Monaco Editor**           | VS Code's actual editor component                       |
| Git           | **git2 (Rust)**             | libgit2 bindings for branch, status, diff               |
| File watching | **notify (Rust)**           | Cross-platform file system watcher                      |
| PTY           | **portable-pty (Rust)**     | ConPTY on Windows, Unix PTY on Linux/macOS              |

---

## Window Layout (VS Code-inspired)

```
┌──────────────────────────────────────────────────────┐
│  WARP                                    ─  □  ✕    │
├────────┬─────────────────────────────────────────────┤
│        │ [Terminal]  [Editor]  [Diff]                 │
│  WARP  │┌───────────────────────────────────────────┐│
│  logo  ││                                           ││
│        ││                                           ││
│ ▌elena ││         Active tab content                ││
│  nexus ││     (xterm.js / Monaco / Diff view)       ││
│  crucix││                                           ││
│  ai_mon││                                           ││
│  warp  ││                                           ││
│        │├───────────────────────────────────────────┤│
│ ────── ││  Bottom Panel (collapsible)               ││
│ SOURCE ││  Changed files / Output log / Problems    ││
│  ⎇ main│└───────────────────────────────────────────┘│
│  3 files│                                            │
│        │                                             │
│ ────── │                                             │
│ SHORTS │                                             │
│ ^B side│                                             │
│ ^G diff│                                             │
└────────┴─────────────────────────────────────────────┘
```

### Sidebar (left, 240px, collapsible with Ctrl+B)

- **Project list** — accent bar on active, status dot (green/red/blue), project name, F-key badge
- **Source Control** — active project's git branch, dirty indicator, changed file count
- **Shortcuts** — keyboard shortcut reference

### Center (tabs: Terminal / Editor / Diff)

- **Terminal tab** — xterm.js rendering the active project's Claude Code session
- **Editor tab** — Monaco editor with open files from the project
- **Diff tab** — git diff view for changed files

### Bottom Panel (collapsible)

- **Changed Files** — list of modified/added files with status badges
- **Output** — raw PTY output log (for debugging)

---

## Brand Identity

- **Name:** WARP
- **Accent color:** Neon Cyan `#00E5FF`
- **Theme:** Dark (VS Code dark base), with cyan accents
- **Font:** System monospace (Cascadia Code on Windows)

### Color Tokens

```
--warp-bg:          #1E1E1E
--warp-sidebar:     #252526
--warp-border:      #3E3E3E
--warp-text:        #CCCCCC
--warp-text-dim:    #808080
--warp-accent:      #00E5FF  (neon cyan)
--warp-success:     #4EC9B0
--warp-warning:     #E5C07B
--warp-error:       #F44747
--warp-attention:   #007ACC  (blue ring)
```

---

## Project Structure

```
warp/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   ├── lib.rs               # Module root
│   │   ├── pty/                 # PTY management
│   │   │   ├── mod.rs
│   │   │   ├── session.rs       # Session lifecycle (spawn, kill, resize)
│   │   │   └── manager.rs       # Multi-session orchestrator
│   │   ├── git/                 # Git integration
│   │   │   ├── mod.rs
│   │   │   ├── status.rs        # Branch, dirty, changed files
│   │   │   └── diff.rs          # Diff generation
│   │   ├── files/               # File system operations
│   │   │   ├── mod.rs
│   │   │   ├── watcher.rs       # File change detection (notify crate)
│   │   │   ├── tree.rs          # Directory tree building
│   │   │   └── reader.rs        # File content reading
│   │   ├── config/              # Configuration
│   │   │   ├── mod.rs
│   │   │   └── schema.rs        # Config types + validation
│   │   └── commands.rs          # Tauri IPC command handlers
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                          # React frontend
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root layout
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx      # Main sidebar container
│   │   │   ├── ProjectList.tsx  # Project entries with status
│   │   │   ├── SourceControl.tsx # Git info panel
│   │   │   └── Shortcuts.tsx    # Keyboard shortcuts reference
│   │   ├── terminal/
│   │   │   ├── TerminalView.tsx # xterm.js wrapper
│   │   │   └── TerminalTabs.tsx # Terminal tab bar
│   │   ├── editor/
│   │   │   ├── EditorView.tsx   # Monaco editor wrapper
│   │   │   ├── FileTree.tsx     # File explorer tree
│   │   │   └── EditorTabs.tsx   # Open file tabs
│   │   ├── diff/
│   │   │   ├── DiffView.tsx     # Git diff renderer
│   │   │   └── ChangedFiles.tsx # Changed file list
│   │   ├── panels/
│   │   │   ├── BottomPanel.tsx  # Collapsible bottom panel
│   │   │   └── SplitPane.tsx    # Resizable split container
│   │   └── layout/
│   │       ├── TitleBar.tsx     # Custom title bar
│   │       └── StatusBar.tsx    # Bottom status bar
│   ├── hooks/
│   │   ├── useSession.ts        # PTY session management
│   │   ├── useGit.ts            # Git polling hook
│   │   ├── useFileWatcher.ts    # File change events
│   │   ├── useKeyboard.ts       # Global keyboard shortcuts
│   │   └── useConfig.ts         # Config loading
│   ├── stores/
│   │   ├── sessionStore.ts      # Session state (Zustand)
│   │   ├── editorStore.ts       # Open files, active tab
│   │   └── uiStore.ts           # Layout state (sidebar, panels)
│   ├── lib/
│   │   ├── ipc.ts               # Tauri command wrappers
│   │   ├── keybindings.ts       # Shortcut definitions
│   │   └── theme.ts             # Color tokens + theme
│   └── styles/
│       └── globals.css          # Tailwind + custom styles
│
├── tests/                        # Test suites
│   ├── rust/                    # Rust unit + integration tests
│   └── frontend/                # React component tests
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # This file
│   ├── CONTRIBUTING.md
│   └── KEYBINDINGS.md
│
├── assets/                       # Icons, fonts, images
│   ├── icons/
│   └── fonts/
│
├── warp_config.json              # User config (projects)
├── package.json                  # Frontend dependencies
├── tailwind.config.js
├── tsconfig.json
├── Cargo.toml                    # Workspace root (if needed)
└── README.md
```

---

## Keyboard Shortcuts

| Key            | Action                            | Scope      |
| -------------- | --------------------------------- | ---------- |
| `F1-F12`       | Switch to project 1-12            | Global     |
| `Ctrl+B`       | Toggle sidebar                    | Global     |
| `Ctrl+G`       | Toggle diff/changes view          | Global     |
| `Ctrl+D`       | Split vertical                    | Terminal   |
| `Ctrl+Shift+D` | Split horizontal                  | Terminal   |
| `Ctrl+W`       | Close split / close tab           | Context    |
| `Ctrl+T`       | Switch focus between panes        | Split mode |
| `Ctrl+N`       | Next project                      | Global     |
| `Ctrl+P`       | Previous project                  | Global     |
| `Ctrl+R`       | Restart active session            | Terminal   |
| `Ctrl+Q`       | Quit WARP                         | Global     |
| `Ctrl+\` `     | Toggle bottom panel               | Global     |
| `Ctrl+1/2/3`   | Switch tab (Terminal/Editor/Diff) | Center     |
| `Ctrl+O`       | Open file in editor               | Editor     |
| `Ctrl+S`       | Save file                         | Editor     |
| `Ctrl+F`       | Find in file                      | Editor     |
| `Ctrl+Shift+F` | Find across project               | Global     |

---

## IPC Commands (Rust ↔ React)

### PTY

- `pty_create(project_path, command) → session_id`
- `pty_write(session_id, data)`
- `pty_resize(session_id, rows, cols)`
- `pty_kill(session_id)`

### PTY Events (Rust → React)

- `pty:output(session_id, data)` — terminal output bytes
- `pty:exit(session_id, code)` — process exited

### Git

- `git_status(path) → { branch, dirty, changed_files }`
- `git_diff(path) → diff_text`

### Files

- `file_tree(path) → tree_structure`
- `file_read(path) → content`
- `file_write(path, content)`
- `file_watch_start(path)` / `file_watch_stop(path)`

### Files Events (Rust → React)

- `file:changed(path, kind)` — file modified/created/deleted

### Config

- `config_load() → config`
- `config_save(config)`

---

## Session Lifecycle

```
User launches WARP
  → Load warp_config.json
  → For each project:
      → Create Session { name, path, status: "starting" }
      → Spawn PTY: cmd.exe /C claude (inherit env)
      → Connect xterm.js to PTY output stream
      → Start git poller (every 5s)
      → Start file watcher (notify crate)
  → Show first project's terminal
  → Sidebar shows all projects with status
```

### Session States

```
starting → running → idle → needs_attention
                  ↘ stopped (process exited)
                  ↘ error (spawn failed)
```

---

## Notification / Attention System

1. **Detection:** Rust backend watches PTY output for prompt patterns
   - `>` at start of line (Claude input prompt)
   - `? ` (yes/no prompts)
   - No output for 3+ seconds after previous activity
2. **Visual feedback:**
   - Sidebar: accent bar turns blue, dot pulses
   - Terminal: border glows neon cyan
3. **Clearing:** Attention clears when user switches to that project

---

## Milestones

### M1 — Core Terminal

- Tauri v2 + React scaffold
- Single PTY session (powershell → claude)
- xterm.js rendering terminal output
- Keyboard input forwarded to PTY
- Basic window with dark theme

### M2 — Multi-session + Sidebar

- Project list from warp_config.json
- Sidebar with project switching (F-keys)
- Git branch + dirty status per project
- Session status indicators (running/idle/stopped)
- Ctrl+B to toggle sidebar

### M3 — File Editor + Explorer

- Monaco editor integration
- File tree explorer for active project
- Open files in editor tabs
- Auto-detect agent file changes (file watcher)
- Diff view for modified files

### M4 — Smart Features

- Attention detection + sidebar notifications
- Border glow on terminals needing attention
- Split panes (vertical + horizontal)
- Bottom panel with changed files list
- Search across project files

### M5 — Polish + Release

- WARP branding (neon cyan theme, custom title bar)
- Windows installer (Tauri bundler)
- Config system (JSON, validated)
- README + documentation
- Error handling + edge cases
- Session persistence (restore on restart)

---

## Configuration Format

```json
{
  "projects": [
    {
      "name": "elena-valore",
      "path": "D:/Development/Elena_Valore_Store",
      "command": "claude"
    }
  ],
  "theme": "dark",
  "accent_color": "#00E5FF",
  "font_family": "Cascadia Code",
  "font_size": 14,
  "sidebar_width": 240,
  "notifications": {
    "visual": true,
    "border_glow": true,
    "sound": false
  }
}
```
