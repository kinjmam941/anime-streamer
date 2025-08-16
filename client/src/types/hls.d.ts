// Type declarations for HLS.js
declare global {
  interface Window {
    Hls: any;
  }
}

export interface HlsConfig {
  xhrSetup?: (xhr: XMLHttpRequest, url: string) => void;
  debug?: boolean;
  enableWorker?: boolean;
  lowLatencyMode?: boolean;
  backBufferLength?: number;
}

export interface HlsInstance {
  loadSource(url: string): void;
  attachMedia(video: HTMLVideoElement): void;
  destroy(): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

export interface HlsClass {
  new (config?: HlsConfig): HlsInstance;
  isSupported(): boolean;
  Events: {
    MEDIA_ATTACHED: string;
    MANIFEST_PARSED: string;
    ERROR: string;
  };
  ErrorTypes: {
    NETWORK_ERROR: string;
    MEDIA_ERROR: string;
    OTHER_ERROR: string;
  };
}

export {};