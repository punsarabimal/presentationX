import type { ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  List,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SlideMedia } from './SlideContent';
import type { MediaType, PresentationSlide } from '../types/presentation';

interface SlideEditorPanelProps {
  slide: PresentationSlide;
  index: number;
  totalSlides: number;
  onUpdate: (patch: Partial<PresentationSlide>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onNotify: (message: string, type?: 'info' | 'warning') => void;
}

const MEDIA_OPTIONS: { value: MediaType; label: string; accept?: string; placeholder?: string }[] = [
  { value: 'none', label: 'None' },
  {
    value: 'image',
    label: 'Image',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
    placeholder: './media/photo.jpg or https://...',
  },
  {
    value: 'gif',
    label: 'GIF',
    accept: 'image/gif',
    placeholder: './media/animation.gif or https://...',
  },
  {
    value: 'video',
    label: 'Video',
    accept: 'video/mp4,video/webm,video/ogg',
    placeholder: './media/clip.mp4 or https://...',
  },
];

export function SlideEditorPanel({
  slide,
  index,
  totalSlides,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onNotify,
}: SlideEditorPanelProps) {
  const activeMediaOption =
    MEDIA_OPTIONS.find((opt) => opt.value === slide.mediaType) ?? MEDIA_OPTIONS[0];

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      onNotify(
        'This file is larger than 2.5 MB and may exceed browser localStorage limits when saving live. For large videos or media, copy the file into your presentation folder and enter its relative path (e.g. ./media/video.mp4).',
        'warning'
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdate({ mediaUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const appendBulletPoint = () => {
    const current = slide.description;
    const prefix = current.length === 0 || current.endsWith('\n') ? '- ' : '\n- ';
    onUpdate({ description: `${current}${prefix}` });
  };

  return (
    <div className="space-y-6">
      {/* Slide Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-cyan-300 font-medium">
              Slide {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">of {totalSlides}</span>
          </div>
          <h2 className="text-base font-semibold text-white mt-0.5 truncate max-w-md">
            {slide.menuTitle || 'Untitled Agenda Item'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title="Move slide up"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Up</span>
          </button>
          <button
            type="button"
            disabled={index === totalSlides - 1}
            onClick={onMoveDown}
            title="Move slide down"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Down</span>
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate slide"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            disabled={totalSlides <= 1}
            onClick={onDelete}
            title="Delete slide"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-300 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Text Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="slide-menu-title" className="block text-xs font-medium text-slate-300">
            Agenda Menu Title
          </label>
          <input
            id="slide-menu-title"
            type="text"
            value={slide.menuTitle}
            onChange={(e) => onUpdate({ menuTitle: e.target.value })}
            placeholder="Label shown on the main agenda list"
            className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="slide-heading" className="block text-xs font-medium text-slate-300">
            Slide Heading
          </label>
          <input
            id="slide-heading"
            type="text"
            value={slide.slideTitle}
            onChange={(e) => onUpdate({ slideTitle: e.target.value })}
            placeholder="Large title displayed inside the slide"
            className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Description / Bullet Points */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="slide-description" className="block text-xs font-medium text-slate-300">
            Description &amp; Bullet Points
          </label>
          <button
            type="button"
            onClick={appendBulletPoint}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span>Insert Bullet Line</span>
          </button>
        </div>
        <textarea
          id="slide-description"
          rows={5}
          value={slide.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Enter speaker details, description lines, or start lines with '- ' for formatted bullet points..."
          className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors leading-relaxed resize-y"
        />
        <p className="text-[11px] text-slate-500">
          Lines starting with <code className="font-mono text-slate-300">- </code> automatically
          render as clean accented bullet points on the presentation slide.
        </p>
      </div>

      {/* Media Configuration */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Slide Media</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Attach an image, animated GIF, or video clip alongside this slide.
            </p>
          </div>

          {/* Interactive Segmented Control for Media Type */}
          <div
            role="radiogroup"
            aria-label="Slide media type"
            className="inline-flex items-center gap-1 rounded-lg bg-[#0b1220] border border-white/10 p-1"
          >
            {MEDIA_OPTIONS.map((option) => {
              const isSelected = slide.mediaType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onUpdate({ mediaType: option.value })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {slide.mediaType !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7 space-y-2.5">
              <label htmlFor="slide-media-url" className="block text-xs font-medium text-slate-300">
                {activeMediaOption.label} File Path or URL
              </label>
              <div className="relative">
                <input
                  id="slide-media-url"
                  type="text"
                  value={slide.mediaUrl.startsWith('data:') ? '' : slide.mediaUrl}
                  onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
                  placeholder={
                    slide.mediaUrl.startsWith('data:')
                      ? 'Embedded uploaded file (enter path/URL to replace)'
                      : activeMediaOption.placeholder
                  }
                  className="w-full rounded-lg bg-[#0b1220] border border-white/12 px-3.5 py-2 pr-8 text-xs font-mono text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                />
                {slide.mediaUrl && (
                  <button
                    type="button"
                    aria-label="Clear media source"
                    onClick={() => onUpdate({ mediaUrl: '' })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload {activeMediaOption.label}</span>
                  <input
                    type="file"
                    accept={activeMediaOption.accept}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {slide.mediaUrl.startsWith('data:') && (
                  <span className="text-xs text-slate-400">Embedded local file ready</span>
                )}
              </div>
            </div>

            {/* Live Media Preview Thumbnail */}
            <div className="md:col-span-5 space-y-1.5">
              <span className="block text-xs font-medium text-slate-400">
                Media Preview Thumbnail
              </span>
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/15 bg-[#0b1220]">
                <SlideMedia
                  mediaType={slide.mediaType}
                  mediaUrl={slide.mediaUrl}
                  title={slide.slideTitle}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
