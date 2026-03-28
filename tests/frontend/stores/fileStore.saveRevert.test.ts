import { describe, it, expect, beforeEach } from "vitest";
import { useFileStore } from "@/stores/fileStore";

describe("fileStore — save/revert requests", () => {
  beforeEach(() => {
    useFileStore.setState({
      tree: null,
      openFiles: [],
      activeFilePath: null,
      expandedDirs: new Set(),
      saveRequest: 0,
      revertRequest: 0,
    });
  });

  it("saveRequest starts at 0", () => {
    expect(useFileStore.getState().saveRequest).toBe(0);
  });

  it("triggerSave increments saveRequest", () => {
    useFileStore.getState().triggerSave();
    expect(useFileStore.getState().saveRequest).toBe(1);
  });

  it("triggerSave increments saveRequest each call", () => {
    useFileStore.getState().triggerSave();
    useFileStore.getState().triggerSave();
    expect(useFileStore.getState().saveRequest).toBe(2);
  });

  it("revertRequest starts at 0", () => {
    expect(useFileStore.getState().revertRequest).toBe(0);
  });

  it("triggerRevert increments revertRequest", () => {
    useFileStore.getState().triggerRevert();
    expect(useFileStore.getState().revertRequest).toBe(1);
  });

  it("triggerRevert increments revertRequest each call", () => {
    useFileStore.getState().triggerRevert();
    useFileStore.getState().triggerRevert();
    expect(useFileStore.getState().revertRequest).toBe(2);
  });
});
