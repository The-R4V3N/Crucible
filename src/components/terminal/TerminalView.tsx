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

  const sessions = useSessionStore((s) => s.sessions);
  const currentSession = projectName
    ? Object.values(sessions).find((s) => s.projectName === projectName)
    : null;
  const needsAttention = currentSession?.needsAttention ?? false;

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
  });

  // Initialize xterm.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      theme: WARP_THEME,
      fontFamily: '"Cascadia Code", Consolas, monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: "bar",
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(container);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Forward keyboard input to PTY
    terminal.onData((data) => {
      write(data);
    });

    // Forward resize events to PTY
    terminal.onResize(({ rows, cols }) => {
      resize(rows, cols);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    // Also observe container size changes
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      terminal.dispose();
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
