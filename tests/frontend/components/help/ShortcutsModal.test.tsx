import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ShortcutsModal from "@/components/help/ShortcutsModal";

describe("ShortcutsModal — closed", () => {
  it("renders nothing when open is false", () => {
    render(<ShortcutsModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId("shortcuts-modal")).not.toBeInTheDocument();
  });
});

describe("ShortcutsModal — open", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal when open is true", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("shortcuts-modal")).toBeInTheDocument();
  });

  it("renders a heading", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("shortcuts-modal-title")).toBeInTheDocument();
  });

  it("renders global scope section", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("shortcuts-section-global")).toBeInTheDocument();
  });

  it("renders terminal scope section", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("shortcuts-section-terminal")).toBeInTheDocument();
  });

  it("renders editor scope section", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("shortcuts-section-editor")).toBeInTheDocument();
  });

  it("renders keybinding keys from keybindings.ts", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByText("Ctrl+B")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+Shift+P")).toBeInTheDocument();
  });

  it("renders keybinding descriptions", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument();
    expect(screen.getByText("Open command palette")).toBeInTheDocument();
  });

  it("pressing Escape calls onClose", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("shortcuts-modal"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clicking the backdrop calls onClose", () => {
    render(<ShortcutsModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("shortcuts-modal-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
