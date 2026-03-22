import { useState } from "react";
import TerminalView from "@/components/terminal/TerminalView";

function App() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen bg-warp-bg text-warp-text font-mono overflow-hidden">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-warp-error/90 text-white p-2 text-sm z-50">
          {error}
        </div>
      )}
      <TerminalView cwd="." onError={setError} />
    </div>
  );
}

export default App;
