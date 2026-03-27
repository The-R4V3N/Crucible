import { describe, it, expect, beforeEach } from "vitest";
import { usePaletteStore } from "@/stores/paletteStore";

describe("paletteStore", () => {
  beforeEach(() => {
    usePaletteStore.setState({
      open: false,
      mode: "command",
      query: "",
      activeIndex: 0,
    });
  });

  it("is closed by default", () => {
    expect(usePaletteStore.getState().open).toBe(false);
  });

  it("openCommandPalette sets open=true and mode=command", () => {
    usePaletteStore.getState().openCommandPalette();
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("command");
  });

  it("openFilePalette sets open=true and mode=file", () => {
    usePaletteStore.getState().openFilePalette();
    const s = usePaletteStore.getState();
    expect(s.open).toBe(true);
    expect(s.mode).toBe("file");
  });

  it("close sets open=false", () => {
    usePaletteStore.getState().openCommandPalette();
    usePaletteStore.getState().close();
    expect(usePaletteStore.getState().open).toBe(false);
  });

  it("close resets query to empty string", () => {
    usePaletteStore.setState({ open: true, query: "some query" });
    usePaletteStore.getState().close();
    expect(usePaletteStore.getState().query).toBe("");
  });

  it("close resets activeIndex to 0", () => {
    usePaletteStore.setState({ open: true, activeIndex: 5 });
    usePaletteStore.getState().close();
    expect(usePaletteStore.getState().activeIndex).toBe(0);
  });

  it("setQuery updates query", () => {
    usePaletteStore.getState().setQuery("toggle");
    expect(usePaletteStore.getState().query).toBe("toggle");
  });

  it("setQuery resets activeIndex to 0", () => {
    usePaletteStore.setState({ activeIndex: 3 });
    usePaletteStore.getState().setQuery("new query");
    expect(usePaletteStore.getState().activeIndex).toBe(0);
  });

  it("setActiveIndex updates activeIndex", () => {
    usePaletteStore.getState().setActiveIndex(4);
    expect(usePaletteStore.getState().activeIndex).toBe(4);
  });

  it("openCommandPalette resets query and activeIndex", () => {
    usePaletteStore.setState({ query: "old", activeIndex: 7 });
    usePaletteStore.getState().openCommandPalette();
    const s = usePaletteStore.getState();
    expect(s.query).toBe("");
    expect(s.activeIndex).toBe(0);
  });

  it("openFilePalette resets query and activeIndex", () => {
    usePaletteStore.setState({ query: "old", activeIndex: 3 });
    usePaletteStore.getState().openFilePalette();
    const s = usePaletteStore.getState();
    expect(s.query).toBe("");
    expect(s.activeIndex).toBe(0);
  });
});
