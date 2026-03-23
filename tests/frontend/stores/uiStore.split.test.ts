import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore split state", () => {
  beforeEach(() => {
    useUiStore.setState({
      splitMode: null,
      splitViews: ["terminal", "terminal"],
    });
  });

  it("splitMode defaults to null (no split)", () => {
    expect(useUiStore.getState().splitMode).toBeNull();
  });

  it("splitVertical sets vertical split mode", () => {
    useUiStore.getState().splitVertical();
    expect(useUiStore.getState().splitMode).toBe("vertical");
  });

  it("splitHorizontal sets horizontal split mode", () => {
    useUiStore.getState().splitHorizontal();
    expect(useUiStore.getState().splitMode).toBe("horizontal");
  });

  it("splitVertical sets second pane to editor", () => {
    useUiStore.getState().splitVertical();
    const views = useUiStore.getState().splitViews;
    expect(views[0]).toBe("terminal");
    expect(views[1]).toBe("editor");
  });

  it("closeSplit resets to null", () => {
    useUiStore.getState().splitVertical();
    useUiStore.getState().closeSplit();
    expect(useUiStore.getState().splitMode).toBeNull();
  });

  it("setSplitView updates a specific pane", () => {
    useUiStore.getState().splitVertical();
    useUiStore.getState().setSplitView(1, "diff");
    expect(useUiStore.getState().splitViews[1]).toBe("diff");
  });
});
