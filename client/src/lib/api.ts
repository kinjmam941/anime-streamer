import { SearchResult, EpisodeListItem, VideoSourceItem, Anime } from "@shared/schema";

const API_BASE = "/api";

export async function searchAnime(query: string): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Failed to search anime");
  }
  return response.json();
}

export async function getAnimeDetails(id: string): Promise<Anime> {
  const response = await fetch(`${API_BASE}/anime/${id}`);
  if (!response.ok) {
    throw new Error("Failed to get anime details");
  }
  return response.json();
}

export async function getEpisodes(animeId: string): Promise<EpisodeListItem[]> {
  const response = await fetch(`${API_BASE}/anime/${animeId}/episodes`);
  if (!response.ok) {
    throw new Error("Failed to get episodes");
  }
  return response.json();
}

export async function getVideoSources(episodeId: string, animeId: string, episodeNumber: string): Promise<VideoSourceItem[]> {
  const response = await fetch(`${API_BASE}/episode/${episodeId}/sources?animeId=${animeId}&episodeNumber=${episodeNumber}`);
  if (!response.ok) {
    throw new Error("Failed to get video sources");
  }
  return response.json();
}
