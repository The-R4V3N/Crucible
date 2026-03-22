import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock xterm.js and hooks for App-level test
vi.mock("@xterm/xterm", () => {
  const Terminal = vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    loadAddon: vi.fn(),
    dispose: vi.fn(),
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

vi.mock("@/hooks/useSession", () => ({
  useSession: vi.fn().mockReturnValue({
    sessionId: null,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  }),
}));

import App from "@/App";

describe("App", () => {
  it("renders terminal container", () => {
    render(<App />);
    expect(screen.getByTestId("terminal-container")).toBeInTheDocument();
  });
});
