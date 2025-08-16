import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoSourceItem } from "@shared/schema";
import { Settings, Maximize, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoPlayerComponentProps {
  sources: VideoSourceItem[];
  title: string;
  description?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  episodeInfo?: string;
}

export default function VideoPlayerComponent({
  sources,
  title,
  description,
  onPrevious,
  onNext,
  episodeInfo,
}: VideoPlayerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSource, setCurrentSource] = useState(0);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [currentQuality, setCurrentQuality] = useState("720p");
  const [isHlsSupported, setIsHlsSupported] = useState(false);

  useEffect(() => {
    // Check if HLS is natively supported
    const video = document.createElement('video');
    setIsHlsSupported(video.canPlayType('application/vnd.apple.mpegurl') !== '');
  }, []);

  useEffect(() => {
    if (sources.length > 0 && videoRef.current) {
      const currentVideoSource = sources[currentSource];
      if (!currentVideoSource) return;

      const video = videoRef.current;
      
      // Handle different video source types
      if (currentVideoSource.provider === 'm3u8' || currentVideoSource.url.includes('.m3u8')) {
        // Handle HLS streams
        if (isHlsSupported) {
          // Native HLS support (Safari)
          video.src = currentVideoSource.url;
        } else {
          // For other browsers, try to load HLS.js dynamically
          loadHlsJs().then((Hls) => {
            if (Hls && Hls.isSupported()) {
              const hls = new Hls({
                xhrSetup: (xhr: XMLHttpRequest) => {
                  if (currentVideoSource.referer) {
                    xhr.setRequestHeader('Referer', currentVideoSource.referer);
                  }
                }
              });
              hls.loadSource(currentVideoSource.url);
              hls.attachMedia(video);
            } else {
              // Fallback to direct URL
              video.src = currentVideoSource.url;
            }
          }).catch(() => {
            // If HLS.js fails to load, try direct URL
            video.src = currentVideoSource.url;
          });
        }
      } else {
        // Direct video source (MP4, WebM, etc.)
        video.src = currentVideoSource.url;
        
        // Set referrer for CORS if needed
        if (currentVideoSource.referer) {
          video.crossOrigin = "anonymous";
        }
      }
    }
  }, [sources, currentSource, isHlsSupported]);

  // Dynamic HLS.js loading
  const loadHlsJs = async () => {
    try {
      if (typeof window !== 'undefined' && !window.Hls) {
        // Try to load HLS.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
          script.onload = () => resolve(window.Hls);
          script.onerror = () => resolve(null);
        });
      }
      return window.Hls || null;
    } catch (error) {
      console.error('Failed to load HLS.js:', error);
      return null;
    }
  };

  const handleQualityChange = (quality: string) => {
    const sourceIndex = sources.findIndex(s => s.quality === quality);
    if (sourceIndex !== -1) {
      setCurrentSource(sourceIndex);
      setCurrentQuality(quality);
    }
    setShowQualitySelector(false);
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const availableQualities = Array.from(new Set(sources.map(s => s.quality)));

  return (
    <div className="space-y-6">
      <Card className="bg-secondary border-border overflow-hidden">
        <div className="relative bg-black" style={{ paddingBottom: "56.25%" }}>
          <video
            ref={videoRef}
            data-testid="video-player"
            className="absolute top-0 left-0 w-full h-full"
            controls
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>

          {/* Quality Selection Overlay */}
          {showQualitySelector && (
            <div
              data-testid="quality-selector"
              className="absolute top-4 right-4 bg-black/75 rounded-lg p-2"
            >
              <div className="flex flex-col space-y-2">
                {availableQualities.map((quality) => (
                  <Button
                    key={quality}
                    data-testid={`quality-option-${quality}`}
                    variant={quality === currentQuality ? "default" : "ghost"}
                    size="sm"
                    className="text-sm"
                    onClick={() => handleQualityChange(quality)}
                  >
                    {quality}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{title}</h2>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Button
                data-testid="button-fullscreen"
                variant="secondary"
                onClick={toggleFullscreen}
              >
                <Maximize className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>

          {description && (
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
          )}

          {/* Episode Navigation */}
          <div className="flex items-center justify-between">
            <Button
              data-testid="button-previous"
              variant="secondary"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Episode
            </Button>
            {episodeInfo && (
              <span className="text-muted-foreground" data-testid="text-episode-info">
                {episodeInfo}
              </span>
            )}
            <Button
              data-testid="button-next"
              variant="secondary"
              onClick={onNext}
              disabled={!onNext}
            >
              Next Episode
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
