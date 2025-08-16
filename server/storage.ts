import { type Anime, type Episode, type VideoSource, type InsertAnime, type InsertEpisode, type InsertVideoSource } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Anime methods
  getAnime(id: string): Promise<Anime | undefined>;
  searchAnime(query: string): Promise<Anime[]>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  
  // Episode methods
  getEpisodes(animeId: string): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  
  // Video source methods
  getVideoSources(episodeId: string): Promise<VideoSource[]>;
  createVideoSource(source: InsertVideoSource): Promise<VideoSource>;
}

export class MemStorage implements IStorage {
  private animeList: Map<string, Anime>;
  private episodeList: Map<string, Episode>;
  private videoSourceList: Map<string, VideoSource>;

  constructor() {
    this.animeList = new Map();
    this.episodeList = new Map();
    this.videoSourceList = new Map();
  }

  async getAnime(id: string): Promise<Anime | undefined> {
    return this.animeList.get(id);
  }

  async searchAnime(query: string): Promise<Anime[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.animeList.values()).filter(anime =>
      anime.title.toLowerCase().includes(searchTerm)
    );
  }

  async createAnime(insertAnime: InsertAnime): Promise<Anime> {
    const id = insertAnime.id || randomUUID();
    const anime: Anime = { 
      ...insertAnime, 
      id,
      poster: insertAnime.poster || null,
      description: insertAnime.description || null,
      status: insertAnime.status || null,
      year: insertAnime.year || null,
      genres: insertAnime.genres || null,
    };
    this.animeList.set(id, anime);
    return anime;
  }

  async getEpisodes(animeId: string): Promise<Episode[]> {
    return Array.from(this.episodeList.values()).filter(
      episode => episode.animeId === animeId
    );
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    return this.episodeList.get(id);
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = insertEpisode.id || randomUUID();
    const episode: Episode = { 
      ...insertEpisode, 
      id,
      duration: insertEpisode.duration || null,
      description: insertEpisode.description || null,
      thumbnail: insertEpisode.thumbnail || null,
    };
    this.episodeList.set(id, episode);
    return episode;
  }

  async getVideoSources(episodeId: string): Promise<VideoSource[]> {
    return Array.from(this.videoSourceList.values()).filter(
      source => source.episodeId === episodeId
    );
  }

  async createVideoSource(insertSource: InsertVideoSource): Promise<VideoSource> {
    const id = insertSource.id || randomUUID();
    const source: VideoSource = { 
      ...insertSource, 
      id,
      referer: insertSource.referer || null,
    };
    this.videoSourceList.set(id, source);
    return source;
  }
}

export const storage = new MemStorage();
