import { useEffect, useState } from 'react';
import { Film, Image as ImageIcon, ImageOff, Play } from 'lucide-react';
import type { MediaType } from '../types/presentation';

interface SlideMediaProps {
  mediaType: MediaType;
  mediaUrl: string;
  title: string;
  compact?: boolean;
  className?: string;
}

export function SlideMedia({
  mediaType,
  mediaUrl,
  title,
  compact = false,
  className = '',
}: SlideMediaProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [mediaUrl, mediaType]);

  if (mediaType === 'none') {
    return null;
  }

  const trimmedUrl = mediaUrl.trim();

  if (!trimmedUrl || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-900/80 border border-white/10 text-slate-400 select-none ${
          compact ? 'gap-1 p-2 text-[11px]' : 'gap-2.5 p-8 text-sm'
        } ${className}`}
      >
        {hasError ? (
          <ImageOff className={compact ? 'w-4 h-4 text-slate-500' : 'w-8 h-8 text-slate-500'} />
        ) : mediaType === 'video' ? (
          <Film className={compact ? 'w-4 h-4 text-slate-500' : 'w-8 h-8 text-slate-500'} />
        ) : (
          <ImageIcon className={compact ? 'w-4 h-4 text-slate-500' : 'w-8 h-8 text-slate-500'} />
        )}
        <span className="text-center font-medium leading-tight">
          {hasError
            ? compact
              ? 'Broken media'
              : 'Media could not be loaded. Check the file path or URL.'
            : compact
              ? 'No source'
              : `Add a ${mediaType.toUpperCase()} path or URL`}
        </span>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
        <video
          src={trimmedUrl}
          controls={!compact}
          muted={compact}
          playsInline
          preload="metadata"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
        {compact && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/35">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white border border-white/25">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      <img
        src={trimmedUrl}
        alt={title || 'Slide visual'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

interface FormattedDescriptionProps {
  text: string;
  accentColor: string;
  compact?: boolean;
}

type DescriptionBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'bullets'; items: string[] };

function parseDescriptionBlocks(text: string): DescriptionBlock[] {
  const rawLines = text.split('\n');
  const blocks: DescriptionBlock[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'bullets') {
        last.items.push(bulletMatch[1]);
      } else {
        blocks.push({ type: 'bullets', items: [bulletMatch[1]] });
      }
    } else {
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'paragraph') {
        last.lines.push(rawLine);
      } else {
        blocks.push({ type: 'paragraph', lines: [rawLine] });
      }
    }
  }

  return blocks;
}

export function FormattedDescription({
  text,
  accentColor,
  compact = false,
}: FormattedDescriptionProps) {
  const blocks = parseDescriptionBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'bullets') {
          return (
            <ul key={bIdx} className={compact ? 'space-y-1' : 'space-y-2.5'}>
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className={`flex items-start gap-2.5 text-white font-semibold ${
                    compact
                      ? 'text-[11px] leading-snug'
                      : 'text-[clamp(1rem,2.05vw,1.4rem)] leading-[1.6]'
                  }`}
                  style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)' }}
                >
                  <span
                    aria-hidden="true"
                    className={`shrink-0 rounded-full ${
                      compact ? 'w-1.5 h-1.5 mt-1.5' : 'w-2 h-2 mt-[0.58em]'
                    }`}
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={bIdx}
            className={`text-white font-bold whitespace-pre-line ${
              compact
                ? 'text-[11px] leading-relaxed'
                : 'text-[clamp(1.05rem,2.2vw,1.52rem)] leading-[1.65]'
            }`}
            style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)' }}
          >
            {block.lines.join('\n')}
          </p>
        );
      })}
    </div>
  );
}
