import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const anime = pgTable("anime", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  episodes: integer("episodes").notNull(),
  year: text("year"),
  status: text("status"),
  genres: text("genres"),
  description: text("description"),
  poster: text("poster"),
});

export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey(),
  animeId: varchar("anime_id").notNull(),
  episodeNumber: text("episode_number").notNull(),
  title: text("title").notNull(),
  duration: text("duration"),
  description: text("description"),
  thumbnail: text("thumbnail"),
});

export const videoSources = pgTable("video_sources", {
  id: varchar("id").primaryKey(),
  episodeId: varchar("episode_id").notNull(),
  quality: text("quality").notNull(),
  url: text("url").notNull(),
  provider: text("provider").notNull(),
  referer: text("referer"),
});

export const insertAnimeSchema = createInsertSchema(anime);
export const insertEpisodeSchema = createInsertSchema(episodes);
export const insertVideoSourceSchema = createInsertSchema(videoSources);

export type Anime = typeof anime.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type VideoSource = typeof videoSources.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type InsertVideoSource = z.infer<typeof insertVideoSourceSchema>;

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  episodes: z.number(),
  year: z.string().optional(),
  poster: z.string().optional(),
});

export const episodeListSchema = z.object({
  id: z.string(),
  episodeNumber: z.string(),
  title: z.string(),
  duration: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
});

export const videoSourceSchema = z.object({
  quality: z.string(),
  url: z.string(),
  provider: z.string(),
  referer: z.string().optional(),
  type: z.string().optional(), // hls, mp4, webm, etc.
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type EpisodeListItem = z.infer<typeof episodeListSchema>;
export type VideoSourceItem = z.infer<typeof videoSourceSchema>;
