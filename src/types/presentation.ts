export type MediaType = 'none' | 'image' | 'gif' | 'video';

export type FontChoice =
  | 'Noto Sans Sinhala'
  | 'Plus Jakarta Sans'
  | 'Outfit'
  | 'Playfair Display';

export interface PresentationTheme {
  accentColor: string;
  cardOpacity: number;
  bgOverlayOpacity: number;
  fontFamily: FontChoice;
}

export interface PresentationSlide {
  id: string;
  menuTitle: string;
  slideTitle: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string;
}

export interface PresentationConfig {
  mainTitle: string;
  subtitle: string;
  eventDate: string;
  bgImage: string;
  logoImage: string;
  showLogo: boolean;
  theme: PresentationTheme;
  slides: PresentationSlide[];
}

declare global {
  interface Window {
    PRESENTATION_DATA?: Partial<PresentationConfig>;
  }
}
