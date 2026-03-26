import { useCallback, useState, useRef } from "react";
import { useUiStore, type ViewType } from "@/stores/uiStore";

const tabLabels: Record<ViewType, string> = {
  terminal: "Terminal",
  editor: "Editor",
  diff: "Diff",
};

interface TabBarProps {
  /** Callback when search icon is clicked. */
  onSearchToggle: () => void;
}

/** Top tab bar with mouse-drag reorder and search icon. */
function TabBar({ onSearchToggle }: TabBarProps) {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const tabOrder = useUiStore((s) => s.tabOrder);
  const reorderTabs = useUiStore((s) => s.reorderTabs);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dragStartX = useRef(0);
  const didDrag = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    dragStartX.current = e.clientX;
    didDrag.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientX - dragStartX.current) > 5) {
        didDrag.current = true;
        setDragIndex(index);

        // Find which tab we're hovering over
        const tabs = document.querySelectorAll("[data-tab-index]");
        for (const tab of tabs) {
          const rect = tab.getBoundingClientRect();
          if (moveEvent.clientX >= rect.left && moveEvent.clientX <= rect.right) {
            const tabIdx = parseInt(tab.getAttribute("data-tab-index") ?? "-1", 10);
            setHoverIndex(tabIdx);
            break;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (didDrag.current && dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
        reorderTabs(dragIndex, hoverIndex);
      }
      setDragIndex(null);
      setHoverIndex(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [dragIndex, hoverIndex, reorderTabs]);

  // Use refs for the mouseup handler to get latest state
  const dragIndexRef = useRef(dragIndex);
  dragIndexRef.current = dragIndex;
  const hoverIndexRef = useRef(hoverIndex);
  hoverIndexRef.current = hoverIndex;

  const handleMouseDownStable = useCallback((e: React.MouseEvent, index: number) => {
    dragStartX.current = e.clientX;
    didDrag.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientX - dragStartX.current) > 5) {
        didDrag.current = true;
        setDragIndex(index);

        const tabs = document.querySelectorAll("[data-tab-index]");
        for (const tab of tabs) {
          const rect = tab.getBoundingClientRect();
          if (moveEvent.clientX >= rect.left && moveEvent.clientX <= rect.right) {
            const tabIdx = parseInt(tab.getAttribute("data-tab-index") ?? "-1", 10);
            setHoverIndex(tabIdx);
            break;
          }
        }
      }
    };

    const handleMouseUp = () => {
      const from = dragIndexRef.current;
      const to = hoverIndexRef.current;
      if (didDrag.current && from !== null && to !== null && from !== to) {
        reorderTabs(from, to);
      }
      setDragIndex(null);
      setHoverIndex(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [reorderTabs]);

  return (
    <div
      data-testid="tab-bar"
      className="flex h-9 items-stretch border-b border-warp-border bg-warp-sidebar"
    >
      {/* Tabs */}
      <div className="flex flex-1 items-stretch">
        {tabOrder.map((viewId, index) => {
          const isActive = viewId === activeView;
          const isDragging = dragIndex === index;
          const isDropTarget = hoverIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={viewId}
              data-testid={`tab-${viewId}`}
              data-tab-index={index}
              onMouseDown={(e) => handleMouseDownStable(e, index)}
              onClick={() => {
                if (!didDrag.current) {
                  setActiveView(viewId);
                }
              }}
              className={`flex items-center px-4 text-sm border-b-2 transition-colors select-none ${
                isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"
              } ${
                isActive
                  ? "border-warp-accent text-warp-text"
                  : "border-transparent text-warp-text-dim hover:text-warp-text"
              } ${isDropTarget ? "bg-warp-accent/20 border-l-2 border-l-warp-accent" : ""}`}
            >
              {tabLabels[viewId]}
            </div>
          );
        })}
      </div>

      {/* Action icons */}
      <div className="flex items-center">
        {/* Split editor icon */}
        <button
          data-testid="split-toggle"
          onClick={() => {
            const store = useUiStore.getState();
            if (store.splitMode) {
              store.closeSplit();
            } else {
              store.splitVertical();
            }
          }}
          className="flex items-center px-3 text-warp-text-dim hover:text-warp-accent transition-colors"
          title="Split Editor (Ctrl+D)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </button>

        {/* Search icon */}
        <button
          data-testid="search-toggle"
          onClick={onSearchToggle}
          className="flex items-center px-3 text-warp-text-dim hover:text-warp-accent transition-colors"
          title="Search (Ctrl+Shift+F)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TabBar;
