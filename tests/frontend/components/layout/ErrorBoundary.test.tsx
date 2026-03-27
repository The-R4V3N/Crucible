import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

// Suppress React error boundary console errors in test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders error message when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it("renders reload button in error state", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Reload")).toBeInTheDocument();
  });

  it("dismiss button resets error state", () => {
    let shouldThrow = true;
    function ConditionalChild() {
      if (shouldThrow) throw new Error("Test error");
      return <div>Child content</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    // Stop throwing before dismissing so re-render succeeds
    shouldThrow = false;
    fireEvent.click(screen.getByText("Dismiss"));

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
