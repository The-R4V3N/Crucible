import type { WarpConfig } from "@/stores/configStore";

interface Props {
  config: WarpConfig;
  onChange: (patch: Partial<WarpConfig>) => void;
}

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-warp-text-dim mb-1";
const SELECT_CLASS =
  "w-full bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent";

function SettingsAppearance({ config, onChange }: Props) {
  return (
    <div data-testid="settings-page-appearance" className="space-y-6">
      <h2 className="text-base font-semibold text-warp-text">Appearance</h2>

      <div>
        <label className={LABEL_CLASS}>Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            data-testid="setting-accent-color"
            type="color"
            value={config.accent_color}
            className="h-8 w-12 cursor-pointer border border-warp-border bg-warp-bg p-0.5"
            onChange={(e) => onChange({ accent_color: e.target.value })}
          />
          <input
            type="text"
            value={config.accent_color}
            className="w-28 bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent font-mono"
            onChange={(e) => onChange({ accent_color: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>UI Zoom</label>
        <select
          data-testid="setting-ui-zoom"
          value={String(config.ui_zoom)}
          className={SELECT_CLASS}
          onChange={(e) => onChange({ ui_zoom: parseFloat(e.target.value) })}
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
          value={config.sidebar_position}
          className={SELECT_CLASS}
          onChange={(e) => onChange({ sidebar_position: e.target.value })}
        >
          <option value="left">Left (default)</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

export default SettingsAppearance;
