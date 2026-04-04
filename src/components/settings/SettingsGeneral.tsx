import { useConfigStore } from "@/stores/configStore";
import { configSave } from "@/lib/ipc";

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-warp-text-dim mb-1";
const INPUT_CLASS =
  "w-full bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent";

function SettingsGeneral() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  if (!config) return null;

  async function save(patch: Parameters<typeof updateConfig>[0]) {
    updateConfig(patch);
    await configSave({ ...config!, ...patch });
  }

  return (
    <div data-testid="settings-page-general" className="space-y-6">
      <h2 className="text-base font-semibold text-warp-text">General</h2>

      <div>
        <label className={LABEL_CLASS}>Default Project Path</label>
        <input
          data-testid="setting-default-project-path"
          type="text"
          defaultValue={config.default_project_path}
          className={INPUT_CLASS}
          placeholder="C:\Projects"
          onBlur={(e) => save({ default_project_path: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Shell Command</label>
        <input
          data-testid="setting-shell-command"
          type="text"
          defaultValue={config.shell_command}
          className={INPUT_CLASS}
          placeholder="powershell.exe"
          onBlur={(e) => save({ shell_command: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Branch Prefix</label>
        <input
          data-testid="setting-branch-prefix"
          type="text"
          defaultValue={config.branch_prefix}
          className={INPUT_CLASS}
          placeholder="feature/"
          onBlur={(e) => save({ branch_prefix: e.target.value })}
        />
        <p className="mt-1 text-xs text-warp-text-dim">
          Prefix applied to new git branches (e.g. feature/, fix/)
        </p>
      </div>
    </div>
  );
}

export default SettingsGeneral;
