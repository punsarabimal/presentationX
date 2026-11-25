import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  ExternalLink,
  FilePlus2,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { GlobalSettingsPanel } from './components/GlobalSettingsPanel';
import { SlideMedia } from './components/SlideContent';
import { SlideEditorPanel } from './components/SlideEditorPanel';
import { StagePreview } from './components/StagePreview';
import type { PresentationConfig, PresentationSlide } from './types/presentation';
import {
  downloadDataJs,
  getBlankPresentationData,
  loadPresentationData,
  resetPresentationData,
  savePresentationData,
} from './utils/storage';

type EditorTab = 'global' | 'slides';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'warning' | 'error';
}

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

export default function EditorApp() {
  const initialLoaded = useMemo(() => loadPresentationData(), []);
  const [config, setConfig] = useState<PresentationConfig>(initialLoaded.config);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLocalOverrides, setHasLocalOverrides] = useState(initialLoaded.hasLocalOverrides);
  const [activeTab, setActiveTab] = useState<EditorTab>('slides');
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    initialLoaded.config.slides[0]?.id ?? ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);

  const showToast = useCallback(
    (text: string, tone: 'success' | 'warning' | 'error' = 'success') => {
      setToast({ id: Date.now(), text, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateConfig = useCallback(
    (updater: (prev: PresentationConfig) => PresentationConfig) => {
      setConfig((prev) => updater(prev));
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSaveLive = useCallback(() => {
    const result = savePresentationData(config);
    if (result.ok) {
      setHasUnsavedChanges(false);
      setHasLocalOverrides(true);
      showToast('Saved live. Any open index.html presentation tab updates automatically.', 'success');
    } else {
      showToast(result.error ?? 'Failed to save changes.', 'error');
    }
  }, [config, showToast]);

  // Keyboard shortcut: Ctrl/Cmd + S saves live immediately
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSaveLive();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveLive]);

  const handleDownloadDataJs = () => {
    downloadDataJs(config);
    showToast('Downloaded data.js. Replace your existing data.js file for offline portability.', 'success');
  };

  const requestResetToDefault = () => {
    setConfirmDialog({
      title: 'Reset to Default data.js?',
      description:
        'This clears all saved changes from browser localStorage and restores the original configuration loaded from data.js. Open presentation tabs will revert immediately.',
      confirmLabel: 'Reset to Default',
      danger: true,
      onConfirm: () => {
        const restored = resetPresentationData();
        setConfig(restored);
        setSelectedSlideId(restored.slides[0]?.id ?? '');
        setHasUnsavedChanges(false);
        setHasLocalOverrides(false);
        setConfirmDialog(null);
        showToast('Cleared localStorage and restored original data.js defaults.', 'success');
      },
    });
  };

  const requestNewBlank = () => {
    setConfirmDialog({
      title: 'Start a New Blank Presentation?',
      description:
        'Replaces the current draft in the editor with a clean 1-slide template. Click "Save Live" afterward when you are ready to publish it.',
      confirmLabel: 'Create Blank Draft',
      danger: false,
      onConfirm: () => {
        const blank = getBlankPresentationData();
        setConfig(blank);
        setSelectedSlideId(blank.slides[0]?.id ?? '');
        setActiveTab('global');
        setHasUnsavedChanges(true);
        setConfirmDialog(null);
        showToast('Loaded clean blank template. Click Save Live to apply.', 'success');
      },
    });
  };

  const selectedSlideIndex = useMemo(() => {
    const idx = config.slides.findIndex((s) => s.id === selectedSlideId);
    return idx >= 0 ? idx : 0;
  }, [config.slides, selectedSlideId]);

  const selectedSlide = config.slides[selectedSlideIndex] ?? null;

  const filteredSlides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return config.slides.map((slide, index) => ({ slide, index }));
    }
    return config.slides
      .map((slide, index) => ({ slide, index }))
      .filter(
        ({ slide }) =>
          slide.menuTitle.toLowerCase().includes(q) ||
          slide.slideTitle.toLowerCase().includes(q) ||
          slide.description.toLowerCase().includes(q)
      );
  }, [config.slides, searchQuery]);

  const handleAddSlide = () => {
    const nextNum = config.slides.length + 1;
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      menuTitle: `Agenda Item ${nextNum}`,
      slideTitle: `Agenda Item ${nextNum}`,
      description: 'Enter slide details here...',
      mediaType: 'none',
      mediaUrl: '',
    };
    updateConfig((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setSelectedSlideId(newSlide.id);
    setActiveTab('slides');
    setSearchQuery('');
  };

  const handleUpdateSlide = (slideId: string, patch: Partial<PresentationSlide>) => {
    updateConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === slideId ? { ...slide, ...patch } : slide)),
    }));
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= config.slides.length) return;
    updateConfig((prev) => {
      const next = [...prev.slides];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, slides: next };
    });
  };

  const handleDuplicateSlide = (index: number) => {
    const source = config.slides[index];
    if (!source) return;
    const clone: PresentationSlide = {
      ...source,
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      menuTitle: `${source.menuTitle} (Copy)`,
    };
    updateConfig((prev) => {
      const next = [...prev.slides];
      next.splice(index + 1, 0, clone);
      return { ...prev, slides: next };
    });
    setSelectedSlideId(clone.id);
    setActiveTab('slides');
  };

  const handleDeleteSlide = (index: number) => {
    if (config.slides.length <= 1) return;
    const removed = config.slides[index];
    const nextSlides = config.slides.filter((_, idx) => idx !== index);
    updateConfig((prev) => ({
      ...prev,
      slides: nextSlides,
    }));
    if (removed && removed.id === selectedSlideId) {
      const fallbackSlide = nextSlides[Math.min(index, nextSlides.length - 1)];
      setSelectedSlideId(fallbackSlide?.id ?? '');
    }
  };

  const mediaTypeLabel = (type: PresentationSlide['mediaType']) => {
    switch (type) {
      case 'image':
        return 'Image';
      case 'gif':
        return 'GIF';
      case 'video':
        return 'Video';
      default:
        return 'Text';
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-[#080d17] text-slate-100"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Sinhala', sans-serif" }}
    >
      {/* Top Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 h-15 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          Presentation Studio
        </span>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Editor sections" className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'slides'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            Slides Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'global'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            Global Settings
          </button>
          <a
            href="./index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-1 text-slate-400 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Presentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadDataJs}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-100 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download data.js</span>
          </button>
          <button
            type="button"
            onClick={handleSaveLive}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00E5FF] hover:bg-[#38BDF8] px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? 'Save Live *' : 'Save Live'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-[#0b1220]">
        <div className="inline-flex items-center gap-1 rounded-lg bg-[#080d17] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
              activeTab === 'slides' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Slides ({config.slides.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
              activeTab === 'global' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Global Settings
          </button>
        </div>
        <a
          href="./index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 whitespace-nowrap"
        >
          <span>View Deck</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Sidebar: Deck Outline & Slide Ordering */}
        <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0b1220] flex flex-col lg:max-h-[calc(100dvh-60px)] lg:sticky lg:top-15">
          {/* Global Details Quick Entry */}
          <div className="p-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                activeTab === 'global'
                  ? 'bg-cyan-400/12 border border-cyan-400/40 text-white'
                  : 'border border-transparent hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span className="truncate">Global Details &amp; Theme</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                  {config.mainTitle.replace(/\n/g, ' ')} · {config.eventDate}
                </div>
              </div>
            </button>
          </div>

          {/* Slides List Header & Search */}
          <div className="px-3 pt-3 pb-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Agenda Slides</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="font-mono tabular-nums text-slate-400">
                  {config.slides.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSlide}
                className="inline-flex items-center gap-1 rounded-md bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/35 px-2.5 py-1 text-xs font-semibold text-cyan-300 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter slides..."
                className="w-full rounded-lg bg-[#080d17] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Ordered Slide Rows */}
          <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1 max-h-[300px] lg:max-h-none">
            {filteredSlides.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No slides match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredSlides.map(({ slide, index }) => {
                const isSelected = activeTab === 'slides' && slide.id === selectedSlide?.id;
                const hasMedia = slide.mediaType !== 'none';

                return (
                  <div
                    key={slide.id}
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      setActiveTab('slides');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSlideId(slide.id);
                        setActiveTab('slides');
                      }
                    }}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800/85 border-cyan-400/45 text-white'
                        : 'bg-transparent border-transparent hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="font-mono text-[11px] tabular-nums text-slate-500 w-5 shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Live Compact Media Thumbnail when slide has media */}
                    {hasMedia && (
                      <div className="w-10 h-7 shrink-0 rounded overflow-hidden border border-white/15 bg-[#080d17]">
                        <SlideMedia
                          mediaType={slide.mediaType}
                          mediaUrl={slide.mediaUrl}
                          title={slide.slideTitle}
                          compact
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {slide.menuTitle || 'Untitled Slide'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {mediaTypeLabel(slide.mediaType)}
                      </div>
                    </div>

                    {/* Inline Reorder & Delete Controls */}
                    <div
                      className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Move slide ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => handleMoveSlide(index, -1)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move slide ${index + 1} down`}
                        disabled={index === config.slides.length - 1}
                        onClick={() => handleMoveSlide(index, 1)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete slide ${index + 1}`}
                        disabled={config.slides.length <= 1}
                        onClick={() => handleDeleteSlide(index)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer: Blank & Reset Actions */}
          <div className="p-3 border-t border-white/10 space-y-2 bg-[#090f1c]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
              <span>Data source</span>
              <span className="font-medium text-slate-300">
                {hasLocalOverrides ? 'Live localStorage' : 'Default data.js'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={requestNewBlank}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 px-2.5 py-2 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>New Blank</span>
              </button>
              <button
                type="button"
                onClick={requestResetToDefault}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-2 text-xs font-medium text-red-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 min-w-0 p-5 lg:p-7 xl:p-8">
          <div className="max-w-[1260px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Editor Form Panel */}
            <div className="xl:col-span-7 rounded-xl border border-white/10 bg-[#0f172a] p-5 sm:p-6">
              {activeTab === 'global' ? (
                <GlobalSettingsPanel
                  config={config}
                  onChange={updateConfig}
                  onNotify={(msg, type) => showToast(msg, type === 'warning' ? 'warning' : 'success')}
                />
              ) : selectedSlide ? (
                <SlideEditorPanel
                  slide={selectedSlide}
                  index={selectedSlideIndex}
                  totalSlides={config.slides.length}
                  onUpdate={(patch) => handleUpdateSlide(selectedSlide.id, patch)}
                  onMoveUp={() => handleMoveSlide(selectedSlideIndex, -1)}
                  onMoveDown={() => handleMoveSlide(selectedSlideIndex, 1)}
                  onDuplicate={() => handleDuplicateSlide(selectedSlideIndex)}
                  onDelete={() => handleDeleteSlide(selectedSlideIndex)}
                  onNotify={(msg, type) => showToast(msg, type === 'warning' ? 'warning' : 'success')}
                />
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-slate-400">No slides in this presentation yet.</p>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Slide</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sticky Live Preview & Sync Guidance */}
            <div className="xl:col-span-5 xl:sticky xl:top-20 space-y-5">
              <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5 space-y-4">
                <StagePreview
                  config={config}
                  mode={activeTab === 'global' ? 'agenda' : 'slide'}
                  slide={selectedSlide}
                />

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    {hasUnsavedChanges
                      ? 'Unsaved edits in draft'
                      : 'Draft matches saved presentation'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'global' ? 'slides' : 'global')}
                    className="text-cyan-300 hover:text-cyan-200 font-medium cursor-pointer whitespace-nowrap"
                  >
                    {activeTab === 'global' ? 'Edit Slides' : 'Edit Global Theme'}
                  </button>
                </div>
              </div>

              {/* Quick Offline Portability Note */}
              <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4 space-y-1.5 text-xs text-slate-400 leading-relaxed">
                <div className="font-semibold text-slate-200">Live Sync &amp; Offline Export</div>
                <p>
                  Click <strong className="text-white">Save Live</strong> (or press{' '}
                  <kbd className="font-mono text-slate-200">Ctrl+S</kbd>) to sync changes immediately
                  to any open <code className="font-mono text-slate-300">index.html</code> tab via{' '}
                  <code className="font-mono text-slate-300">localStorage</code>.
                </p>
                <p>
                  Click <strong className="text-white">Download data.js</strong> when finished and
                  replace your original <code className="font-mono text-slate-300">data.js</code>{' '}
                  file to carry your presentation permanently offline.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* In-App Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 max-w-md rounded-xl border px-4 py-3 shadow-2xl flex items-start gap-3 text-xs font-medium backdrop-blur-md ${
            toast.tone === 'error'
              ? 'bg-red-950/95 border-red-500/45 text-red-100'
              : toast.tone === 'warning'
                ? 'bg-amber-950/95 border-amber-500/45 text-amber-100'
                : 'bg-slate-900/95 border-cyan-400/40 text-slate-100'
          }`}
        >
          {toast.tone === 'success' ? (
            <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                toast.tone === 'error' ? 'text-red-400' : 'text-amber-400'
              }`}
            />
          )}
          <span className="leading-relaxed flex-1">{toast.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* In-App Confirmation Modal (Replaces window.confirm) */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-white">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`rounded-lg px-4 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  confirmDialog.danger
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
