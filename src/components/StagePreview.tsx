import { useEffect, useState } from 'react';
import { FormattedDescription, SlideMedia } from './SlideContent';
import type { PresentationConfig, PresentationSlide } from '../types/presentation';
import { getFontStack } from '../utils/storage';

interface StagePreviewProps {
  config: PresentationConfig;
  mode: 'agenda' | 'slide';
  slide?: PresentationSlide | null;
}

export function StagePreview({ config, mode, slide }: StagePreviewProps) {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [config.logoImage]);

  const fontStack = getFontStack(config.theme.fontFamily);
  const accentColor = config.theme.accentColor;

  const hasSlideMedia =
    Boolean(slide) && slide!.mediaType !== 'none' && slide!.mediaUrl.trim().length > 0;
  const hasSlideText = Boolean(slide?.description.trim());

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">
          {mode === 'agenda' ? 'Agenda Screen Preview' : 'Slide Screen Preview'}
        </span>
        <span className="font-mono tabular-nums text-slate-500">16:9 Stage</span>
      </div>

      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 bg-[#0f172a] select-none shadow-lg"
        style={{ fontFamily: fontStack }}
      >
        {/* Backdrop */}
        {config.bgImage.trim() && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${config.bgImage.replace(/"/g, '\\"')}")`,
            }}
          />
        )}

        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(8, 13, 24, ${config.theme.bgOverlayOpacity})`,
          }}
        />

        {/* Agenda Stage Preview */}
        {mode === 'agenda' ? (
          <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
            <div
              className="w-[56%] max-h-[90%] overflow-hidden rounded-xl border border-white/30 px-4 py-3 text-center shadow-xl"
              style={{
                backgroundColor: `rgba(15, 23, 42, ${config.theme.cardOpacity})`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {config.showLogo && config.logoImage.trim() && !logoError && (
                <img
                  src={config.logoImage}
                  alt="Logo preview"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="mx-auto mb-1.5 h-6 w-6 rounded-full object-cover border border-white/25"
                />
              )}

              <div
                className="font-extrabold text-sm leading-tight whitespace-pre-line"
                style={{ color: accentColor }}
              >
                {config.mainTitle || 'Presentation Title'}
              </div>

              {config.subtitle.trim() && (
                <div className="mt-1 text-[9px] font-medium text-slate-200/90 truncate">
                  {config.subtitle}
                </div>
              )}

              <div className="mt-2 space-y-0.5">
                {config.slides.slice(0, 7).map((item) => (
                  <div
                    key={item.id}
                    className="text-[9px] font-semibold text-white/95 truncate leading-tight py-0.5"
                  >
                    {item.menuTitle}
                  </div>
                ))}
                {config.slides.length > 7 && (
                  <div className="text-[8px] text-slate-300/75 tabular-nums pt-0.5">
                    +{config.slides.length - 7} more agenda items
                  </div>
                )}
              </div>

              {config.eventDate.trim() && (
                <div className="mt-2 text-[9px] font-bold tracking-wider text-slate-200 tabular-nums">
                  {config.eventDate}
                </div>
              )}
            </div>
          </div>
        ) : slide ? (
          /* Individual Slide Stage Preview */
          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-5">
            <div className="absolute top-2.5 right-2.5 rounded border border-white/30 bg-slate-900/60 px-2 py-0.5 text-[9px] font-bold text-white">
              Back
            </div>

            <div className={`w-full ${hasSlideMedia ? 'max-w-[92%]' : 'max-w-[78%]'} text-center`}>
              <div
                className="text-white font-extrabold text-base leading-snug mb-2.5 truncate"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
              >
                {slide.slideTitle || 'Untitled Slide'}
              </div>

              {hasSlideMedia ? (
                <div
                  className={`grid gap-3 items-stretch ${
                    hasSlideText ? 'grid-cols-12' : 'grid-cols-1 max-w-[76%] mx-auto'
                  }`}
                >
                  <div
                    className={`${
                      hasSlideText ? 'col-span-7' : 'col-span-1'
                    } aspect-video rounded overflow-hidden border border-white/20 bg-slate-950/75`}
                  >
                    <SlideMedia
                      mediaType={slide.mediaType}
                      mediaUrl={slide.mediaUrl}
                      title={slide.slideTitle}
                      compact
                      className="w-full h-full"
                    />
                  </div>

                  {hasSlideText && (
                    <div
                      className="col-span-5 rounded border border-white/15 p-2.5 text-left overflow-hidden flex items-center"
                      style={{
                        backgroundColor: `rgba(10, 15, 24, ${Math.min(
                          0.82,
                          config.theme.cardOpacity + 0.14
                        )})`,
                      }}
                    >
                      <div className="line-clamp-6 w-full">
                        <FormattedDescription
                          text={slide.description}
                          accentColor={accentColor}
                          compact
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="rounded border border-white/15 p-3 text-left overflow-hidden"
                  style={{
                    backgroundColor: `rgba(10, 15, 24, ${Math.min(
                      0.82,
                      config.theme.cardOpacity + 0.1
                    )})`,
                  }}
                >
                  {hasSlideText ? (
                    <div className="line-clamp-6">
                      <FormattedDescription
                        text={slide.description}
                        accentColor={accentColor}
                        compact
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No description text yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
