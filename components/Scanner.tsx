import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2, AlertCircle, RefreshCcw, Cpu, ScanLine, Activity } from 'lucide-react';

interface ScannerProps {
  onScan: (file: File) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

const LOADING_STEPS = [
  { icon: Cpu, text: "Warming AI Core..." },
  { icon: ScanLine, text: "Optimizing Pixels..." },
  { icon: Activity, text: "Routing via Singapore Node..." },
  { icon: Cpu, text: "Extracting ISO-20022 Tags..." },
  { icon: Activity, text: "Finalizing Cryptographic Proof..." }
];

export const Scanner: React.FC<ScannerProps> = ({ onScan, onCancel, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setStepIndex(0);
      interval = setInterval(() => {
        setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onScan(file);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-6 animate-in fade-in duration-500">
      {/* Decorative backdrop mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Visual Capture</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Universal OCR Node v4.1</p>
        </div>
        <button onClick={onCancel} className="p-3 glass rounded-2xl hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div 
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`w-full aspect-[4/5] glass rounded-[3rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-8 relative group overflow-hidden ${
            error ? 'border-red-500/50 bg-red-500/5' : 'border-sky-500/30 hover:border-sky-500/60'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-6 p-8 w-full">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-sky-400 animate-spin relative z-10" />
              </div>
              <div className="w-full space-y-4">
                {LOADING_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 transition-all duration-500 ${
                        idx === stepIndex ? 'opacity-100 scale-100 translate-x-0' : 'opacity-20 scale-95 -translate-x-2'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${idx === stepIndex ? 'bg-sky-500/20 text-sky-400' : 'text-slate-600'}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[11px] font-mono font-bold tracking-tight">
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-6 px-10 text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                <AlertCircle size={36} />
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">Capture Interrupted</p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {error}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="mt-4 px-8 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <RefreshCcw size={14} /> REINITIALIZE
              </button>
            </div>
          ) : (
            <>
              {/* Corner markings for viewfinder feel */}
              <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-sky-500/40 rounded-tl-xl"></div>
              <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-sky-500/40 rounded-tr-xl"></div>
              <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-sky-500/40 rounded-bl-xl"></div>
              <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-sky-500/40 rounded-br-xl"></div>
              
              <div className="w-24 h-24 rounded-full bg-sky-500/5 flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:scale-110 transition-transform duration-500 group-hover:bg-sky-500/10 shadow-2xl">
                <Camera size={44} strokeWidth={1.5} />
              </div>
              <div className="text-center px-10">
                <p className="text-lg font-bold text-white mb-2">Initialize Scanner</p>
                <p className="text-xs text-slate-500 font-medium">Capture a receipt or payment QR code for automated orchestration.</p>
              </div>
              
              {/* Laser line animation */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent shadow-[0_0_20px_rgba(56,189,248,0.8)] animate-[scan_3s_ease-in-out_infinite] opacity-40"></div>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-5 relative z-10">
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
          className="btn-premium w-full py-5 bg-white text-slate-950 font-black rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-sky-500/10 disabled:opacity-50"
        >
          <Camera size={22} />
          OPEN CAMERA
        </button>

        <div className="glass-dark rounded-2xl p-5 border border-white/5 flex gap-4 items-start">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <ScanLine size={16} />
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400 font-medium italic">
            "Proprietary OCR engine active. Real-time FX conversion and NIPL route detection enabled by default."
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
