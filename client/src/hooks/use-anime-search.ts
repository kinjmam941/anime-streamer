import { useQuery } from "@tanstack/react-query";
import { searchAnime } from "@/lib/api";
import { SearchResult } from "@shared/schema";

export function useAnimeSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    queryFn: () => searchAnime(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
