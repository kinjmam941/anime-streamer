import { useQuery } from "@tanstack/react-query";
import { getEpisodes } from "@/lib/api";
import { EpisodeListItem } from "@shared/schema";

export function useEpisodes(animeId: string) {
  return useQuery<EpisodeListItem[]>({
    queryKey: ["/api/anime", animeId, "episodes"],
    queryFn: () => getEpisodes(animeId),
    enabled: !!animeId,
  });
}
