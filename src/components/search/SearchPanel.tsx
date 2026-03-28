import { useState, useCallback, useRef } from "react";
import { fileSearch, type SearchMatchResult } from "@/lib/ipc";

interface SearchPanelProps {
  /** Project path to search in. */
  projectPath: string;
  /** Callback when a search result is clicked. */
  onResultClick: (filePath: string, line: number) => void;
}

/** Project-wide file search panel. */
function SearchPanel({ projectPath, onResultClick }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const matches = await fileSearch(projectPath, q);
        setResults(matches);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [projectPath],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 200);
  };

  return (
    <div data-testid="search-panel" className="flex h-full flex-col bg-warp-sidebar">
      <div className="px-4 py-2 text-xs uppercase tracking-wider text-warp-text-dim">Search</div>

      <div className="px-3 pb-2">
        <input
          data-testid="search-input"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search files..."
          className="w-full rounded bg-warp-bg px-3 py-1.5 text-sm text-warp-text placeholder-warp-text-dim outline-none ring-1 ring-warp-border focus:ring-warp-accent"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {!query && <div className="px-2 py-2 text-xs text-warp-text-dim">Type to search</div>}

        {searching && <div className="px-2 py-2 text-xs text-warp-text-dim">Searching...</div>}

        {query && !searching && results.length === 0 && (
          <div className="px-2 py-2 text-xs text-warp-text-dim">No results found</div>
        )}

        {results.map((result, i) => (
          <button
            key={`${result.path}:${result.line}:${i}`}
            onClick={() => onResultClick(result.path, result.line)}
            className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-warp-bg/50"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="text-warp-text">{result.path}</span>
              <span className="text-warp-text-dim">:{result.line}</span>
            </div>
            <div className="truncate text-xs text-warp-text-dim">{result.content}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchPanel;
