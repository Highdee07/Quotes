
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Upload, RefreshCw, X, Palette, MoveHorizontal, MoveVertical, Layers, Smartphone } from 'lucide-react';
import { parseQuotes } from './utils/parser';
import { rawDefaultQuotes } from './data/defaultQuotes';
import { Quote, AppSettings, DEFAULT_SETTINGS, ThemeOption, FontSizeOption } from './types';

// --- Theme Definitions ---
interface ThemeDef {
  label: string;
  bg: string; // Page background
  container: string; // Widget container style
  text: string;
  secondaryText: string;
  buttonBg: string;
  isDark: boolean;
  swatch: string;
}

const THEMES: Record<ThemeOption | 'auto', ThemeDef | null> = {
  auto: null,
  light: { 
    label: 'Light', 
    bg: 'bg-stone-50',
    container: 'bg-white border-stone-200 shadow-xl', 
    text: 'text-stone-900', 
    secondaryText: 'text-stone-500',
    buttonBg: 'bg-stone-200 hover:bg-stone-300',
    isDark: false,
    swatch: 'bg-stone-50 border-stone-300'
  },
  dark: { 
    label: 'Dark', 
    bg: 'bg-stone-950', 
    container: 'bg-stone-900 border-stone-800 shadow-2xl shadow-black/50',
    text: 'text-stone-100', 
    secondaryText: 'text-stone-500',
    buttonBg: 'bg-stone-800 hover:bg-stone-700',
    isDark: true,
    swatch: 'bg-stone-900 border-stone-700'
  },
  glass: { 
    label: 'Glass', 
    bg: 'bg-stone-900', // Default bg if transparency is off
    container: 'bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl shadow-black/20',
    text: 'text-white drop-shadow-sm', 
    secondaryText: 'text-white/60',
    buttonBg: 'bg-white/10 hover:bg-white/20 backdrop-blur-md',
    isDark: true,
    swatch: 'bg-gradient-to-br from-white/20 to-black/20 border-white/30'
  },
  sepia: { 
    label: 'Sepia', 
    bg: 'bg-[#f4ecd8]', 
    container: 'bg-[#fbf6e9] border-[#e6dbb9] shadow-xl',
    text: 'text-[#433422]', 
    secondaryText: 'text-[#8a7658]',
    buttonBg: 'bg-[#e6dbb9] hover:bg-[#d6cba9]',
    isDark: false,
    swatch: 'bg-[#f4ecd8] border-[#d6cba9]'
  },
  ocean: { 
    label: 'Ocean', 
    bg: 'bg-slate-900', 
    container: 'bg-slate-800 border-slate-700 shadow-xl shadow-cyan-900/20',
    text: 'text-cyan-50', 
    secondaryText: 'text-cyan-500',
    buttonBg: 'bg-slate-700 hover:bg-slate-600',
    isDark: true,
    swatch: 'bg-slate-900 border-cyan-900'
  },
  forest: { 
    label: 'Forest', 
    bg: 'bg-[#0a1f12]', 
    container: 'bg-[#11291b] border-[#1f4a30] shadow-xl shadow-emerald-900/20',
    text: 'text-[#e0f2e9]', 
    secondaryText: 'text-[#4d8063]',
    buttonBg: 'bg-[#1f4a30] hover:bg-[#2a5c3e]',
    isDark: true,
    swatch: 'bg-[#0a1f12] border-emerald-900'
  },
  rose: { 
    label: 'Rose', 
    bg: 'bg-[#2a0a12]', 
    container: 'bg-[#3d0f1b] border-[#591c2b] shadow-xl shadow-rose-900/20',
    text: 'text-[#fce7f3]', 
    secondaryText: 'text-[#9e4c66]',
    buttonBg: 'bg-[#591c2b] hover:bg-[#702436]',
    isDark: true,
    swatch: 'bg-[#2a0a12] border-rose-900'
  }
};

// --- Custom Hook: Long Press ---
const useLongPress = (callback: () => void, ms = 800) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

// --- Sub-components ---

// 1. Settings Modal
const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdate, 
  onFileUpload,
  resetSource
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: AppSettings; 
  onUpdate: (s: Partial<AppSettings>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetSource: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-700 flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center bg-stone-50 dark:bg-stone-900 shrink-0">
          <h2 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <Settings size={18} /> Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors">
            <X size={20} className="text-stone-600 dark:text-stone-300" />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar flex-1">
          
          {/* Theme */}
          <section>
            <h3 className="text-xs font-sans font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Palette size={14} /> Style
            </h3>
            
            {/* Widget Mode Toggle */}
             <div className="mb-4 flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200 flex items-center gap-2">
                  <Smartphone size={16} /> Widget Mode
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  Hides UI buttons. Long press screen to open settings.
                </span>
              </div>
              <button 
                  onClick={() => onUpdate({ isWidgetMode: !settings.isWidgetMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isWidgetMode ? 'bg-indigo-500' : 'bg-stone-300 dark:bg-stone-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isWidgetMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {/* Transparent Toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-900/50 rounded-xl">
              <span className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Layers size={16} /> Transparent Background
              </span>
              <button 
                  onClick={() => onUpdate({ transparentBackground: !settings.transparentBackground })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.transparentBackground ? 'bg-blue-500' : 'bg-stone-300 dark:bg-stone-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.transparentBackground ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(THEMES) as ThemeOption[]).map((t) => {
                const isActive = settings.theme === t;
                const def = THEMES[t];
                
                if (t === 'auto') {
                   return (
                    <button
                      key={t}
                      onClick={() => onUpdate({ theme: t })}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-transparent hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full border border-stone-300 bg-gradient-to-br from-white to-black mb-2 shadow-sm" />
                      <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400">Auto</span>
                    </button>
                   )
                }
                
                return (
                  <button
                    key={t}
                    onClick={() => onUpdate({ theme: t })}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-stone-100 dark:bg-stone-700/50' 
                        : 'border-transparent hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border mb-2 shadow-sm ${def?.swatch}`} />
                    <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400 capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sizing & Layout */}
          <section>
            <h3 className="text-xs font-sans font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MoveHorizontal size={14} /> Dimensions
            </h3>
            
            {/* Font Size */}
            <div className="mb-6">
              <label className="text-sm text-stone-600 dark:text-stone-400 mb-2 block">Font Size</label>
              <div className="grid grid-cols-4 gap-2">
                {(['sm', 'md', 'lg', 'xl'] as FontSizeOption[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdate({ fontSize: s })}
                    className={`py-2 px-1 rounded-lg border text-center transition-all ${
                      settings.fontSize === s
                        ? 'bg-stone-800 text-white border-stone-800 dark:bg-white dark:text-stone-900'
                        : 'border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    <span className={`font-serif leading-none ${
                      s === 'sm' ? 'text-sm' : s === 'md' ? 'text-base' : s === 'lg' ? 'text-lg' : 'text-xl'
                    }`}>Aa</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Container Width Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                  <MoveHorizontal size={14} /> Widget Width
                </label>
                <span className="text-xs text-stone-400 font-mono">{settings.containerWidth}%</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                step="5"
                value={settings.containerWidth}
                onChange={(e) => onUpdate({ containerWidth: Number(e.target.value) })}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-white"
              />
            </div>

            {/* Container Height Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                  <MoveVertical size={14} /> Widget Height
                </label>
                <span className="text-xs text-stone-400 font-mono">{settings.containerHeight}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                value={settings.containerHeight}
                onChange={(e) => onUpdate({ containerHeight: Number(e.target.value) })}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-white"
              />
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h3 className="text-xs font-sans font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw size={14} /> Behavior
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm text-stone-600 dark:text-stone-400">Auto-Refresh Interval</label>
                 <select 
                  value={settings.interval} 
                  onChange={(e) => onUpdate({ interval: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm outline-none focus:border-stone-400"
                >
                  <option value={30000}>30 Seconds</option>
                  <option value={60000}>1 Minute</option>
                  <option value={300000}>5 Minutes</option>
                  <option value={600000}>10 Minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-stone-600 dark:text-stone-400">Show Author Name</span>
                <button 
                  onClick={() => onUpdate({ showAuthor: !settings.showAuthor })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showAuthor ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showAuthor ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Data Source */}
          <section className="pt-4 border-t border-stone-200 dark:border-stone-700">
             <div className="flex flex-col gap-3">
               <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200">
                 <Upload size={16} />
                 <span className="text-sm font-medium">Upload custom .txt file</span>
                 <input type="file" accept=".txt" onChange={onFileUpload} className="hidden" />
               </label>
               
               {settings.isCustomSource && (
                 <button 
                  onClick={resetSource}
                  className="text-xs text-red-500 hover:text-red-600 underline text-center"
                 >
                   Reset to default library
                 </button>
               )}
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

// 2. Main App Component
const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('stoic-settings');
      const parsed = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Custom long press hook to open settings when UI is hidden
  const longPressProps = useLongPress(() => {
    setIsSettingsOpen(true);
  }, 1000); // 1 second hold

  // Resolve current active theme styles
  const activeThemeDef = (() => {
    if (settings.theme === 'auto') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isSystemDark ? THEMES.dark : THEMES.light;
    }
    return THEMES[settings.theme];
  })();

  const themeStyles = activeThemeDef || THEMES.glass;

  // --- Effects ---

  // 1. Initialize Theme Classes
  useEffect(() => {
    const root = window.document.documentElement;
    // Determine if we should be in 'dark mode' for UI components like the modal
    const shouldBeDarkMode = (() => {
      if (settings.theme === 'auto') return window.matchMedia('(prefers-color-scheme: dark)').matches;
      return THEMES[settings.theme]?.isDark ?? false;
    })();

    if (shouldBeDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // 2. Load Quotes (Default or Custom)
  useEffect(() => {
    const loadQuotes = () => {
      const storedCustom = localStorage.getItem('custom-quotes-text');
      const textToParse = (settings.isCustomSource && storedCustom) ? storedCustom : rawDefaultQuotes;
      
      const parsed = parseQuotes(textToParse);
      setQuotes(parsed);
      
      if (parsed.length > 0 && !currentQuote) {
        const random = parsed[Math.floor(Math.random() * parsed.length)];
        setCurrentQuote(random);
      }
      setLoading(false);
    };
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.isCustomSource]);

  // 3. Persist Settings
  useEffect(() => {
    localStorage.setItem('stoic-settings', JSON.stringify(settings));
  }, [settings]);

  // 4. Timer & Rotation Logic
  const changeQuote = useCallback(() => {
    if (quotes.length === 0) return;

    setIsTransitioning(true);
    
    // Wait for fade out
    setTimeout(() => {
      let nextQuote;
      // Ensure we don't repeat immediately if possible
      do {
        nextQuote = quotes[Math.floor(Math.random() * quotes.length)];
      } while (quotes.length > 1 && nextQuote.id === currentQuote?.id);
      
      setCurrentQuote(nextQuote);
      
      // Wait a tiny bit then fade in
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 400); // Quick fade out for snappy widget feel
  }, [quotes, currentQuote]);

  useEffect(() => {
    if (loading || quotes.length === 0) return;

    const intervalId = setInterval(changeQuote, settings.interval);
    return () => clearInterval(intervalId);
  }, [settings.interval, changeQuote, loading, quotes.length]);


  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        localStorage.setItem('custom-quotes-text', text);
        setSettings(prev => ({ ...prev, isCustomSource: true }));
      }
    };
    reader.readAsText(file);
    setIsSettingsOpen(false);
  };

  const handleResetSource = () => {
    localStorage.removeItem('custom-quotes-text');
    setSettings(prev => ({ ...prev, isCustomSource: false }));
  };

  // --- Render Helpers ---

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'sm': return 'text-lg leading-relaxed';
      case 'lg': return 'text-3xl leading-tight';
      case 'xl': return 'text-4xl leading-tight';
      case 'md':
      default: return 'text-2xl leading-relaxed';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${settings.transparentBackground ? 'bg-transparent' : themeStyles?.bg} ${themeStyles?.text}`}>
      </div>
    );
  }

  return (
    <div 
      className={`relative min-h-screen w-full transition-colors duration-700 overflow-hidden flex flex-col items-center justify-center`}
      style={{
        backgroundColor: settings.transparentBackground ? 'transparent' : undefined
      }}
      {...longPressProps} // Bind long press to the whole background container
    >
      {/* If not transparent, use theme bg */}
      {!settings.transparentBackground && (
        <div className={`absolute inset-0 z-[-1] transition-colors duration-700 ${themeStyles?.bg}`} />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        onFileUpload={handleFileUpload}
        resetSource={handleResetSource}
      />

      {/* Floating Settings Button (Only visible if NOT in widget mode) */}
      {!settings.isWidgetMode && (
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={`fixed bottom-6 right-6 p-3 rounded-full z-40 transition-all duration-300 opacity-30 hover:opacity-100 ${themeStyles?.buttonBg} ${themeStyles?.text} shadow-lg backdrop-blur-md`}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-4 relative">
        
        {/* Quote Widget Card */}
        <div 
           onClick={changeQuote}
           className={`
             transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center relative
             rounded-[2rem] border-2 border-opacity-20 cursor-pointer active:scale-95 select-none
             ${themeStyles?.container}
             ${themeStyles?.text}
           `}
           style={{ 
             width: `${settings.containerWidth}%`, 
             height: `${settings.containerHeight}%`,
             maxWidth: '1200px'
           }}
        >
          {/* Inner Wrapper for scrolling */}
          <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center py-6 px-4">
            {currentQuote && (
              <div 
                className={`
                  transform transition-all duration-500 ease-out
                  ${isTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}
                  max-w-full
                `}
              >
                <p className={`font-serif font-medium ${getFontSizeClass()} mb-6`}>
                  {currentQuote.text}
                </p>

                {settings.showAuthor && currentQuote.author && (
                  <div className={`flex items-center justify-center gap-3 animate-fade-in mt-auto`}>
                    <span className={`h-px w-6 ${themeStyles?.secondaryText} opacity-40 bg-current`}></span>
                    <p className={`font-sans text-xs md:text-sm tracking-widest uppercase font-bold ${themeStyles?.secondaryText}`}>
                      {currentQuote.author}
                    </p>
                    <span className={`h-px w-6 ${themeStyles?.secondaryText} opacity-40 bg-current`}></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
