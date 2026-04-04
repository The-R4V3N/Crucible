import { useEffect, useState } from "react";
import { useConfigStore } from "@/stores/configStore";
import { configSave, listFonts } from "@/lib/ipc";

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-warp-text-dim mb-1";
const SELECT_CLASS =
  "w-full bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent";

function SettingsTerminal() {
  const config = useConfigStore((s) => s.config);
  const updateConfig = useConfigStore((s) => s.updateConfig);
  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    listFonts()
      .then(setFonts)
      .catch(() => setFonts([]));
  }, []);

  if (!config) return null;

  async function save(patch: Parameters<typeof updateConfig>[0]) {
    updateConfig(patch);
    await configSave({ ...config!, ...patch });
  }

  // Ensure current font is always in the list (even if not installed/loaded yet)
  const fontOptions = fonts.includes(config.font_family) ? fonts : [config.font_family, ...fonts];

  return (
    <div data-testid="settings-page-terminal" className="space-y-6">
      <h2 className="text-base font-semibold text-warp-text">Terminal</h2>

      <div>
        <label className={LABEL_CLASS}>Font Family</label>
        <select
          data-testid="setting-font-family"
          value={config.font_family}
          className={SELECT_CLASS}
          onChange={(e) => save({ font_family: e.target.value })}
        >
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Font Size</label>
        <select
          data-testid="setting-font-size"
          value={config.font_size}
          className={SELECT_CLASS}
          onChange={(e) => save({ font_size: parseInt(e.target.value, 10) })}
        >
          {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Cursor Style</label>
        <div className="flex gap-4">
          {(["bar", "block", "underline"] as const).map((style) => (
            <label
              key={style}
              className="flex items-center gap-2 cursor-pointer text-sm text-warp-text"
            >
              <input
                data-testid={`setting-cursor-${style}`}
                type="radio"
                name="cursor-style"
                value={style}
                defaultChecked={config.cursor_style === style}
                onChange={() => save({ cursor_style: style })}
                className="accent-warp-accent"
              />
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Terminal Theme</label>
        <select
          data-testid="setting-terminal-theme"
          defaultValue={config.terminal_theme}
          className={SELECT_CLASS}
          onChange={(e) => save({ terminal_theme: e.target.value })}
        >
          <option value="dark">Dark (default)</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Divider Color</label>
        <div className="flex items-center gap-3">
          <input
            data-testid="setting-divider-color"
            type="color"
            defaultValue={config.divider_color}
            className="h-8 w-12 cursor-pointer border border-warp-border bg-warp-bg p-0.5"
            onBlur={(e) => save({ divider_color: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsTerminal;
