import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/stores/editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      cursorLine: 1,
      cursorCol: 1,
      language: "plaintext",
    });
  });

  it("has correct initial state", () => {
    const state = useEditorStore.getState();
    expect(state.cursorLine).toBe(1);
    expect(state.cursorCol).toBe(1);
    expect(state.language).toBe("plaintext");
  });

  it("setCursor updates line and col", () => {
    useEditorStore.getState().setCursor(10, 5);
    const state = useEditorStore.getState();
    expect(state.cursorLine).toBe(10);
    expect(state.cursorCol).toBe(5);
  });

  it("setCursor with col 1 keeps col at 1", () => {
    useEditorStore.getState().setCursor(3, 1);
    expect(useEditorStore.getState().cursorCol).toBe(1);
  });

  it("setLanguage updates the language", () => {
    useEditorStore.getState().setLanguage("typescript");
    expect(useEditorStore.getState().language).toBe("typescript");
  });

  it("setLanguage to rust updates language", () => {
    useEditorStore.getState().setLanguage("rust");
    expect(useEditorStore.getState().language).toBe("rust");
  });

  it("setCursor does not affect language", () => {
    useEditorStore.getState().setLanguage("typescript");
    useEditorStore.getState().setCursor(5, 10);
    expect(useEditorStore.getState().language).toBe("typescript");
  });

  it("setLanguage does not affect cursor", () => {
    useEditorStore.getState().setCursor(7, 3);
    useEditorStore.getState().setLanguage("json");
    const state = useEditorStore.getState();
    expect(state.cursorLine).toBe(7);
    expect(state.cursorCol).toBe(3);
  });
});
