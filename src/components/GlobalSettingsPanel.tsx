import type { ChangeEvent } from 'react';
import { Eye, EyeOff, Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import type { FontChoice, PresentationConfig } from '../types/presentation';
import { getDefaultPresentationData } from '../utils/storage';

interface GlobalSettingsPanelProps {
  config: PresentationConfig;
  onChange: (updater: (prev: PresentationConfig) => PresentationConfig) => void;
  onNotify: (message: string, type?: 'info' | 'warning') => void;
}

const ACCENT_PRESETS = [
  { name: 'Cyan', hex: '#00E5FF' },
  { name: 'Emerald', hex: '#34D399' },
  { name: 'Sky', hex: '#38BDF8' },
  { name: 'Amber', hex: '#FBBF24' },
  { name: 'Coral', hex: '#FB7185' },
];

const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
  { value: 'Noto Sans Sinhala', label: 'Noto Sans Sinhala (Default)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Outfit', label: 'Outfit Geometric' },
  { value: 'Playfair Display', label: 'Playfair Display Serif' },
];

export function GlobalSettingsPanel({ config, onChange, onNotify }: GlobalSettingsPanelProps) {
  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>,
    field: 'bgImage' | 'logoImage'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      onNotify(
        'Large file detected (>2.5 MB). If Save Live exceeds browser localStorage limits, place the file locally and use its relative path instead.',
        'warning'
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        onChange((prev) => ({
          ...prev,
          [field]: dataUrl,
          ...(field === 'logoImage' ? { showLogo: true } : {}),
        }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const restoreDefaultAsset = (field: 'bgImage' | 'logoImage') => {
    const defaults = getDefaultPresentationData();
    onChange((prev) => ({
      ...prev,
      [field]: defaults[field],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Event Identity */}
      <section className="space-y-4">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Event Identity</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure the headline, subtitle, and event date displayed on the main agenda screen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="global-main-title" className="block text-xs font-medium text-slate-300">
              Main Title <span className="text-slate-500">(Press Enter for line breaks)</span>
            </label>
            <textarea
              id="global-main-title"
              rows={2}
              value={config.mainTitle}
              onChange={(e) => onChange((prev) => ({ ...prev, mainTitle: e.target.value }))}
              placeholder="Green Leader&#10;Program"
              className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors resize-y"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="global-date" className="block text-xs font-medium text-slate-300">
                Event Date
              </label>
              <input
                id="global-date"
                type="text"
                value={config.eventDate}
                onChange={(e) => onChange((prev) => ({ ...prev, eventDate: e.target.value }))}
                placeholder="e.g. 18.11.2026"
                className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="global-subtitle" className="block text-xs font-medium text-slate-300">
                Subtitle / Institution
              </label>
              <input
                id="global-subtitle"
                type="text"
                value={config.subtitle}
                onChange={(e) => onChange((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Optional venue or organization subtitle"
                className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Background & Branding */}
      <section className="space-y-5">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Backdrop &amp; Emblem</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Specify local relative paths, image URLs, or upload images directly.
          </p>
        </div>

        {/* Background Image Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          <div className="sm:col-span-4 aspect-video rounded-lg overflow-hidden border border-white/12 bg-[#0b1220] flex items-center justify-center">
            {config.bgImage.trim() ? (
              <img
                src={config.bgImage}
                alt="Backdrop thumbnail"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-500 text-xs">
                <ImageIcon className="w-4 h-4" />
                <span>Solid dark slate</span>
              </div>
            )}
          </div>

          <div className="sm:col-span-8 space-y-2.5">
            <label htmlFor="global-bg-url" className="block text-xs font-medium text-slate-300">
              Background Image Path or URL
            </label>
            <input
              id="global-bg-url"
              type="text"
              value={config.bgImage.startsWith('data:') ? '' : config.bgImage}
              onChange={(e) => onChange((prev) => ({ ...prev, bgImage: e.target.value }))}
              placeholder={
                config.bgImage.startsWith('data:')
                  ? 'Custom uploaded image (paste a URL/path to replace)'
                  : './images/background.jpg or https://...'
              }
              className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors font-mono text-xs"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={(e) => handleImageUpload(e, 'bgImage')}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => restoreDefaultAsset('bgImage')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/25 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Default Backdrop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logo Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2 border-t border-white/5">
          <div className="sm:col-span-4 flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden border border-white/15 bg-[#0b1220] flex items-center justify-center">
              {config.logoImage.trim() ? (
                <img
                  src={config.logoImage}
                  alt="Logo thumbnail"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-opacity ${
                    config.showLogo ? 'opacity-100' : 'opacity-30'
                  }`}
                />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="text-xs">
              <div className="font-medium text-slate-200">Top Crest Logo</div>
              <div className="text-slate-500 mt-0.5">
                {config.showLogo ? 'Visible on agenda' : 'Hidden on agenda'}
              </div>
            </div>
          </div>

          <div className="sm:col-span-8 space-y-2.5">
            <label htmlFor="global-logo-url" className="block text-xs font-medium text-slate-300">
              Logo Path or URL
            </label>
            <input
              id="global-logo-url"
              type="text"
              value={config.logoImage.startsWith('data:') ? '' : config.logoImage}
              onChange={(e) => onChange((prev) => ({ ...prev, logoImage: e.target.value }))}
              placeholder={
                config.logoImage.startsWith('data:')
                  ? 'Custom uploaded logo (paste a URL/path to replace)'
                  : './images/logo.png or https://...'
              }
              className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, 'logoImage')}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, showLogo: !prev.showLogo }))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                {config.showLogo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{config.showLogo ? 'Hide Logo' : 'Show Logo'}</span>
              </button>
              <button
                type="button"
                onClick={() => restoreDefaultAsset('logoImage')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/25 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Default Logo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Theme Settings */}
      <section className="space-y-5">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Theme &amp; Typography</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fine-tune accent color, typeface, and frosted glass contrast for projector legibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Accent Color */}
          <div className="space-y-2">
            <label htmlFor="theme-accent" className="block text-xs font-medium text-slate-300">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              <input
                id="theme-accent"
                type="color"
                value={config.theme.accentColor}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, accentColor: e.target.value.toUpperCase() },
                  }))
                }
                className="h-9 w-11 rounded-md border border-white/15 bg-[#0b1220] p-1 cursor-pointer"
              />
              <input
                type="text"
                aria-label="Accent color hex code"
                value={config.theme.accentColor}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, accentColor: e.target.value },
                  }))
                }
                className="w-28 rounded-lg bg-[#0b1220] border border-white/12 px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.name}
                    aria-label={`Set accent color to ${preset.name}`}
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, accentColor: preset.hex },
                      }))
                    }
                    className={`h-6 w-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                      config.theme.accentColor.toUpperCase() === preset.hex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]'
                        : 'border border-white/20'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label htmlFor="theme-font" className="block text-xs font-medium text-slate-300">
              Presentation Font Family
            </label>
            <select
              id="theme-font"
              value={config.theme.fontFamily}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, fontFamily: e.target.value as FontChoice },
                }))
              }
              className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Backdrop Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="theme-card-opacity" className="font-medium text-slate-300">
                Glass Card Opacity
              </label>
              <span className="font-mono tabular-nums text-slate-400">
                {Math.round(config.theme.cardOpacity * 100)}%
              </span>
            </div>
            <input
              id="theme-card-opacity"
              type="range"
              min={25}
              max={88}
              value={Math.round(config.theme.cardOpacity * 100)}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, cardOpacity: Number(e.target.value) / 100 },
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Background Scrim Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="theme-scrim-opacity" className="font-medium text-slate-300">
                Background Scrim Darkness
              </label>
              <span className="font-mono tabular-nums text-slate-400">
                {Math.round(config.theme.bgOverlayOpacity * 100)}%
              </span>
            </div>
            <input
              id="theme-scrim-opacity"
              type="range"
              min={0}
              max={75}
              value={Math.round(config.theme.bgOverlayOpacity * 100)}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, bgOverlayOpacity: Number(e.target.value) / 100 },
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
