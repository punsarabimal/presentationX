import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FormattedDescription, SlideMedia } from './components/SlideContent';
import type { PresentationConfig } from './types/presentation';
import {
  PRESENTATION_STORAGE_KEY,
  getFontStack,
  hexToRgba,
  loadPresentationData,
} from './utils/storage';

function useViewportFit(
  deps: unknown[],
  paddingYRatio = 0.05,
  paddingXRatio = 0.04,
  maxScale = 1
) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const computeScale = () => {
      const el = contentRef.current;
      if (!el) return;

      const naturalWidth = el.offsetWidth;
      const naturalHeight = el.offsetHeight;
      if (!naturalWidth || !naturalHeight) return;

      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      const padX = Math.max(24, vw * paddingXRatio * 2);
      const padY = Math.max(24, vh * paddingYRatio * 2);
      const availWidth = Math.max(120, vw - padX);
      const availHeight = Math.max(120, vh - padY);

      const nextScale = Math.min(maxScale, availWidth / naturalWidth, availHeight / naturalHeight);
      setScale(Number(nextScale.toFixed(4)));
    };

    computeScale();

    const observer = new ResizeObserver(computeScale);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    window.addEventListener('resize', computeScale);
    window.visualViewport?.addEventListener('resize', computeScale);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(computeScale).catch(() => {});
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', computeScale);
      window.visualViewport?.removeEventListener('resize', computeScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { contentRef, scale };
}

export default function App() {
  const [config, setConfig] = useState<PresentationConfig>(() => loadPresentationData().config);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Sync document title cleanly with presentation main title
  useEffect(() => {
    const cleanTitle = config.mainTitle.replace(/\s+/g, ' ').trim();
    if (cleanTitle) {
      document.title = cleanTitle;
    }
  }, [config.mainTitle]);

  useEffect(() => {
    setLogoError(false);
  }, [config.logoImage]);

  // Live synchronization across tabs/windows when editor.html saves or resets localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PRESENTATION_STORAGE_KEY || event.key === null) {
        const { config: updated } = loadPresentationData();
        setConfig(updated);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // If the currently open slide was deleted in editor.html, return gracefully to the agenda screen
  const activeSlideIndex = useMemo(() => {
    if (!activeSlideId) return -1;
    return config.slides.findIndex((slide) => slide.id === activeSlideId);
  }, [activeSlideId, config.slides]);

  useEffect(() => {
    if (activeSlideId !== null && activeSlideIndex === -1) {
      setActiveSlideId(null);
    }
  }, [activeSlideId, activeSlideIndex]);

  const activeSlide = activeSlideIndex >= 0 ? config.slides[activeSlideIndex] : null;

  const openSlideByIndex = useCallback(
    (index: number) => {
      const target = config.slides[index];
      if (target) {
        setActiveSlideId(target.id);
      }
    },
    [config.slides]
  );

  const returnToAgenda = useCallback(() => {
    setActiveSlideId(null);
  }, []);

  // Keyboard navigation: Escape to return to agenda, Left/Right arrows to step through slides
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeSlide) return;

      if (event.key === 'Escape') {
        returnToAgenda();
      } else if (event.key === 'ArrowRight' && activeSlideIndex < config.slides.length - 1) {
        openSlideByIndex(activeSlideIndex + 1);
      } else if (event.key === 'ArrowLeft' && activeSlideIndex > 0) {
        openSlideByIndex(activeSlideIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, activeSlideIndex, config.slides.length, openSlideByIndex, returnToAgenda]);

  const fontStack = getFontStack(config.theme.fontFamily);
  const accentColor = config.theme.accentColor;
  const hoverBg = hexToRgba(accentColor, 0.2);
  const hoverBorder = hexToRgba(accentColor, 0.55);

  const hasSlideMedia =
    Boolean(activeSlide) &&
    activeSlide!.mediaType !== 'none' &&
    activeSlide!.mediaUrl.trim().length > 0;
  const hasSlideText = Boolean(activeSlide?.description.trim());

  // Automatically scale agenda card or active slide to fit 100% inside the viewport with zero scrolling
  const { contentRef: agendaFitRef, scale: agendaScale } = useViewportFit(
    [
      activeSlide === null,
      config.mainTitle,
      config.subtitle,
      config.eventDate,
      config.showLogo,
      config.logoImage,
      config.theme.fontFamily,
      config.slides,
    ],
    0.035,
    0.035,
    1.2
  );

  const { contentRef: slideFitRef, scale: slideScale } = useViewportFit(
    [
      activeSlide?.id,
      activeSlide?.slideTitle,
      activeSlide?.description,
      activeSlide?.mediaType,
      activeSlide?.mediaUrl,
      config.theme.fontFamily,
    ],
    0.075,
    0.04
  );

  return (
    <div
      className="relative h-[100dvh] w-screen flex items-center justify-center overflow-hidden bg-[#0f172a] text-white"
      style={{ fontFamily: fontStack }}
    >
      {/* Fixed full-screen nature/event backdrop */}
      {config.bgImage.trim() && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
          style={{
            backgroundImage: `url("${config.bgImage.replace(/"/g, '\\"')}")`,
          }}
        />
      )}

      {/* Measured contrast scrim over backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: `rgba(8, 13, 24, ${config.theme.bgOverlayOpacity})`,
        }}
      />

      {/* MAIN AGENDA MENU — Always fits 100% in viewport with zero scrollbars */}
      {!activeSlide && (
        <div
          ref={agendaFitRef}
          className="relative z-10 shrink-0 origin-center transition-transform duration-150 ease-out"
          style={{
            width: 'min(92vw, 560px)',
            transform: `scale(${agendaScale})`,
          }}
        >
          <main
            className="w-full text-center overflow-hidden animate-slide-reveal"
            style={{
              backgroundColor: `rgba(15, 23, 42, ${config.theme.cardOpacity})`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255, 255, 255, 0.32)',
              borderRadius: '18px',
              padding: '22px 36px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.52)',
            }}
          >
            {config.showLogo && config.logoImage.trim() && !logoError && (
              <img
                src={config.logoImage}
                alt="Program Logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="mx-auto rounded-full object-cover border border-white/25 mb-2"
                style={{ width: '44px', height: '44px' }}
              />
            )}

            <h1
              className="font-extrabold leading-[1.22] whitespace-pre-line"
              style={{
                color: accentColor,
                fontSize: 'clamp(1.45rem, 2.7vw, 2rem)',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.7)',
                textWrap: 'balance',
                marginBottom: config.subtitle.trim() ? '6px' : '14px',
              }}
            >
              {config.mainTitle}
            </h1>

            {config.subtitle.trim() && (
              <p
                className="text-slate-200/95 font-semibold mb-3.5"
                style={{
                  fontSize: '0.9rem',
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                }}
              >
                {config.subtitle}
              </p>
            )}

            <nav aria-label="Event Agenda" className="flex flex-col gap-1">
              {config.slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => openSlideByIndex(index)}
                  className="group w-full flex items-center justify-center rounded-lg border border-transparent text-white font-bold cursor-pointer transition-all duration-150 focus-visible:outline-none"
                  style={{
                    fontSize: '1.08rem',
                    lineHeight: 1.3,
                    padding: '5px 16px',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.borderColor = hoverBorder;
                    e.currentTarget.style.color = accentColor;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.borderColor = hoverBorder;
                    e.currentTarget.style.color = accentColor;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                >
                  <span>{slide.menuTitle}</span>
                </button>
              ))}
            </nav>

            {config.eventDate.trim() && (
              <div
                className="text-slate-200 font-bold tracking-[0.08em] tabular-nums mt-3.5"
                style={{
                  fontSize: '0.98rem',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)',
                }}
              >
                {config.eventDate}
              </div>
            )}
          </main>
        </div>
      )}

      {/* INDIVIDUAL SLIDE SCREEN — Always fits 100% in viewport with zero scrollbars */}
      {activeSlide && (
        <section
          aria-label={activeSlide.slideTitle}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest('[data-slide-interactive="true"]')) {
              returnToAgenda();
            }
          }}
          className="fixed inset-0 z-20 flex items-center justify-center overflow-hidden animate-slide-reveal"
        >
          {/* Corner Back Button */}
          <button
            type="button"
            data-slide-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              returnToAgenda();
            }}
            className="fixed z-30 rounded-lg border border-white/35 bg-slate-900/60 text-white font-bold cursor-pointer backdrop-blur-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            style={{
              top: 'clamp(14px, 2.5vh, 24px)',
              right: 'clamp(14px, 2.5vw, 24px)',
              fontSize: 'clamp(0.82rem, 1.35vw, 0.95rem)',
              padding: '7px 16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentColor;
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            Back
          </button>

          {/* Center Slide Content (Auto-Scaled to Viewport) */}
          <div
            ref={slideFitRef}
            className="relative z-20 shrink-0 text-center origin-center transition-transform duration-150 ease-out"
            style={{
              width: hasSlideMedia ? 'min(90vw, 1120px)' : 'min(86vw, 780px)',
              transform: `scale(${slideScale})`,
            }}
          >
            <h2
              className="text-white font-extrabold leading-[1.26]"
              style={{
                fontSize: 'clamp(1.6rem, 3.8vw, 2.8rem)',
                marginBottom: 'clamp(16px, 2.6vh, 26px)',
                textShadow: '0 3px 16px rgba(0, 0, 0, 0.92), 0 0 28px rgba(0, 0, 0, 0.65)',
                textWrap: 'balance',
              }}
            >
              {activeSlide.slideTitle}
            </h2>

            {hasSlideMedia ? (
              <div
                data-slide-interactive="true"
                className={`grid gap-6 items-stretch ${
                  hasSlideText ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-4xl mx-auto'
                }`}
              >
                <div
                  className={`${
                    hasSlideText ? 'lg:col-span-7' : 'w-full'
                  } rounded-lg overflow-hidden border border-white/20 bg-slate-950/70 shadow-2xl aspect-video lg:aspect-auto lg:min-h-[340px] max-h-[58dvh]`}
                >
                  <SlideMedia
                    mediaType={activeSlide.mediaType}
                    mediaUrl={activeSlide.mediaUrl}
                    title={activeSlide.slideTitle}
                    className="w-full h-full"
                  />
                </div>

                {hasSlideText && (
                  <div
                    className="lg:col-span-5 flex flex-col justify-center rounded-lg border border-white/15 text-left shadow-2xl"
                    style={{
                      backgroundColor: `rgba(10, 15, 24, ${Math.min(0.82, config.theme.cardOpacity + 0.14)})`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      padding: 'clamp(20px, 3vw, 34px)',
                    }}
                  >
                    <FormattedDescription
                      text={activeSlide.description}
                      accentColor={accentColor}
                    />
                  </div>
                )}
              </div>
            ) : (
              hasSlideText && (
                <div
                  data-slide-interactive="true"
                  className="rounded-md border border-white/15 text-left shadow-2xl"
                  style={{
                    backgroundColor: `rgba(10, 15, 24, ${Math.min(0.82, config.theme.cardOpacity + 0.1)})`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: 'clamp(22px, 3.8vw, 38px) clamp(24px, 4.2vw, 44px)',
                  }}
                >
                  <FormattedDescription
                    text={activeSlide.description}
                    accentColor={accentColor}
                  />
                </div>
              )
            )}
          </div>

          {/* Subtle Slide Stepper Controls */}
          {config.slides.length > 1 && (
            <div
              data-slide-interactive="true"
              className="fixed bottom-5 right-5 z-30 flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="Previous slide"
                disabled={activeSlideIndex <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  openSlideByIndex(activeSlideIndex - 1);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-slate-900/55 text-white backdrop-blur-md transition-colors hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="px-2 text-xs font-semibold tracking-wider text-slate-200/90 tabular-nums select-none">
                {String(activeSlideIndex + 1).padStart(2, '0')} /{' '}
                {String(config.slides.length).padStart(2, '0')}
              </span>

              <button
                type="button"
                aria-label="Next slide"
                disabled={activeSlideIndex >= config.slides.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  openSlideByIndex(activeSlideIndex + 1);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-slate-900/55 text-white backdrop-blur-md transition-colors hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
