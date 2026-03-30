import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFileStore } from "@/stores/fileStore";
import { useAutoSave } from "@/hooks/useAutoSave";

describe("useAutoSave", () => {
  let triggerSaveMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    triggerSaveMock = vi.fn();
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
      triggerSave: triggerSaveMock,
    });
  });

  it("calls triggerSave on window blur when active file is dirty", () => {
    useFileStore.setState({
      activeFilePath: "/tmp/a.ts",
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: true }],
    });

    renderHook(() => useAutoSave());
    window.dispatchEvent(new Event("blur"));

    expect(triggerSaveMock).toHaveBeenCalledOnce();
  });

  it("does not call triggerSave on window blur when active file is clean", () => {
    useFileStore.setState({
      activeFilePath: "/tmp/a.ts",
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: false }],
    });

    renderHook(() => useAutoSave());
    window.dispatchEvent(new Event("blur"));

    expect(triggerSaveMock).not.toHaveBeenCalled();
  });

  it("does not call triggerSave on window blur when no file is open", () => {
    useFileStore.setState({ activeFilePath: null, openFiles: [] });

    renderHook(() => useAutoSave());
    window.dispatchEvent(new Event("blur"));

    expect(triggerSaveMock).not.toHaveBeenCalled();
  });

  it("removes the blur listener on unmount", () => {
    const { unmount } = renderHook(() => useAutoSave());
    unmount();

    // After unmount, blur should not trigger save
    useFileStore.setState({
      activeFilePath: "/tmp/a.ts",
      openFiles: [{ path: "/tmp/a.ts", name: "a.ts", isDirty: true }],
    });
    window.dispatchEvent(new Event("blur"));

    expect(triggerSaveMock).not.toHaveBeenCalled();
  });
});
