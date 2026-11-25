import type {
  FontChoice,
  MediaType,
  PresentationConfig,
  PresentationSlide,
} from '../types/presentation';

export const PRESENTATION_STORAGE_KEY = 'green_leader_presentation_live_v1';

const ALLOWED_FONTS: FontChoice[] = [
  'Noto Sans Sinhala',
  'Plus Jakarta Sans',
  'Outfit',
  'Playfair Display',
];

const ALLOWED_MEDIA: MediaType[] = ['none', 'image', 'gif', 'video'];

const FALLBACK_CONFIG: PresentationConfig = {
  mainTitle: 'Green Leader\nProgram',
  subtitle: 'National College of Education on Technology, Kuliyapitiya',
  eventDate: '18.11.2026',
  bgImage: '/src/assets/images/green_leader_backdrop_1795205001817.jpg',
  logoImage: '/src/assets/images/green_leader_logo_1795205002373.jpg',
  showLogo: true,
  theme: {
    accentColor: '#00E5FF',
    cardOpacity: 0.54,
    bgOverlayOpacity: 0.22,
    fontFamily: 'Noto Sans Sinhala',
  },
  slides: [
    {
      id: 'slide-1',
      menuTitle: 'Slide 1',
      slideTitle: 'Slide 1',
      description: '',
      mediaType: 'none',
      mediaUrl: '',
    },
    {
      id: 'slide-2',
      menuTitle: 'Slide 2',
      slideTitle: 'Slide 2',
      description: '',
      mediaType: 'none',
      mediaUrl: '',
    },
  ],
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normalizeSlide(raw: Partial<PresentationSlide>, index: number): PresentationSlide {
  const mediaType = ALLOWED_MEDIA.includes(raw.mediaType as MediaType)
    ? (raw.mediaType as MediaType)
    : 'none';

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim().length > 0
        ? raw.id
        : `slide-${index + 1}-${Date.now()}`,
    menuTitle: typeof raw.menuTitle === 'string' ? raw.menuTitle : `Agenda Item ${index + 1}`,
    slideTitle: typeof raw.slideTitle === 'string' ? raw.slideTitle : `Agenda Item ${index + 1}`,
    description: typeof raw.description === 'string' ? raw.description : '',
    mediaType,
    mediaUrl: typeof raw.mediaUrl === 'string' ? raw.mediaUrl : '',
  };
}

export function normalizePresentationConfig(
  raw: Partial<PresentationConfig> | null | undefined,
  base: PresentationConfig = FALLBACK_CONFIG
): PresentationConfig {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as PresentationConfig;
  }

  const rawTheme = raw.theme ?? base.theme;
  const fontFamily = ALLOWED_FONTS.includes(rawTheme.fontFamily as FontChoice)
    ? (rawTheme.fontFamily as FontChoice)
    : base.theme.fontFamily;

  const accentColor =
    typeof rawTheme.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(rawTheme.accentColor.trim())
      ? rawTheme.accentColor.trim()
      : base.theme.accentColor;

  const rawSlides = Array.isArray(raw.slides) ? raw.slides : base.slides;
  const slides = rawSlides.map((s, idx) => normalizeSlide(s, idx));

  return {
    mainTitle: typeof raw.mainTitle === 'string' ? raw.mainTitle : base.mainTitle,
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : base.subtitle,
    eventDate: typeof raw.eventDate === 'string' ? raw.eventDate : base.eventDate,
    bgImage: typeof raw.bgImage === 'string' ? raw.bgImage : base.bgImage,
    logoImage: typeof raw.logoImage === 'string' ? raw.logoImage : base.logoImage,
    showLogo: typeof raw.showLogo === 'boolean' ? raw.showLogo : base.showLogo,
    theme: {
      accentColor,
      cardOpacity: clampNumber(rawTheme.cardOpacity, 0.25, 0.9, base.theme.cardOpacity),
      bgOverlayOpacity: clampNumber(rawTheme.bgOverlayOpacity, 0, 0.8, base.theme.bgOverlayOpacity),
      fontFamily,
    },
    slides,
  };
}

export function getDefaultPresentationData(): PresentationConfig {
  const fromDataJs = typeof window !== 'undefined' ? window.PRESENTATION_DATA : undefined;
  return normalizePresentationConfig(fromDataJs, FALLBACK_CONFIG);
}

export function getBlankPresentationData(): PresentationConfig {
  const defaults = getDefaultPresentationData();
  return {
    mainTitle: 'Event Title',
    subtitle: 'Organization or Venue Subtitle',
    eventDate: 'DD.MM.YYYY',
    bgImage: defaults.bgImage,
    logoImage: defaults.logoImage,
    showLogo: true,
    theme: { ...defaults.theme },
    slides: [
      {
        id: `slide-${Date.now()}`,
        menuTitle: 'Agenda Item 1',
        slideTitle: 'Agenda Item 1',
        description: 'Enter slide details here...\n- Key point one\n- Key point two',
        mediaType: 'none',
        mediaUrl: '',
      },
    ],
  };
}

export function loadPresentationData(): { config: PresentationConfig; hasLocalOverrides: boolean } {
  const defaultData = getDefaultPresentationData();
  try {
    const raw = window.localStorage.getItem(PRESENTATION_STORAGE_KEY);
    if (!raw) {
      return { config: defaultData, hasLocalOverrides: false };
    }
    const parsed = JSON.parse(raw) as Partial<PresentationConfig>;
    return {
      config: normalizePresentationConfig(parsed, defaultData),
      hasLocalOverrides: true,
    };
  } catch {
    return { config: defaultData, hasLocalOverrides: false };
  }
}

export function savePresentationData(config: PresentationConfig): { ok: boolean; error?: string } {
  try {
    window.localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(config));
    return { ok: true };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: isQuota
        ? 'Browser storage limit exceeded. Use relative file paths or URLs for large images and videos instead of uploading large files.'
        : 'Unable to save presentation data to browser localStorage.',
    };
  }
}

export function resetPresentationData(): PresentationConfig {
  try {
    window.localStorage.removeItem(PRESENTATION_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors in restricted contexts
  }
  return getDefaultPresentationData();
}

export function generateDataJsContent(config: PresentationConfig): string {
  const serialized = JSON.stringify(config, null, 2);
  return `/**
 * Presentation Configuration Data
 * Generated by Presentation Content Manager
 * Replace public/data.js (or data.js next to index.html) for permanent offline portability.
 */
window.PRESENTATION_DATA = ${serialized};
`;
}

export function downloadDataJs(config: PresentationConfig): void {
  const content = generateDataJsContent(config);
  const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'data.js';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `rgba(0, 229, 255, ${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getFontStack(fontFamily: FontChoice): string {
  switch (fontFamily) {
    case 'Plus Jakarta Sans':
      return "'Plus Jakarta Sans', 'Noto Sans Sinhala', sans-serif";
    case 'Outfit':
      return "'Outfit', 'Noto Sans Sinhala', sans-serif";
    case 'Playfair Display':
      return "'Playfair Display', 'Noto Sans Sinhala', serif";
    case 'Noto Sans Sinhala':
    default:
      return "'Noto Sans Sinhala', 'Plus Jakarta Sans', sans-serif";
  }
}
