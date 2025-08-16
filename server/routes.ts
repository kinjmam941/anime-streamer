import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchResultSchema, episodeListSchema, videoSourceSchema } from "@shared/schema";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Search anime
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters long" });
      }

      // Call external anime API (allanime)
      const searchResults = await searchAnimeFromAPI(query);
      res.json(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search anime" });
    }
  });

  // Get anime details
  app.get("/api/anime/:id", async (req, res) => {
    try {
      const animeId = req.params.id;
      const anime = await getAnimeDetailsFromAPI(animeId);

      if (!anime) {
        return res.status(404).json({ error: "Anime not found" });
      }

      res.json(anime);
    } catch (error) {
      console.error("Anime details error:", error);
      res.status(500).json({ error: "Failed to get anime details" });
    }
  });

  // Get episodes for an anime
  app.get("/api/anime/:id/episodes", async (req, res) => {
    try {
      const animeId = req.params.id;
      const episodes = await getEpisodesFromAPI(animeId);
      res.json(episodes);
    } catch (error) {
      console.error("Episodes error:", error);
      res.status(500).json({ error: "Failed to get episodes" });
    }
  });

  // Get video sources for an episode
  app.get("/api/episode/:id/sources", async (req, res) => {
    try {
      const episodeId = req.params.id;
      const { animeId, episodeNumber } = req.query;

      if (!animeId || !episodeNumber) {
        return res.status(400).json({ error: "animeId and episodeNumber are required" });
      }

      const sources = await getVideoSourcesFromAPI(animeId as string, episodeNumber as string);
      res.json(sources);
    } catch (error) {
      console.error("Video sources error:", error);
      res.status(500).json({ error: "Failed to get video sources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Video source extraction and processing functions based on ani-cli
function processVideoLinks(response: string, allanime_refr: string) {
  const episodeLinks = response
    .split('},{')
    .map(chunk => {
      const linkMatch = chunk.match(/"link":"([^"]*)".*"resolutionStr":"([^"]*)"/);
      const hlsMatch = chunk.match(/"hls","url":"([^"]*)".*"hardsub_lang":"en-US"/);

      if (linkMatch) {
        return { quality: linkMatch[2], url: linkMatch[1] };
      } else if (hlsMatch) {
        return { quality: "auto", url: hlsMatch[1] };
      }
      return null;
    })
    .filter(Boolean);

  const sources = [];

  for (const link of episodeLinks) {
    if (!link) continue;

    // Handle different video source types based on ani-cli logic
    if (link.url.includes('repackager.wixmp.com')) {
      // Extract multiple quality options from wixmp
      const extractLink = link.url.replace(/repackager\.wixmp\.com\//, '').replace(/\.urlset.*/, '');
      const qualityMatches = response.match(/,([^/]*),\/mp4/g);

      if (qualityMatches) {
        qualityMatches.forEach(match => {
          const quality = match.replace(/[,\/]/g, '');
          if (quality.match(/^\d+p?$/)) {
            sources.push({
              quality: quality.includes('p') ? quality : quality + 'p',
              url: extractLink.replace(/,[^/]*/, quality),
              provider: 'wixmp',
              referer: allanime_refr
            });
          }
        });
      }
    } else if (link.url.includes('master.m3u8')) {
      // Handle M3U8 streams
      sources.push({
        quality: link.quality || 'auto',
        url: link.url,
        provider: 'm3u8',
        referer: allanime_refr,
        type: 'hls'
      });
    } else if (link.url.includes('tools.fast4speed.rsvp')) {
      // Handle YouTube-like sources
      sources.push({
        quality: link.quality || '720p',
        url: link.url,
        provider: 'youtube',
        referer: allanime_refr
      });
    } else if (link.url) {
      // Direct MP4 or other video sources
      sources.push({
        quality: link.quality || '720p',
        url: link.url,
        provider: 'direct',
        referer: allanime_refr
      });
    }
  }

  // Sort by quality (highest first)
  return sources.sort((a, b) => {
    const qualityA = parseInt(a.quality.replace('p', '')) || 0;
    const qualityB = parseInt(b.quality.replace('p', '')) || 0;
    return qualityB - qualityA;
  });
}

async function extractM3U8Streams(m3u8Url: string, referer: string) {
  try {
    const response = await fetch(m3u8Url, {
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
        'Referer': referer
      }
    });

    if (!response.ok) return [];

    const m3u8Content = await response.text();

    if (!m3u8Content.includes('EXTM3U')) return [];

    const lines = m3u8Content.split('\n');
    const streams = [];
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/);
        const nextLine = lines[i + 1];

        if (resolutionMatch && nextLine && !nextLine.startsWith('#')) {
          const quality = resolutionMatch[1] + 'p';
          const streamUrl = nextLine.startsWith('http') ? nextLine : baseUrl + nextLine;

          streams.push({
            quality,
            url: streamUrl,
            provider: 'm3u8',
            referer,
            type: 'hls'
          });
        }
      }
    }

    return streams.sort((a, b) => {
      const qualityA = parseInt(a.quality.replace('p', '')) || 0;
      const qualityB = parseInt(b.quality.replace('p', '')) || 0;
      return qualityB - qualityA;
    });
  } catch (error) {
    console.error('M3U8 extraction error:', error);
    return [];
  }
}

// API integration functions similar to ani-cli
async function searchAnimeFromAPI(query: string) {
  const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
  const allanime_refr = "https://allmanga.to";
  const allanime_api = "https://api.allanime.day";

  const search_gql = `query( $search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType ) { shows( search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin ) { edges { _id name availableEpisodes __typename } }}`;

  try {
    const url = new URL(`${allanime_api}/api`);
    url.searchParams.append('variables', JSON.stringify({
      search: { allowAdult: false, allowUnknown: false, query },
      limit: 40,
      page: 1,
      translationType: "sub",
      countryOrigin: "ALL"
    }));
    url.searchParams.append('query', search_gql);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': agent,
        'Referer': allanime_refr
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    const results = data.data?.shows?.edges?.map((show: any) => {
      let title = show.name;

      // Expand common abbreviations
      if (title === "1P") title = "One Piece";
      if (title === "OP") title = "One Piece";
      if (title === "AOT") title = "Attack on Titan";
      if (title === "DS") title = "Demon Slayer";
      if (title === "JJK") title = "Jujutsu Kaisen";
      if (title === "MHA") title = "My Hero Academia";

      return {
        id: show._id,
        title: title,
        episodes: show.availableEpisodes?.sub || 0,
        poster: `https://wp.youtube-anime.com/aln.youtube-anime.com/images/${show._id}.jpg`,
        status: show.status || "Unknown"
      };
    }) || [];

    return results;
  } catch (error) {
    console.error("API search error:", error);
    return [];
  }
}

async function getAnimeDetailsFromAPI(animeId: string) {
  const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
  const allanime_refr = "https://allmanga.to";
  const allanime_api = "https://api.allanime.day";

  try {
    const query = `
      query ($showId: String!) {
        show(_id: $showId) {
          _id
          name
          englishName
          nativeLanguageName
          thumbnail
          thumbnails
          description
          status
          score
          startDate
          endDate
          genres
          studios
          availableEpisodes {
            sub
            dub
          }
        }
      }
    `;

    const response = await fetch(allanime_api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': agent,
        'Referer': allanime_refr
      },
      body: JSON.stringify({
        query,
        variables: { showId: animeId }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const show = data.data?.show;

    if (!show) {
      throw new Error('Show not found');
    }

    let title = show.name || show.englishName || "Unknown Title";

    // Expand common abbreviations
    if (title === "1P") title = "One Piece";
    if (title === "OP") title = "One Piece";
    if (title === "AOT") title = "Attack on Titan";
    if (title === "DS") title = "Demon Slayer";
    if (title === "JJK") title = "Jujutsu Kaisen";
    if (title === "MHA") title = "My Hero Academia";

    return {
      id: animeId,
      title: title,
      episodes: show.availableEpisodes?.sub || 0,
      year: show.startDate ? new Date(show.startDate).getFullYear().toString() : "Unknown",
      status: show.status || "Unknown",
      genres: Array.isArray(show.genres) ? show.genres.join(", ") : "Unknown",
      description: show.description || "No description available",
      poster: `https://wp.youtube-anime.com/aln.youtube-anime.com/images/${animeId}.jpg`
    };
  } catch (error) {
    console.error("API anime details error:", error);
    
    // Try to get basic info from search to at least show correct title
    try {
      const searchResults = await searchAnimeFromAPI(animeId);
      const matchingResult = searchResults.find(result => result.id === animeId);
      
      if (matchingResult) {
        return {
          id: animeId,
          title: matchingResult.title,
          episodes: matchingResult.episodes || 24,
          year: "Unknown",
          status: matchingResult.status || "Unknown",
          genres: "Unknown",
          description: "Description unavailable",
          poster: matchingResult.poster || `https://wp.youtube-anime.com/aln.youtube-anime.com/images/${animeId}.jpg`
        };
      }
    } catch (searchError) {
      console.error("Fallback search failed:", searchError);
    }
    
    return {
      id: animeId,
      title: "Unknown Anime",
      episodes: 24,
      year: "Unknown",
      status: "Unknown",
      genres: "Unknown",
      description: "Description unavailable",
      poster: `https://wp.youtube-anime.com/aln.youtube-anime.com/images/${animeId}.jpg`
    };
  }
}

async function getEpisodesFromAPI(animeId: string) {
  const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
  const allanime_refr = "https://allmanga.to";
  const allanime_api = "https://api.allanime.day";

  const episodes_gql = `query ($showId: String!) { show( _id: $showId ) { _id availableEpisodesDetail }}`;

  try {
    const url = new URL(`${allanime_api}/api`);
    url.searchParams.append('variables', JSON.stringify({ showId: animeId }));
    url.searchParams.append('query', episodes_gql);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': agent,
        'Referer': allanime_refr
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const episodeNumbers = data.data?.show?.availableEpisodesDetail?.sub || [];

    return episodeNumbers.map((epNum: string) => ({
      id: `${animeId}-${epNum}`,
      episodeNumber: epNum,
      title: `Episode ${epNum}`,
      duration: "24 min",
      description: `Episode ${epNum} description`,
      thumbnail: `https://wp.youtube-anime.com/aln.youtube-anime.com/images/${animeId}.jpg`
    }));
  } catch (error) {
    console.error("API episodes error:", error);
    return [];
  }
}

async function getVideoSourcesFromAPI(animeId: string, episodeNumber: string) {
  const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
  const allanime_refr = "https://allanime.to";
  const allanime_api = "https://api.allanime.day";
  const allanime_base = "allanime.day";

  const episode_gql = `query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) { episode( showId: $showId translationType: $translationType episodeString: $episodeString ) { episodeString sourceUrls }}`;

  try {
    console.log(`Fetching video sources for anime ${animeId}, episode ${episodeNumber}`);

    const url = new URL(`${allanime_api}/api`);
    url.searchParams.append('variables', JSON.stringify({
      showId: animeId,
      translationType: "sub",
      episodeString: episodeNumber
    }));
    url.searchParams.append('query', episode_gql);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': agent,
        'Referer': allanime_refr
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const sourceUrls = data.data?.episode?.sourceUrls || [];

    console.log('Raw sourceUrls from API:', JSON.stringify(sourceUrls, null, 2));

    const allSources = [];

    // Process each source URL based on current ani-cli implementation
    for (const source of sourceUrls) {
      if (!source.sourceUrl || !source.sourceName) continue;

      try {
        console.log(`Processing source: ${source.sourceName} - ${source.sourceUrl}`);

        // Decode the hex-encoded sourceUrl path
        const decodedPath = decodeSourceUrl(source.sourceUrl);

        // Make request to get actual video links
        const embedUrl = `https://${allanime_base}${decodedPath}`;
        console.log(`Fetching embed URL: ${embedUrl}`);

        const embedResponse = await fetch(embedUrl, {
          headers: {
            'User-Agent': agent,
            'Referer': allanime_refr
          }
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.text();
          console.log(`Embed response length: ${embedData.length}`);

          // Extract video links using sed-like parsing from ani-cli
          const links = extractVideoLinks(embedData);
          console.log(`Extracted ${links.length} video links`);

          allSources.push(...links);
        } else {
          console.log(`Embed request failed: ${embedResponse.status}`);
        }
      } catch (embedError) {
        console.error(`Error processing source ${source.sourceName}:`, embedError);
      }
    }

    // Remove duplicates and sort by quality
    const uniqueSources = allSources.filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url)
    );

    console.log(`Final sources count: ${uniqueSources.length}`);

    return uniqueSources.length > 0 ? uniqueSources : [];
  } catch (error) {
    console.error("API video sources error:", error);
    return [];
  }
}

// Extract video links from embed response similar to ani-cli
function extractVideoLinks(response: string): any[] {
  const links = [];

  try {
    // Split response into chunks and process each line
    const chunks = response.split(/[{}]/);

    for (const chunk of chunks) {
      // Look for link and resolution patterns from ani-cli
      const linkMatch = chunk.match(/"link":"([^"]*)".*"resolutionStr":"([^"]*)"/);
      const hlsMatch = chunk.match(/"hls","url":"([^"]*)".*"hardsub_lang":"en-US"/);

      if (linkMatch) {
        const [, url, quality] = linkMatch;
        links.push({
          quality: quality || "720p",
          url: url.replace(/\\u002F/g, '/').replace(/\\/g, ''),
          provider: "direct",
          referer: "https://allanime.to",
          type: "mp4"
        });
      } else if (hlsMatch) {
        const [, url] = hlsMatch;
        links.push({
          quality: "auto",
          url: url.replace(/\\u002F/g, '/').replace(/\\/g, ''),
          provider: "hls",
          referer: "https://allanime.to",
          type: "hls"
        });
      }
    }

    // Sort by quality (highest first)
    return links.sort((a, b) => {
      const qualityA = parseInt(a.quality.replace('p', '')) || 720;
      const qualityB = parseInt(b.quality.replace('p', '')) || 720;
      return qualityB - qualityA;
    });
  } catch (error) {
    console.error('Error extracting video links:', error);
    return [];
  }
}

// Decode source URL based on exact ani-cli implementation
function decodeSourceUrl(encodedUrl: string): string {
  try {
    // Remove the leading '--' if present
    let cleanUrl = encodedUrl.replace(/^--/, '');

    // Apply the exact character mapping from ani-cli
    const mapping: { [key: string]: string } = {
      '79': 'A', '7a': 'B', '7b': 'C', '7c': 'D', '7d': 'E', '7e': 'F', '7f': 'G',
      '70': 'H', '71': 'I', '72': 'J', '73': 'K', '74': 'L', '75': 'M', '76': 'N', '77': 'O',
      '68': 'P', '69': 'Q', '6a': 'R', '6b': 'S', '6c': 'T', '6d': 'U', '6e': 'V', '6f': 'W',
      '60': 'X', '61': 'Y', '62': 'Z', '59': 'a', '5a': 'b', '5b': 'c', '5c': 'd', '5d': 'e',
      '5e': 'f', '5f': 'g', '50': 'h', '51': 'i', '52': 'j', '53': 'k', '54': 'l', '55': 'm',
      '56': 'n', '57': 'o', '48': 'p', '49': 'q', '4a': 'r', '4b': 's', '4c': 't', '4d': 'u',
      '4e': 'v', '4f': 'w', '40': 'x', '41': 'y', '42': 'z', '08': '0', '09': '1', '0a': '2',
      '0b': '3', '0c': '4', '0d': '5', '0e': '6', '0f': '7', '00': '8', '01': '9', '15': '-',
      '16': '.', '67': '_', '46': '~', '02': ':', '17': '/', '07': '?', '1b': '#', '63': '[',
      '65': ']', '78': '@', '19': '!', '1c': '$', '1e': '&', '10': '(', '11': ')', '12': '*',
      '13': '+', '14': ',', '03': ';', '05': '=', '1d': '%'
    };

    // Split into hex pairs and decode
    let decoded = '';
    for (let i = 0; i < cleanUrl.length; i += 2) {
      const hexPair = cleanUrl.substr(i, 2);
      if (hexPair.length === 2) {
        decoded += mapping[hexPair] || String.fromCharCode(parseInt(hexPair, 16));
      }
    }

    // Add the .json extension as in ani-cli
    if (decoded.includes('/clock')) {
      decoded = decoded.replace('/clock', '/clock.json');
    }

    console.log('Decoded URL path:', decoded);
    return decoded;
  } catch (error) {
    console.error('URL decode error:', error);
    return encodedUrl;
  }
}