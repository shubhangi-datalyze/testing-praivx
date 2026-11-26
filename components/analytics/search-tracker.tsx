"use client";

import { useEffect } from "react";
import { forward } from "@/lib/analytics/client";

export function SearchTracker(props: { query: string; genre: string; year: string; author: string; results: number }) {
  const { query, genre, year, author, results } = props;
  useEffect(() => {
    forward("search_performed", {
      query,
      genre: genre || null,
      year: year ? Number(year) : null,
      author: author || null,
      filter_count: [genre, year, author].filter(Boolean).length,
      results_count: results,
    });
  }, [query, genre, year, author, results]);
  return null;
}
