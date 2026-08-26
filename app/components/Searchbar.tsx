"use client";
import { useState } from "react";
import Link from "next/link";

type SearchResult = {
  id: string;
  title: string;
  summary: string | null;
  updated_at: string;
  distance: number;
};

export default function Searchbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    // clear popup if query is empty
    if (trimmed === "") {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setError(null);
    setIsSearching(true);

    try {
      // send http get request to api
      const res = await fetch("/api/notes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) throw new Error("Search failed.");

      // parse http resonse body from json to javascript arr/obj format
      const data = await res.json();

      setResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching notes:", error);
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* search field */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search note"
        />
        <button type="submit" disabled={isSearching} className="cursor-pointer">
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p>{error}</p>}

      {/* result popup */}
      {hasSearched && (
        <div className="absolute">
          {results.length === 0 ? (
            <p>No results found.</p>
          ) : (
            results.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                onClick={() => setHasSearched(false)}
              >
                <div className="flex gap-4">
                  <span>{note.title}</span>
                  <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
