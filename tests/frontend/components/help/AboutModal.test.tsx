import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AboutModal from "@/components/help/AboutModal";

describe("AboutModal — closed", () => {
  it("renders nothing when open is false", () => {
    render(<AboutModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId("about-modal")).not.toBeInTheDocument();
  });
});

describe("AboutModal — open", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal when open is true", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("about-modal")).toBeInTheDocument();
  });

  it("renders the WARP name", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("about-app-name")).toBeInTheDocument();
    expect(screen.getByTestId("about-app-name")).toHaveTextContent("WARP");
  });

  it("renders the app version", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("about-version")).toBeInTheDocument();
    expect(screen.getByTestId("about-version")).toHaveTextContent("0.1.0");
  });

  it("renders the license", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("about-license")).toBeInTheDocument();
    expect(screen.getByTestId("about-license")).toHaveTextContent("CC BY-NC-SA 4.0");
  });

  it("pressing Escape calls onClose", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("about-modal"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clicking the backdrop calls onClose", () => {
    render(<AboutModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("about-modal-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
