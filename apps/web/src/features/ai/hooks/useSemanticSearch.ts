import { useState, useCallback, useRef, useEffect } from "react";
import { workspaceSemanticSearch } from "../api/ai.api";
import type { SearchResult } from "../api/ai.api";

interface UseSemanticSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (searchQuery: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSemanticSearch = (workspaceId: string): UseSemanticSearchReturn => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!workspaceId) return;
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await workspaceSemanticSearch(workspaceId, searchQuery);
        setResults(response.results);
      } catch (err: any) {
        console.error("Semantic search failed:", err);
        setError(err?.response?.data?.message || "Failed to complete search query");
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(query);
    }, 400); // 400ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, search]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
    clearSearch,
  };
};
