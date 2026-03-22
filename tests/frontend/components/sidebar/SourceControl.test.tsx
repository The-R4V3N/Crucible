import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SourceControl from "@/components/sidebar/SourceControl";

describe("SourceControl", () => {
  it("renders nothing when gitStatus is null", () => {
    const { container } = render(<SourceControl gitStatus={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows branch name", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: false, changed_files: 0 }}
      />,
    );
    expect(screen.getByTestId("git-branch")).toHaveTextContent("main");
  });

  it("shows dirty indicator when dirty", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 3 }}
      />,
    );
    expect(screen.getByTestId("git-dirty")).toBeInTheDocument();
  });

  it("does not show dirty indicator when clean", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: false, changed_files: 0 }}
      />,
    );
    expect(screen.queryByTestId("git-dirty")).not.toBeInTheDocument();
  });

  it("shows changed file count", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 5 }}
      />,
    );
    expect(screen.getByTestId("git-changed-count")).toHaveTextContent(
      "5 files changed",
    );
  });

  it("shows singular file when 1 changed", () => {
    render(
      <SourceControl
        gitStatus={{ branch: "main", dirty: true, changed_files: 1 }}
      />,
    );
    expect(screen.getByTestId("git-changed-count")).toHaveTextContent(
      "1 file changed",
    );
  });
});
