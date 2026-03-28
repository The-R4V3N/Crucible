import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore — new file request", () => {
  beforeEach(() => {
    useUiStore.setState({ newFileRequested: false });
  });

  it("newFileRequested is false by default", () => {
    expect(useUiStore.getState().newFileRequested).toBe(false);
  });

  it("requestNewFile sets newFileRequested to true", () => {
    useUiStore.getState().requestNewFile();
    expect(useUiStore.getState().newFileRequested).toBe(true);
  });

  it("clearNewFileRequest sets newFileRequested to false", () => {
    useUiStore.getState().requestNewFile();
    useUiStore.getState().clearNewFileRequest();
    expect(useUiStore.getState().newFileRequested).toBe(false);
  });
});
