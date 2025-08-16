import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getAnimeDetails } from "@/lib/api";
import { useEpisodes } from "@/hooks/use-episodes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EpisodeCard from "@/components/episode-card";
import SearchBar from "@/components/search-bar";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Anime } from "@shared/schema";
import { useState, useMemo } from "react";
import logoImage from "@assets/generated_images/AniStream_purple_squircle_logo_6bb93de4.png";

export default function AnimeDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // Try to get stored anime data from sessionStorage
  const storedAnime = useMemo(() => {
    if (!id) return null;
    const stored = sessionStorage.getItem(`anime-${id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert search result to anime format
        return {
          id: parsed.id,
          title: parsed.title,
          episodes: parsed.episodes,
          year: "Unknown",
          status: parsed.status || "Unknown",
          genres: "Unknown",
          description: "Description not available in search results",
          poster: parsed.poster
        };
      } catch (e) {
        console.error("Failed to parse stored anime data:", e);
      }
    }
    return null;
  }, [id]);

  const { data: apiAnime, isLoading: animeLoading, error: animeError } = useQuery<Anime>({
    queryKey: ["/api/anime", id],
    queryFn: () => getAnimeDetails(id!),
    enabled: !!id,
  });

  // Use API data if available, otherwise fall back to stored data
  const anime = apiAnime || storedAnime;

  const { data: episodes = [], isLoading: episodesLoading } = useEpisodes(id!);

  // Group episodes for large anime series
  const episodeGroups = useMemo(() => {
    // Sort episodes by episode number first
    const sortedEpisodes = [...episodes].sort((a, b) => {
      const numA = parseInt(a.episodeNumber) || 0;
      const numB = parseInt(b.episodeNumber) || 0;
      return numA - numB;
    });

    if (sortedEpisodes.length === 0) {
      return [];
    }

    if (sortedEpisodes.length <= 100) {
      const firstEp = parseInt(sortedEpisodes[0]?.episodeNumber) || 1;
      const lastEp = parseInt(sortedEpisodes[sortedEpisodes.length - 1]?.episodeNumber) || sortedEpisodes.length;
      return [{ 
        label: `Episodes ${firstEp}-${lastEp}`, 
        key: `${firstEp}-${lastEp}`, 
        episodes: sortedEpisodes 
      }];
    }

    const groups = [];
    const groupSize = 100;

    for (let i = 0; i < sortedEpisodes.length; i += groupSize) {
      const currentGroup = sortedEpisodes.slice(i, i + groupSize);
      const firstEpisode = parseInt(currentGroup[0]?.episodeNumber) || (i + 1);
      const lastEpisode = parseInt(currentGroup[currentGroup.length - 1]?.episodeNumber) || Math.min(i + groupSize, sortedEpisodes.length);

      groups.push({
        label: `Episodes ${firstEpisode}-${lastEpisode}`,
        key: `${firstEpisode}-${lastEpisode}`,
        episodes: currentGroup
      });
    }

    return groups;
  }, [episodes]);

  // Auto-select first group when groups change
  const effectiveSelectedGroup = selectedGroup || episodeGroups[0]?.key || "";

  const displayedEpisodes = useMemo(() => {
    const group = episodeGroups.find(g => g.key === effectiveSelectedGroup);
    return group?.episodes || [];
  }, [episodes, effectiveSelectedGroup, episodeGroups]);

  const handlePlayEpisode = (episodeNumber: string) => {
    setLocation(`/watch/${id}/${episodeNumber}`);
  };

  const handleGoBack = () => {
    setLocation("/");
  };

  if (animeLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-secondary shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 
                data-testid="app-title"
                className="text-2xl font-bold text-accent cursor-pointer"
                onClick={() => setLocation("/")}
              >
                AniStream
              </h1>
              <SearchBar />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]" data-testid="anime-loading">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading anime details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (animeError || !anime) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-secondary shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 
                data-testid="app-title"
                className="text-2xl font-bold text-accent cursor-pointer"
                onClick={() => setLocation("/")}
              >
                AniStream
              </h1>
              <SearchBar />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4" data-testid="error-message">
                Failed to load anime details
              </p>
              <Button onClick={handleGoBack} data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mica-blur shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setLocation("/")}>
              <img 
                src={logoImage}
                alt="AniStream Logo"
                className="w-12 h-12 rounded-lg"
              />
              <h1 
                data-testid="app-title"
                className="text-2xl font-bold text-accent"
              >
                AniStream
              </h1>
            </div>
            <div className="max-w-2xl flex-1 mx-12">
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-12 max-w-7xl">
        <div className="fade-in">
          <div className="flex flex-col lg:flex-col gap-12 mb-12">
            <div className="max-w-sm mx-auto">
              <img
                data-testid="img-anime-poster"
                src={anime.poster || "/api/placeholder/400/600"}
                alt={anime.title}
                className="w-full rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/api/placeholder/400/600";
                }}
              />
            </div>

            <div>
              <Button 
                data-testid="button-back"
                variant="ghost" 
                className="mb-6 text-muted hover:text-foreground transition-colors text-lg"
                onClick={handleGoBack}
              >
                <ArrowLeft className="w-5 h-5 mr-3" />
                Back to Search
              </Button>
            </div>
          </div>

          {/* Episodes List */}
          <Card className="mica-blur border-border">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">Episodes</h2>
                {episodeGroups.length > 1 && (
                  <div className="flex items-center space-x-6">
                    <Select value={effectiveSelectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className="w-56 mica-blur text-lg" data-testid="select-episode-group">
                        <SelectValue placeholder="Select episode range" />
                      </SelectTrigger>
                      <SelectContent className="mica-blur">
                        {episodeGroups.map((group) => (
                          <SelectItem key={group.key} value={group.key} className="text-lg">
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {episodesLoading ? (
                <div className="text-center py-8" data-testid="episodes-loading">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading episodes...</p>
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-8" data-testid="no-episodes">
                  <p className="text-muted-foreground">No episodes available</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 lg:grid-cols-15 xl:grid-cols-15 gap-4 justify-items-center" data-testid="episodes-list">
                  {displayedEpisodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      onClick={() => handlePlayEpisode(episode.episodeNumber)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}