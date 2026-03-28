import { useEffect } from "react";

const APP_VERSION = "0.1.0";
const APP_LICENSE = "CC BY-NC-SA 4.0";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="about-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        data-testid="about-modal"
        tabIndex={-1}
        className="w-[400px] flex flex-col rounded-lg border border-warp-border bg-warp-bg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warp-border">
          <h2 className="text-sm font-semibold text-warp-text">About WARP</h2>
          <button
            onClick={onClose}
            className="text-warp-text-dim hover:text-warp-text transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 space-y-4 text-sm">
          <div className="text-center space-y-1">
            <p
              data-testid="about-app-name"
              className="text-2xl font-bold tracking-widest text-warp-accent"
            >
              WARP
            </p>
            <p className="text-warp-text-dim text-xs">AI agent IDE for Windows</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-warp-border">
            <div className="flex justify-between">
              <span className="text-warp-text-dim">Version</span>
              <span data-testid="about-version" className="text-warp-text font-mono">
                {APP_VERSION}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warp-text-dim">License</span>
              <span data-testid="about-license" className="text-warp-text">
                {APP_LICENSE}
              </span>
            </div>
          </div>

          <p className="text-center text-warp-text-dim text-xs pt-2 italic">
            built with Rust, driven by agents
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
