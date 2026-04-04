import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock xterm.js
vi.mock("@xterm/xterm", () => {
  const Terminal = vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    loadAddon: vi.fn(),
    dispose: vi.fn(),
    focus: vi.fn(),
    attachCustomKeyEventHandler: vi.fn(),
    hasSelection: vi.fn().mockReturnValue(false),
    getSelection: vi.fn().mockReturnValue(""),
    options: { fontFamily: "", fontSize: 14, cursorStyle: "bar", theme: {} },
  }));
  return { Terminal };
});

vi.mock("@xterm/addon-fit", () => {
  const FitAddon = vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    dispose: vi.fn(),
  }));
  return { FitAddon };
});

vi.mock("@xterm/xterm/css/xterm.css", () => ({}));

// Mock useSession hook
vi.mock("@/hooks/useSession", () => ({
  useSession: vi.fn().mockReturnValue({
    sessionId: "mock-session",
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  }),
}));

import TerminalView from "@/components/terminal/TerminalView";
import { Terminal } from "@xterm/xterm";

const MockTerminal = vi.mocked(Terminal);

describe("TerminalView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock offsetWidth/offsetHeight so the deferred init triggers
    Object.defineProperty(HTMLDivElement.prototype, "offsetWidth", {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 600,
    });
  });

  it("renders terminal container", () => {
    render(<TerminalView cwd="/test" />);
    const container = screen.getByTestId("terminal-container");
    expect(container).toBeInTheDocument();
  });

  it("creates xterm Terminal instance", () => {
    render(<TerminalView cwd="/test" />);
    expect(MockTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        fontFamily: expect.stringContaining("Cascadia Code"),
        fontSize: 14,
        cursorBlink: true,
      }),
    );
  });

  it("opens terminal in container element", () => {
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    expect(instance.open).toHaveBeenCalled();
  });

  it("registers onData handler for keyboard input", () => {
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    expect(instance.onData).toHaveBeenCalled();
  });

  it("registers onResize handler", () => {
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    expect(instance.onResize).toHaveBeenCalled();
  });

  it("disposes terminal on unmount", () => {
    const { unmount } = render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    unmount();
    expect(instance.dispose).toHaveBeenCalled();
  });

  it("registers attachCustomKeyEventHandler", () => {
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    expect(instance.attachCustomKeyEventHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it("Ctrl+C with selection copies to clipboard and blocks xterm", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    instance.hasSelection.mockReturnValue(true);
    instance.getSelection.mockReturnValue("copied text");

    const handler = instance.attachCustomKeyEventHandler.mock.calls[0]?.[0] as (
      e: KeyboardEvent,
    ) => boolean;
    const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "c" });
    const result = handler(event);

    expect(result).toBe(false);
    expect(writeText).toHaveBeenCalledWith("copied text");
  });

  it("Ctrl+C without selection passes through to PTY as SIGINT", () => {
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    instance.hasSelection.mockReturnValue(false);

    const handler = instance.attachCustomKeyEventHandler.mock.calls[0]?.[0] as (
      e: KeyboardEvent,
    ) => boolean;
    const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "c" });
    const result = handler(event);

    expect(result).toBe(true);
  });

  it("Ctrl+C on keyup with selection does not copy again", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<TerminalView cwd="/test" />);
    const instance = MockTerminal.mock.results[0]?.value;
    instance.hasSelection.mockReturnValue(true);
    instance.getSelection.mockReturnValue("text");

    const handler = instance.attachCustomKeyEventHandler.mock.calls[0]?.[0] as (
      e: KeyboardEvent,
    ) => boolean;
    const event = new KeyboardEvent("keyup", { ctrlKey: true, key: "c" });
    const result = handler(event);

    expect(result).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});
