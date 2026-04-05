import { useState, useCallback, useRef, type ReactNode } from "react";

interface SplitPaneProps {
  /** Split direction. */
  orientation: "vertical" | "horizontal";
  /** Initial size ratio for the first pane (0-1). Defaults to 0.5. */
  initialRatio?: number;
  /** Minimum pane size as ratio (0-1). Defaults to 0.1. */
  minRatio?: number;
  children: ReactNode;
}

/** Resizable split pane container with draggable divider. */
function SplitPane({ orientation, initialRatio = 0.5, minRatio = 0.1, children }: SplitPaneProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const childArray = Array.isArray(children) ? children : [children];
  const isVertical = orientation === "vertical";

  // All hooks must be called before any conditional returns (rules-of-hooks).
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newRatio: number;

        if (isVertical) {
          newRatio = (moveEvent.clientX - rect.left) / rect.width;
        } else {
          newRatio = (moveEvent.clientY - rect.top) / rect.height;
        }

        // Clamp to min/max
        newRatio = Math.max(minRatio, Math.min(1 - minRatio, newRatio));
        setRatio(newRatio);
      };

      const handleMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isVertical, minRatio],
  );

  // If fewer than 2 children, just render the first child directly.
  if (childArray.length < 2) {
    return <>{childArray[0]}</>;
  }

  const percentage = `${ratio * 100}%`;

  return (
    <div
      ref={containerRef}
      data-testid="split-pane"
      className={`flex h-full w-full ${isVertical ? "flex-row" : "flex-col"}`}
    >
      {/* First pane */}
      <div
        data-testid="split-first"
        className="overflow-hidden"
        style={{ flexBasis: percentage, flexShrink: 0, flexGrow: 0 }}
      >
        {childArray[0]}
      </div>

      {/* Divider */}
      <div
        data-testid="split-divider"
        onMouseDown={handleMouseDown}
        className={`flex-shrink-0 bg-crucible-border hover:bg-crucible-accent transition-colors ${
          isVertical ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
        }`}
      />

      {/* Second pane */}
      <div data-testid="split-second" className="flex-1 overflow-hidden min-w-0 min-h-0">
        {childArray[1]}
      </div>
    </div>
  );
}

export default SplitPane;
