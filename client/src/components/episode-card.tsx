import { Card, CardContent } from "@/components/ui/card";
import { EpisodeListItem } from "@shared/schema";
import { Play } from "lucide-react";

interface EpisodeCardProps {
  episode: EpisodeListItem;
  onClick: () => void;
}

export default function EpisodeCard({ episode, onClick }: EpisodeCardProps) {
  return (
    <Card
      data-testid={`episode-card-${episode.id}`}
      className="episode-card cursor-pointer bg-primary/50 border-border hover:bg-accent/10 transition-all duration-300 hover:scale-105 w-16 h-16"
      onClick={onClick}
    >
      <CardContent className="p-2 h-full flex items-center justify-center">
        <div className="relative group w-full h-full">
          <div className="w-full h-full flex items-center justify-center rounded">
            <span className="text-sm font-bold text-foreground">
              {episode.episodeNumber}
            </span>
          </div>
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="text-white w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}