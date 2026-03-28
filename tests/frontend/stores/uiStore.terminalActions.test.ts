import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore — terminalActions", () => {
  beforeEach(() => {
    useUiStore.setState({ terminalActions: null });
  });

  it("terminalActions defaults to null", () => {
    expect(useUiStore.getState().terminalActions).toBeNull();
  });

  it("setTerminalActions stores the provided actions", () => {
    const actions = { addTab: vi.fn(), closeActiveTab: vi.fn() };
    useUiStore.getState().setTerminalActions(actions);
    expect(useUiStore.getState().terminalActions).toBe(actions);
  });

  it("addTab can be called after registration", () => {
    const addTab = vi.fn();
    useUiStore.getState().setTerminalActions({ addTab, closeActiveTab: vi.fn() });
    useUiStore.getState().terminalActions!.addTab();
    expect(addTab).toHaveBeenCalledOnce();
  });

  it("closeActiveTab can be called after registration", () => {
    const closeActiveTab = vi.fn();
    useUiStore.getState().setTerminalActions({ addTab: vi.fn(), closeActiveTab });
    useUiStore.getState().terminalActions!.closeActiveTab();
    expect(closeActiveTab).toHaveBeenCalledOnce();
  });

  it("setTerminalActions replaces previously registered actions", () => {
    const first = { addTab: vi.fn(), closeActiveTab: vi.fn() };
    const second = { addTab: vi.fn(), closeActiveTab: vi.fn() };
    useUiStore.getState().setTerminalActions(first);
    useUiStore.getState().setTerminalActions(second);
    expect(useUiStore.getState().terminalActions).toBe(second);
  });
});
