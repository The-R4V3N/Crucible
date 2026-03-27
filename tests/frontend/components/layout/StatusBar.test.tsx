import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBar from "@/components/layout/StatusBar";
import { useEditorStore } from "@/stores/editorStore";
import { useUiStore } from "@/stores/uiStore";
import type { GitStatusInfo } from "@/lib/ipc";

const gitStatus: GitStatusInfo = {
  branch: "main",
  dirty: false,
  changed_files: 0,
  changed_file_paths: [],
};

describe("StatusBar", () => {
  beforeEach(() => {
    useEditorStore.setState({ cursorLine: 1, cursorCol: 1, language: "plaintext" });
    useUiStore.setState({ activeView: "editor" });
  });

  it("renders the status bar", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
  });

  it("shows cursor position with initial state", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("cursor-position")).toHaveTextContent("Ln 1, Col 1");
  });

  it("reflects cursor position from editorStore", () => {
    useEditorStore.setState({ cursorLine: 42, cursorCol: 17 });
    render(<StatusBar />);
    expect(screen.getByTestId("cursor-position")).toHaveTextContent("Ln 42, Col 17");
  });

  it("shows language from editorStore", () => {
    useEditorStore.setState({ language: "typescript" });
    render(<StatusBar />);
    expect(screen.getByTestId("language-mode")).toHaveTextContent("typescript");
  });

  it("shows plaintext as default language", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("language-mode")).toHaveTextContent("plaintext");
  });

  it("shows git branch when gitStatus is provided", () => {
    render(<StatusBar gitStatus={gitStatus} />);
    expect(screen.getByTestId("git-branch")).toHaveTextContent("main");
  });

  it("hides git branch when gitStatus is null", () => {
    render(<StatusBar gitStatus={null} />);
    expect(screen.queryByTestId("git-branch")).not.toBeInTheDocument();
  });

  it("hides git branch when gitStatus is not provided", () => {
    render(<StatusBar />);
    expect(screen.queryByTestId("git-branch")).not.toBeInTheDocument();
  });

  it("shows dirty indicator when repo is dirty", () => {
    render(<StatusBar gitStatus={{ ...gitStatus, dirty: true }} />);
    expect(screen.getByTestId("git-branch")).toHaveTextContent("•");
  });

  it("does not show dirty indicator when repo is clean", () => {
    render(<StatusBar gitStatus={{ ...gitStatus, dirty: false }} />);
    expect(screen.queryByTestId("git-dirty")).not.toBeInTheDocument();
  });

  describe("view-aware cursor display", () => {
    it("shows cursor position when activeView is editor", () => {
      useUiStore.setState({ activeView: "editor" });
      render(<StatusBar />);
      expect(screen.getByTestId("cursor-position")).toBeInTheDocument();
    });

    it("hides cursor position when activeView is terminal", () => {
      useUiStore.setState({ activeView: "terminal" });
      render(<StatusBar />);
      expect(screen.queryByTestId("cursor-position")).not.toBeInTheDocument();
    });

    it("hides cursor position when activeView is diff", () => {
      useUiStore.setState({ activeView: "diff" });
      render(<StatusBar />);
      expect(screen.queryByTestId("cursor-position")).not.toBeInTheDocument();
    });

    it("hides language mode when activeView is terminal", () => {
      useUiStore.setState({ activeView: "terminal" });
      render(<StatusBar />);
      expect(screen.queryByTestId("language-mode")).not.toBeInTheDocument();
    });

    it("shows language mode when activeView is editor", () => {
      useUiStore.setState({ activeView: "editor" });
      render(<StatusBar />);
      expect(screen.getByTestId("language-mode")).toBeInTheDocument();
    });
  });
});
