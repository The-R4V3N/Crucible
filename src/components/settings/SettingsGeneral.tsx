import type { CrucibleConfig } from "@/stores/configStore";

interface Props {
  config: CrucibleConfig;
  onChange: (patch: Partial<CrucibleConfig>) => void;
}

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-crucible-text-dim mb-1";
const INPUT_CLASS =
  "w-full bg-crucible-bg border border-crucible-border px-3 py-1.5 text-sm text-crucible-text outline-none focus:border-crucible-accent";

function SettingsGeneral({ config, onChange }: Props) {
  return (
    <div data-testid="settings-page-general" className="space-y-6">
      <h2 className="text-base font-semibold text-crucible-text">General</h2>

      <div>
        <label className={LABEL_CLASS}>Default Project Path</label>
        <input
          data-testid="setting-default-project-path"
          type="text"
          value={config.default_project_path}
          className={INPUT_CLASS}
          placeholder="C:\Projects"
          onChange={(e) => onChange({ default_project_path: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Shell Command</label>
        <input
          data-testid="setting-shell-command"
          type="text"
          value={config.shell_command}
          className={INPUT_CLASS}
          placeholder="powershell.exe"
          onChange={(e) => onChange({ shell_command: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Branch Prefix</label>
        <input
          data-testid="setting-branch-prefix"
          type="text"
          value={config.branch_prefix}
          className={INPUT_CLASS}
          placeholder="feature/"
          onChange={(e) => onChange({ branch_prefix: e.target.value })}
        />
        <p className="mt-1 text-xs text-crucible-text-dim">
          Prefix applied to new git branches (e.g. feature/, fix/)
        </p>
      </div>
    </div>
  );
}

export default SettingsGeneral;
