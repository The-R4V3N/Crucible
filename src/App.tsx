import TerminalView from "@/components/terminal/TerminalView";

function App() {
  return (
    <div className="h-screen w-screen bg-warp-bg text-warp-text font-mono overflow-hidden">
      <TerminalView cwd="." />
    </div>
  );
}

export default App;
