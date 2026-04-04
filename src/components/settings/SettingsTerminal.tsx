import { useEffect, useState } from "react";
import { listFonts } from "@/lib/ipc";
import type { WarpConfig } from "@/stores/configStore";

interface Props {
  config: WarpConfig;
  onChange: (patch: Partial<WarpConfig>) => void;
}

const LABEL_CLASS = "block text-xs uppercase tracking-wider text-warp-text-dim mb-1";
const SELECT_CLASS =
  "w-full bg-warp-bg border border-warp-border px-3 py-1.5 text-sm text-warp-text outline-none focus:border-warp-accent";

function SettingsTerminal({ config, onChange }: Props) {
  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    listFonts()
      .then(setFonts)
      .catch(() => setFonts([]));
  }, []);

  // Ensure current font is always in the list
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
          onChange={(e) => onChange({ font_family: e.target.value })}
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
          onChange={(e) => onChange({ font_size: parseInt(e.target.value, 10) })}
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
                checked={config.cursor_style === style}
                onChange={() => onChange({ cursor_style: style })}
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
          value={config.terminal_theme}
          className={SELECT_CLASS}
          onChange={(e) => onChange({ terminal_theme: e.target.value })}
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
            value={config.divider_color}
            className="h-8 w-12 cursor-pointer border border-warp-border bg-warp-bg p-0.5"
            onChange={(e) => onChange({ divider_color: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsTerminal;
