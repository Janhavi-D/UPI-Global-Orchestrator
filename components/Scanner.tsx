import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, Info, AlertCircle, RefreshCcw } from 'lucide-react';

interface ScannerProps {
  onScan: (file: File) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

const LOADING_STEPS = [
  "Optimizing payload...",
  "Routing node...",
  "Parsing metadata...",
  "Calculating FX...",
  "Finalizing..."
];

export const Scanner: React.FC<ScannerProps> = ({ onScan, onCancel, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let interval: any;
    let warningTimeout: any;

    if (isLoading) {
      setStepIndex(0);
      setShowWarning(false);
      interval = setInterval(() => {
        setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1200);

      warningTimeout = setTimeout(() => setShowWarning(true), 12000);
    }
    
    return () => {
      clearInterval(interval);
      clearTimeout(warningTimeout);
    };
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onScan(file);
      // Reset input so scanning the same file again triggers change
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-xl font-bold tracking-tight">Optical Scanner</h2>
        <button onClick={onCancel} className="p-2 glass rounded-full hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div 
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`w-full aspect-[3/4] glass rounded-[2rem] border-2 border-dashed cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-6 relative group overflow-hidden ${error ? 'border-red-500/50 bg-red-500/5' : 'border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/5'}`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-12 h-12 text-sky-400 animate-spin relative z-10" />
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-sky-400 animate-pulse">
                  Synthesizing
                </p>
                <p className="text-xs text-slate-500 mt-1 h-4 font-medium transition-all duration-300">
                  {LOADING_STEPS[stepIndex]}
                </p>
                {showWarning && (
                  <p className="text-[9px] text-violet-400 mt-4 animate-bounce">
                    Network latency detected. Holding connection...
                  </p>
                )}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 px-6 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400">Analysis Halted</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {error.includes("API_KEY") ? "Cloud configuration missing. Check environment variables." : error}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <RefreshCcw size={12} /> Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <Camera size={40} />
              </div>
              <div className="text-center px-8">
                <p className="text-sm text-slate-400 mb-2">Capture QR or Receipt</p>
                <p className="text-[10px] font-mono text-slate-600 uppercase">Universal Recognition Active</p>
              </div>
            </>
          )}
          
          {!isLoading && !error && <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full py-4 bg-white text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 shadow-xl"
        >
          <Camera size={20} />
          Initialize Camera
        </button>

        <div className="glass-dark rounded-xl p-4 flex gap-3 items-start">
          <Info size={16} className="text-sky-400 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-slate-400">
            Scanning node utilizes Gemini 3 Vision. Data is processed via transient edge tunnel. No receipt data is persisted on local storage.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};
