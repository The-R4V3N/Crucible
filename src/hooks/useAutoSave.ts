import { useEffect } from "react";
import { useFileStore } from "@/stores/fileStore";

/** Saves the active file on window blur if it has unsaved changes. */
export function useAutoSave() {
  const triggerSave = useFileStore((s) => s.triggerSave);

  useEffect(() => {
    const handleBlur = () => {
      const { activeFilePath, openFiles } = useFileStore.getState();
      if (!activeFilePath) return;
      const file = openFiles.find((f) => f.path === activeFilePath);
      if (file?.isDirty) {
        triggerSave();
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [triggerSave]);
}
