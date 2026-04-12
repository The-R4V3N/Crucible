import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import type { IMarker } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useSession } from "@/hooks/useSession";
import { useSessionStore } from "@/stores/sessionStore";
import { findPrevTurnLine, findNextTurnLine } from "@/lib/turnNavigation";
import "@xterm/xterm/css/xterm.css";

/** Crucible terminal color theme — dark. */
const CRUCIBLE_THEME_DARK = {
  background: "#1E1E1E",
  foreground: "#CCCCCC",
  cursor: "#00E5FF",
  cursorAccent: "#1E1E1E",
  selectionBackground: "#264F78",
  selectionForeground: "#FFFFFF",
  black: "#1E1E1E",
  red: "#F44747",
  green: "#4EC9B0",
  yellow: "#E5C07B",
  blue: "#007ACC",
  magenta: "#C586C0",
  cyan: "#00E5FF",
  white: "#CCCCCC",
  brightBlack: "#808080",
  brightRed: "#F44747",
  brightGreen: "#4EC9B0",
  brightYellow: "#E5C07B",
  brightBlue: "#007ACC",
  brightMagenta: "#C586C0",
  brightCyan: "#00E5FF",
  brightWhite: "#FFFFFF",
};

/** Crucible terminal color theme — light. */
const CRUCIBLE_THEME_LIGHT = {
  background: "#FFFFFF",
  foreground: "#1E1E1E",
  cursor: "#007ACC",
  cursorAccent: "#FFFFFF",
  selectionBackground: "#ADD6FF",
  selectionForeground: "#1E1E1E",
  black: "#000000",
  red: "#CD3131",
  green: "#00BC00",
  yellow: "#949800",
  blue: "#0451A5",
  magenta: "#BC05BC",
  cyan: "#0598BC",
  white: "#555555",
  brightBlack: "#666666",
  brightRed: "#CD3131",
  brightGreen: "#14CE14",
  brightYellow: "#B5BA00",
  brightBlue: "#0451A5",
  brightMagenta: "#BC05BC",
  brightCyan: "#0598BC",
  brightWhite: "#A5A5A5",
};

function resolveTheme(terminalTheme?: string) {
  return terminalTheme === "light" ? CRUCIBLE_THEME_LIGHT : CRUCIBLE_THEME_DARK;
}

interface TerminalViewProps {
  /** Project name this terminal belongs to. */
  projectName?: string;
  /** Stable tab key linking this view to its TerminalManager tab. */
  tabKey?: string;
  /** Display label shown in the tab bar. */
  label?: string;
  /** Working directory for the PTY session. */
  cwd: string;
  /** Command to run. Defaults to powershell.exe. */
  command?: string;
  /** Callback for errors during session setup. */
  onError?: (error: string) => void;
  /** Font family from config. */
  fontFamily?: string;
  /** Font size from config. */
  fontSize?: number;
  /** Cursor style from config. */
  cursorStyle?: "bar" | "block" | "underline";
  /** Terminal theme from config ("dark" | "light"). */
  terminalTheme?: string;
}

/** Terminal component that renders xterm.js connected to a PTY session. */
function TerminalView({
  projectName,
  tabKey,
  label,
  cwd,
  command,
  onError,
  fontFamily,
  fontSize,
  cursorStyle,
  terminalTheme,
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  /** xterm IMarker objects for each detected agent turn boundary. */
  const turnMarkersRef = useRef<IMarker[]>([]);

  // Keep refs in sync so init effect can read latest values without re-running
  const fontFamilyRef = useRef(fontFamily);
  const fontSizeRef = useRef(fontSize);
  const cursorStyleRef = useRef(cursorStyle);
  const terminalThemeRef = useRef(terminalTheme);
  useEffect(() => {
    fontFamilyRef.current = fontFamily;
  }, [fontFamily]);
  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);
  useEffect(() => {
    cursorStyleRef.current = cursorStyle;
  }, [cursorStyle]);
  useEffect(() => {
    terminalThemeRef.current = terminalTheme;
  }, [terminalTheme]);

  // Targeted selector: only re-render when THIS project's needsAttention changes
  const needsAttention = useSessionStore((s) => {
    if (!projectName) return false;
    const session = Object.values(s.sessions).find((sess) => sess.projectName === projectName);
    return session?.needsAttention ?? false;
  });

  // Targeted selector: is this terminal the active one?
  const isActive = useSessionStore((s) => {
    if (!projectName) return false;
    const session = Object.values(s.sessions).find((sess) => sess.projectName === projectName);
    return session?.id === s.activeSessionId;
  });

  // Auto-focus terminal when it becomes active
  useEffect(() => {
    if (isActive && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isActive]);

  const { write, resize } = useSession({
    projectName,
    tabKey,
    label,
    cwd,
    command,
    onOutput: (data) => {
      terminalRef.current?.write(data);
    },
    onExit: (_code) => {
      terminalRef.current?.write("\r\n\x1b[90m[Process exited]\x1b[0m\r\n");
    },
    onError: (err) => {
      onError?.(err);
      terminalRef.current?.write(`\r\n\x1b[31m[Error: ${err}]\x1b[0m\r\n`);
    },
    onReady: () => {
      const terminal = terminalRef.current;
      if (terminal && terminal.rows > 0 && terminal.cols > 0) {
        resize(terminal.rows, terminal.cols);
      }
    },
    onTurnStart: (_turnId, _timestampMs) => {
      const terminal = terminalRef.current;
      if (!terminal) return;
      // Register a marker at the current cursor line so we can navigate to it later.
      const marker = terminal.registerMarker(0);
      if (marker) {
        turnMarkersRef.current.push(marker);
        // Clean up disposed markers to avoid memory growth
        turnMarkersRef.current = turnMarkersRef.current.filter((m) => !m.isDisposed);
      }
    },
  });

  // Initialize xterm.js — deferred until container is visible to avoid crashes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let terminal: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let opened = false;

    const safeFit = () => {
      try {
        if (container.offsetWidth > 0 && container.offsetHeight > 0 && fitAddon) {
          fitAddon.fit();
        }
      } catch {
        // Ignore fit errors on zero-size containers
      }
    };

    const initTerminal = () => {
      if (opened) return;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      opened = true;
      terminal = new Terminal({
        theme: resolveTheme(terminalThemeRef.current),
        fontFamily: fontFamilyRef.current
          ? `"${fontFamilyRef.current}", Consolas, monospace`
          : '"Cascadia Code", Consolas, monospace',
        fontSize: fontSizeRef.current ?? 14,
        cursorBlink: true,
        cursorStyle: cursorStyleRef.current ?? "bar",
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(container);
      safeFit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Let F-keys and global shortcuts pass through to the window handler.
      // NOTE: Ctrl+D is NOT passed through — it must reach the shell as EOF.
      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (!terminal) return true;
        // Ctrl+C: copy selection if any; otherwise send SIGINT (^C) to the shell
        if (e.ctrlKey && !e.shiftKey && e.key === "c") {
          if (terminal.hasSelection()) {
            if (e.type === "keydown") {
              navigator.clipboard.writeText(terminal.getSelection());
            }
            return false;
          }
          return true;
        }
        // Alt+ArrowUp — scroll to previous agent turn
        if (e.altKey && e.key === "ArrowUp" && e.type === "keydown") {
          const lines = turnMarkersRef.current.filter((m) => !m.isDisposed).map((m) => m.line);
          const currentLine = terminal.buffer.active.viewportY + terminal.rows - 1;
          const target = findPrevTurnLine(lines, currentLine);
          if (target !== null) terminal.scrollToLine(target);
          return false;
        }
        // Alt+ArrowDown — scroll to next agent turn
        if (e.altKey && e.key === "ArrowDown" && e.type === "keydown") {
          const lines = turnMarkersRef.current.filter((m) => !m.isDisposed).map((m) => m.line);
          const currentLine = terminal.buffer.active.viewportY + terminal.rows - 1;
          const target = findNextTurnLine(lines, currentLine);
          if (target !== null) terminal.scrollToLine(target);
          return false;
        }
        // F1-F12: project switching
        if (/^F\d+$/.test(e.key)) return false;
        // Ctrl+B, Ctrl+E, Ctrl+Shift+D, Ctrl+Shift+F, Ctrl+1/2/3, Ctrl+`, Ctrl+W
        if (e.ctrlKey && e.shiftKey && ["D", "F"].includes(e.key)) return false;
        if (e.ctrlKey && !e.shiftKey && ["b", "e", "1", "2", "3", "`", "w", "\\"].includes(e.key))
          return false;
        return true;
      });

      terminal.onData((data) => {
        write(data);
      });

      terminal.onResize(({ rows, cols }) => {
        resize(rows, cols);
      });
    };

    initTerminal();

    const handleNavigateTurn = (e: Event) => {
      const terminal = terminalRef.current;
      if (!terminal) return;
      const direction = (e as CustomEvent<{ direction: string }>).detail.direction;
      const lines = turnMarkersRef.current.filter((m) => !m.isDisposed).map((m) => m.line);
      const currentLine = terminal.buffer.active.viewportY + terminal.rows - 1;
      const target =
        direction === "prev"
          ? findPrevTurnLine(lines, currentLine)
          : findNextTurnLine(lines, currentLine);
      if (target !== null) terminal.scrollToLine(target);
    };

    window.addEventListener("terminal:navigate-turn", handleNavigateTurn);

    const handleResize = () => safeFit();
    window.addEventListener("resize", handleResize);

    resizeObserver = new ResizeObserver(() => {
      if (!opened) {
        initTerminal();
      } else {
        safeFit();
      }
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("terminal:navigate-turn", handleNavigateTurn);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      terminal?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-update terminal options when config props change
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    terminal.options.fontFamily = fontFamily
      ? `"${fontFamily}", Consolas, monospace`
      : '"Cascadia Code", Consolas, monospace';
    terminal.options.fontSize = fontSize ?? 14;
    terminal.options.cursorStyle = cursorStyle ?? "bar";
    terminal.options.theme = resolveTheme(terminalTheme);
    fitAddonRef.current?.fit();
  }, [fontFamily, fontSize, cursorStyle, terminalTheme]);

  return (
    <div
      ref={containerRef}
      data-testid="terminal-container"
      className={`h-full w-full bg-crucible-bg ${
        needsAttention ? "ring-2 ring-crucible-accent ring-inset" : ""
      }`}
    />
  );
}

export default TerminalView;
