import { useParams, useLocation } from "wouter";
import { useAnimeSearch } from "@/hooks/use-anime-search";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/search-bar";
import { ArrowLeft, Play, Loader2 } from "lucide-react";

export default function SearchResults() {
  const { query } = useParams<{ query: string }>();
  const [, setLocation] = useLocation();
  const { data: results = [], isLoading, error } = useAnimeSearch(query || "");

  const handleAnimeClick = (animeId: string) => {
    setLocation(`/anime/${animeId}`);
  };

  const handleWatchNow = (animeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setLocation(`/anime/${animeId}`);
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  // Determine status based on available episodes or assume default
  const getEpisodeStatus = (anime: any) => {
    if (anime.status) {
      return anime.status.toLowerCase(); // Use explicit status if available
    }
    // Infer status from availableEpisodes if no explicit status
    const episodes = anime.episodes || anime.availableEpisodes;
    return episodes && episodes < 0 ? "Unknown" : episodes ? "Finished" : "Ongoing";
  };

  // Determine status color based on ani-cli script's logic
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return "bg-blue-500 text-white"; // Blue for ongoing, matching \033[1;34m
      case "finished":
        return "bg-green-500 text-white"; // Green for finished, matching \033[1;32m
      default:
        return "bg-gray-500 text-white"; // Gray for unknown
    }
  };

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="fade-in">
          <Button 
            data-testid="button-back-to-home"
            variant="ghost" 
            className="mb-6 text-muted hover:text-foreground transition-colors"
            onClick={handleBackToHome}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Search Results
          </h1>
          <p className="text-muted-foreground mb-8">
            Showing results for "{query}"
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]" data-testid="search-loading">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Searching anime...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-destructive mb-4" data-testid="error-message">
                  Failed to search anime
                </p>
                <Button onClick={handleBackToHome} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4" data-testid="no-results">
                  No anime found for "{query}"
                </p>
                <Button onClick={handleBackToHome} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="search-results">
              {results.map((anime) => {
                const status = getEpisodeStatus(anime);
                const statusColor = getStatusColor(status);

                return (
                  <Card 
                    key={anime.id} 
                    className="anime-card cursor-pointer bg-card border-border hover:shadow-lg transition-all duration-300"
                    onClick={() => handleAnimeClick(anime.id)}
                    data-testid={`card-anime-${anime.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="relative mb-4">
                        <img
                          data-testid={`img-anime-poster-${anime.id}`}
                          src={anime.poster || "/api/placeholder/300/400"}
                          alt={anime.title}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/api/placeholder/300/400";
                          }}
                        />
                        <Button
                          data-testid={`button-watch-now-${anime.id}`}
                          className="absolute top-2 right-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                          size="sm"
                          onClick={(e) => handleWatchNow(anime.id, e)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>

                      <h3 
                        data-testid={`text-anime-title-${anime.id}`}
                        className="font-semibold text-foreground mb-2 line-clamp-2"
                      >
                        {anime.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground" data-testid={`text-episodes-${anime.id}`}>
                          {anime.episodes || anime.availableEpisodes || "N/A"} Episodes
                        </span>
                        <Badge 
                          className={`text-xs ${statusColor}`} 
                          data-testid={`badge-status-${anime.id}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>

                      {anime.year && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-year-${anime.id}`}>
                          {anime.year}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}