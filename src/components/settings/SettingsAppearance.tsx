import { useConfigStore } from "@/stores/configStore";
import { configSave } from "@/lib/ipc";

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-warp-text-dim mb-1";
const SELECT_CLASS =
  "w-full bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent";

function SettingsAppearance() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);

  if (!config) return null;

  async function save(patch: Parameters<typeof updateConfig>[0]) {
    updateConfig(patch);
    await configSave({ ...config!, ...patch });
  }

  return (
    <div data-testid="settings-page-appearance" className="space-y-6">
      <h2 className="text-base font-semibold text-warp-text">Appearance</h2>

      <div>
        <label className={LABEL_CLASS}>Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            data-testid="setting-accent-color"
            type="color"
            defaultValue={config.accent_color}
            className="h-8 w-12 cursor-pointer border border-warp-border bg-warp-bg p-0.5"
            onBlur={(e) => save({ accent_color: e.target.value })}
          />
          <input
            type="text"
            defaultValue={config.accent_color}
            className="w-28 bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent font-mono"
            onBlur={(e) => save({ accent_color: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>UI Zoom</label>
        <select
          data-testid="setting-ui-zoom"
          defaultValue={String(config.ui_zoom)}
          className={SELECT_CLASS}
          onChange={(e) => save({ ui_zoom: parseFloat(e.target.value) })}
        >
          <option value="0.9">90%</option>
          <option value="1">100% (default)</option>
          <option value="1.1">110%</option>
          <option value="1.25">125%</option>
          <option value="1.5">150%</option>
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Sidebar Position</label>
        <select
          data-testid="setting-sidebar-position"
          defaultValue={config.sidebar_position}
          className={SELECT_CLASS}
          onChange={(e) => save({ sidebar_position: e.target.value })}
        >
          <option value="left">Left (default)</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

export default SettingsAppearance;
