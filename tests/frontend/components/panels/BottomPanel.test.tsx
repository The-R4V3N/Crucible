import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/uiStore";
import { useProblemsStore } from "@/stores/problemsStore";
import BottomPanel from "@/components/panels/BottomPanel";

describe("BottomPanel", () => {
  beforeEach(() => {
    useUiStore.setState({ bottomPanelVisible: false });
    useProblemsStore.setState({ problems: [], activeBottomTab: "changes" });
  });

  it("does not render when hidden", () => {
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    expect(screen.queryByTestId("bottom-panel")).not.toBeInTheDocument();
  });

  it("renders when visible", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    expect(screen.getByTestId("bottom-panel")).toBeInTheDocument();
  });

  it("shows changed files header", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(
      <BottomPanel
        changedFiles={["src/App.tsx", "src/lib/ipc.ts"]}
        onFileClick={() => {}}
      />,
    );
    expect(screen.getByText("Changed Files")).toBeInTheDocument();
  });

  it("lists changed file paths", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(
      <BottomPanel
        changedFiles={["src/App.tsx", "src/lib/ipc.ts"]}
        onFileClick={() => {}}
      />,
    );
    expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/lib/ipc.ts")).toBeInTheDocument();
  });

  it("clicking a file calls onFileClick", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    const onClick = vi.fn();
    render(
      <BottomPanel changedFiles={["src/App.tsx"]} onFileClick={onClick} />,
    );
    fireEvent.click(screen.getByText("src/App.tsx"));
    expect(onClick).toHaveBeenCalledWith("src/App.tsx");
  });

  it("shows empty message when no files changed", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    expect(screen.getByText("No changed files")).toBeInTheDocument();
  });

  it("renders both Changes and Problems tabs", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    expect(screen.getByTestId("tab-changes")).toBeInTheDocument();
    expect(screen.getByTestId("tab-problems")).toBeInTheDocument();
  });

  it("clicking Problems tab switches to problems view", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    fireEvent.click(screen.getByTestId("tab-problems"));
    expect(useProblemsStore.getState().activeBottomTab).toBe("problems");
  });

  it("clicking Changes tab switches back to changes view", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    useProblemsStore.setState({ activeBottomTab: "problems" });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    fireEvent.click(screen.getByTestId("tab-changes"));
    expect(useProblemsStore.getState().activeBottomTab).toBe("changes");
  });

  it("shows ProblemsPanel content when problems tab is active", () => {
    useUiStore.setState({ bottomPanelVisible: true });
    useProblemsStore.setState({ activeBottomTab: "problems" });
    render(<BottomPanel changedFiles={[]} onFileClick={() => {}} />);
    expect(screen.getByText("No problems detected")).toBeInTheDocument();
  });
});
