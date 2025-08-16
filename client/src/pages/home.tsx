import { useLocation } from "wouter";
import SearchBar from "@/components/search-bar";
import logoImage from "@assets/generated_images/AniStream_purple_squircle_logo_6bb93de4.png";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mica-blur shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setLocation("/")}>
              <img
                src={logoImage}
                alt="AniStream Logo"
                className="w-12 h-12 rounded-xl"
              />
              <h1
                data-testid="app-title"
                className="text-3xl font-bold text-accent"
              >
                AniStream
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-20 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center mb-16 max-w-4xl">
            <h2 className="text-6xl font-bold mb-8 leading-tight" style={{color: 'var(--main-color)'}}>
              Welcome to AniStream
            </h2>
            <p className="text-2xl mb-6 leading-relaxed" style={{color: 'var(--font-color-sub)'}}>
              Discover and watch your favorite anime series
            </p>
            <p className="text-xl leading-relaxed" style={{color: 'var(--font-color-sub)'}}>
              Search through thousands of anime titles and start streaming instantly
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>
        </div>
      </main>
    </div>
  );
}