import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getVideoSources, getAnimeDetails } from "@/lib/api";
import { useEpisodes } from "@/hooks/use-episodes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoPlayerComponent from "@/components/video-player-component";
import EpisodeCard from "@/components/episode-card";
import SearchBar from "@/components/search-bar";
import { ArrowLeft, Loader2 } from "lucide-react";
import { VideoSourceItem, Anime } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import logoImage from "@assets/generated_images/AniStream_purple_squircle_logo_6bb93de4.png";

export default function VideoPlayer() {
  const { animeId, episodeNumber } = useParams<{ animeId: string; episodeNumber: string }>();
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const episodeId = `${animeId}-${episodeNumber}`;

  const { data: episodes = [] } = useEpisodes(animeId!);
  const { data: anime, isLoading: animeLoading } = useQuery<Anime>({
    queryKey: ["/api/anime", animeId],
    queryFn: () => getAnimeDetails(animeId!),
    enabled: !!animeId,
  });

  const { data: sources = [], isLoading: sourcesLoading, error: sourcesError } = useQuery<VideoSourceItem[]>({
    queryKey: ["/api/episode/sources", animeId, episodeNumber],
    queryFn: () => getVideoSources(`${animeId}-${episodeNumber}`, animeId!, episodeNumber!),
    enabled: !!animeId && !!episodeNumber,
  });

  // Sort episodes by episode number to ensure correct order
  const sortedEpisodes = [...episodes].sort((a, b) => {
    const numA = parseInt(a.episodeNumber) || 0;
    const numB = parseInt(b.episodeNumber) || 0;
    return numA - numB;
  });

  // Group episodes for large anime series
  const episodeGroups = useMemo(() => {
    if (sortedEpisodes.length === 0) {
      return [];
    }

    if (sortedEpisodes.length <= 100) {
      const firstEp = parseInt(sortedEpisodes[0]?.episodeNumber) || 1;
      const lastEp = parseInt(sortedEpisodes[sortedEpisodes.length - 1]?.episodeNumber) || sortedEpisodes.length;
      return [{ 
        label: `EPS: ${firstEp}-${lastEp}`, 
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
        label: `EPS: ${firstEpisode}-${lastEpisode}`,
        key: `${firstEpisode}-${lastEpisode}`,
        episodes: currentGroup
      });
    }

    return groups;
  }, [sortedEpisodes]);

  // Set first group as default when groups change
  useEffect(() => {
    if (episodeGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(episodeGroups[0].key);
    }
  }, [episodeGroups, selectedGroup]);

  // Auto-select first group when groups change
  const effectiveSelectedGroup = selectedGroup || episodeGroups[0]?.key || "all";

  const displayedEpisodes = useMemo(() => {
    if (episodeGroups.length === 0) {
      return sortedEpisodes;
    }
    const group = episodeGroups.find(g => g.key === effectiveSelectedGroup);
    return group?.episodes || sortedEpisodes;
  }, [sortedEpisodes, effectiveSelectedGroup, episodeGroups]);

  const currentEpisodeIndex = sortedEpisodes.findIndex(ep => ep.episodeNumber === episodeNumber);
  const currentEpisode = sortedEpisodes[currentEpisodeIndex];
  const hasNext = currentEpisodeIndex >= 0 && currentEpisodeIndex < sortedEpisodes.length - 1;
  const hasPrevious = currentEpisodeIndex > 0;

  const handleBackToEpisodes = () => {
    setLocation(`/anime/${animeId}`);
  };

  const handlePreviousEpisode = () => {
    if (hasPrevious && currentEpisodeIndex > 0) {
      const prevEpisode = sortedEpisodes[currentEpisodeIndex - 1];
      setLocation(`/watch/${animeId}/${prevEpisode.episodeNumber}`);
    }
  };

  const handleNextEpisode = () => {
    if (hasNext && currentEpisodeIndex < sortedEpisodes.length - 1) {
      const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
      setLocation(`/watch/${animeId}/${nextEpisode.episodeNumber}`);
    }
  };

  const episodeInfo = currentEpisode
    ? `Episode ${currentEpisode.episodeNumber} of ${sortedEpisodes.length}`
    : "";

  if (sourcesLoading || animeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="mica-blur shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setLocation("/")}>
                <img 
                  src={logoImage}
                  alt="AniStream Logo"
                  className="w-10 h-10 rounded-lg"
                />
                <h2 
                  data-testid="app-title"
                  className="text-2xl font-bold text-accent"
                >
                  AniStream
                </h2>
              </div>
              <SearchBar />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]" data-testid="video-loading">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading video sources...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (sourcesError || sources.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="mica-blur shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setLocation("/")}>
                <img 
                  src={logoImage}
                  alt="AniStream Logo"
                  className="w-10 h-10 rounded-lg"
                />
                <h2 
                  data-testid="app-title"
                  className="text-2xl font-bold text-accent"
                >
                  AniStream
                </h2>
              </div>
              <SearchBar />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Button 
            data-testid="button-back-to-episodes"
            variant="ghost" 
            className="mb-4 text-muted hover:text-foreground transition-colors"
            onClick={handleBackToEpisodes}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Episodes
          </Button>

          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4" data-testid="error-message">
                {sourcesError ? "Failed to load video sources" : "No video sources available"}
              </p>
              <Button onClick={handleBackToEpisodes} data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Episodes
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
              <h2 
                data-testid="app-title"
                className="text-2xl font-bold text-accent"
              >
                AniStream
              </h2>
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
          <Button 
            data-testid="button-back-to-episodes"
            variant="ghost" 
            className="mb-4 text-muted hover:text-foreground transition-colors"
            onClick={handleBackToEpisodes}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Episodes
          </Button>

          <div className="grid grid-cols-1 gap-10">
            {/* Video Player */}
            <div>
              <VideoPlayerComponent
                sources={sources}
                title={anime?.title || `Episode ${episodeNumber}`}
                description={currentEpisode?.description}
                onPrevious={hasPrevious ? handlePreviousEpisode : undefined}
                onNext={hasNext ? handleNextEpisode : undefined}
                episodeInfo={episodeInfo}
              />
            </div>

            {/* Episode Grid */}
            <div>
              <Card className="mica-blur border-border">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-foreground">List of episodes:</h2>
                      {episodeGroups.length > 1 && (
                        <Select value={effectiveSelectedGroup} onValueChange={setSelectedGroup}>
                          <SelectTrigger className="w-48" data-testid="episode-group-selector">
                            <SelectValue placeholder="Select episode range" />
                          </SelectTrigger>
                          <SelectContent>
                            {episodeGroups.map((group) => (
                              <SelectItem 
                                key={group.key} 
                                value={group.key}
                                data-testid={`select-episode-group-${group.key}`}
                              >
                                {group.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="grid grid-cols-10 gap-2 justify-items-center" data-testid="episode-grid-player">
                      {displayedEpisodes.length > 0 ? (
                        displayedEpisodes.map((episode) => (
                          <EpisodeCard
                            key={episode.id}
                            episode={episode}
                            onClick={() => setLocation(`/watch/${animeId}/${episode.episodeNumber}`)}
                            isActive={episode.episodeNumber === episodeNumber}
                          />
                        ))
                      ) : (
                        <p className="text-muted-foreground">No episodes available.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
