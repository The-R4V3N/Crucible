import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useSession } from "@/hooks/useSession";
import { useSessionStore } from "@/stores/sessionStore";
import "@xterm/xterm/css/xterm.css";

/** WARP terminal color theme. */
const WARP_THEME = {
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

interface TerminalViewProps {
  /** Project name this terminal belongs to. */
  projectName?: string;
  /** Working directory for the PTY session. */
  cwd: string;
  /** Command to run. Defaults to powershell.exe. */
  command?: string;
  /** Callback for errors during session setup. */
  onError?: (error: string) => void;
}

/** Terminal component that renders xterm.js connected to a PTY session. */
function TerminalView({ projectName, cwd, command, onError }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Targeted selector: only re-render when THIS project's needsAttention changes
  const needsAttention = useSessionStore((s) => {
    if (!projectName) return false;
    const session = Object.values(s.sessions).find(
      (sess) => sess.projectName === projectName,
    );
    return session?.needsAttention ?? false;
  });

  const { write, resize } = useSession({
    projectName,
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
      // Sync xterm dimensions to the PTY now that the session is connected.
      // The initial fit/resize may have fired before the session was ready.
      const terminal = terminalRef.current;
      if (terminal && terminal.rows > 0 && terminal.cols > 0) {
        resize(terminal.rows, terminal.cols);
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
      // Wait until container has real dimensions
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      opened = true;
      terminal = new Terminal({
        theme: WARP_THEME,
        fontFamily: '"Cascadia Code", Consolas, monospace',
        fontSize: 14,
        cursorBlink: true,
        cursorStyle: "bar",
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(container);
      safeFit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Let F-keys and global shortcuts pass through to the window handler
      terminal.attachCustomKeyEventHandler((e) => {
        // F1-F12: project switching
        if (/^F\d+$/.test(e.key)) return false;
        // Ctrl+B, Ctrl+E, Ctrl+D, Ctrl+Shift+D, Ctrl+Shift+F, Ctrl+1/2/3, Ctrl+`, Ctrl+W
        if (e.ctrlKey && ["b", "e", "d", "D", "F", "1", "2", "3", "`", "w"].includes(e.key)) return false;
        return true;
      });

      // Forward keyboard input to PTY
      terminal.onData((data) => {
        write(data);
      });

      // Forward resize events to PTY
      terminal.onResize(({ rows, cols }) => {
        resize(rows, cols);
      });
    };

    // Try immediately if visible
    initTerminal();

    // Handle window resize
    const handleResize = () => safeFit();
    window.addEventListener("resize", handleResize);

    // Observe container — init when it becomes visible, fit on size changes
    resizeObserver = new ResizeObserver(() => {
      if (!opened) {
        initTerminal();
      } else {
        safeFit();
      }
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      terminal?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="terminal-container"
      className={`h-full w-full bg-warp-bg ${
        needsAttention
          ? "ring-2 ring-warp-accent ring-inset"
          : ""
      }`}
    />
  );
}

export default TerminalView;
