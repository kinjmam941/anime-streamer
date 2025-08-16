import { useLocation } from "wouter";
import { SearchResult } from "@shared/schema";

interface AnimeCardProps {
  anime: SearchResult;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/anime/${anime.id}`);
  };

  return (
    <div 
      className="anime-card cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={anime.image}
          alt={anime.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2" style={{color: 'var(--font-color)'}}>
          {anime.title}
        </h3>
        <p className="text-xs" style={{color: 'var(--font-color-sub)'}}>
          {anime.releaseDate}
        </p>
      </div>
    </div>
  );
}