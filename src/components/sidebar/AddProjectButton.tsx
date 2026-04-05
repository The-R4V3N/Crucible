import { useConfigStore } from "@/stores/configStore";
import { configSave } from "@/lib/ipc";

/** Button to add a new project via folder picker dialog. */
function AddProjectButton() {
  const addProject = useConfigStore((s) => s.addProject);

  const handleClick = async () => {
    // Lazy-import dialog to avoid slow startup
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Project Folder",
    });

    if (!selected || typeof selected !== "string") return;

    // Derive project name from folder name
    const name = selected.replace(/\\/g, "/").split("/").pop() ?? selected;

    // Update in-memory state
    addProject(name, selected);

    // Save to disk after React finishes rendering
    requestAnimationFrame(() => {
      const config = useConfigStore.getState().config;
      if (config) configSave(config).catch(() => {});
    });
  };

  return (
    <button
      data-testid="add-project-btn"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-1 rounded px-3 py-1.5 text-sm text-crucible-text-dim hover:bg-crucible-bg/50 hover:text-crucible-accent transition-colors"
      title="Add project"
    >
      <span className="text-lg leading-none">+</span>
    </button>
  );
}

export default AddProjectButton;
