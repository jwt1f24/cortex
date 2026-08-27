"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Searchbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/home?q=${encodeURIComponent(trimmed)}` : "/home");
  };

  // clear search
  const clearSearch = () => {
    setQuery("");
    router.push("/home");
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search note"
        className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 pr-10 py-1.5 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {query && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center transition cursor-pointer"
        >
          ✖
        </button>
      )}
    </form>
  );
}
