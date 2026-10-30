import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Eye, 
  Layers, 
  Compass, 
  Gauge, 
  FolderHeart,
  RotateCcw
} from 'lucide-react';

interface DynoControlBarProps {
  isRunning: boolean;
  onToggleRun: () => void;
  throttle: number;
  onThrottleChange: (val: number) => void;
  onDynoSweep: () => void;
  isDynoSweeping: boolean;
  isXRay: boolean;
  onToggleXRay: () => void;
  explodedProgress: number;
  onExplodedChange: (val: number) => void;
  onSelectCamera: (cam: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGarage: () => void;
}

export const DynoControlBar: React.FC<DynoControlBarProps> = ({
  isRunning,
  onToggleRun,
  throttle,
  onThrottleChange,
  onDynoSweep,
  isDynoSweeping,
  isXRay,
  onToggleXRay,
  explodedProgress,
  onExplodedChange,
  onSelectCamera,
  isMuted,
  onToggleMute,
  onOpenGarage,
}) => {
  const [isPressingGas, setIsPressingGas] = useState(false);
  const gasIntervalRef = useRef<number | null>(null);

  // Gas pedal press and hold mechanic
  useEffect(() => {
    if (isPressingGas && isRunning) {
      gasIntervalRef.current = window.setInterval(() => {
        onThrottleChange(Math.min(1.0, throttle + 0.08));
      }, 30);
    } else {
      if (gasIntervalRef.current) {
        clearInterval(gasIntervalRef.current);
        gasIntervalRef.current = null;
      }
      if (!isDynoSweeping) {
        // Smooth return to idle
        if (throttle > 0) {
          const decay = setInterval(() => {
            onThrottleChange(Math.max(0, throttle - 0.1));
          }, 35);
          setTimeout(() => clearInterval(decay), 300);
        }
      }
    }

    return () => {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    };
  }, [isPressingGas, isRunning, isDynoSweeping, throttle, onThrottleChange]);

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] w-[860px]">
      <div className="bg-[#11141a]/95 border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Ignition & Throttle Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Start / Stop Ignition Button */}
          <button
            onClick={onToggleRun}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40 ring-1 ring-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40 ring-1 ring-emerald-400'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>MOTORU DURDUR</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>MARŞA BAS (START)</span>
              </>
            )}
          </button>

          {/* Interactive Gas Pedal */}
          <button
            disabled={!isRunning || isDynoSweeping}
            onMouseDown={() => setIsPressingGas(true)}
            onMouseUp={() => setIsPressingGas(false)}
            onTouchStart={() => setIsPressingGas(true)}
            onTouchEnd={() => setIsPressingGas(false)}
            className={`px-3.5 py-2 rounded-lg font-bold tracking-wide transition-all select-none ${
              !isRunning || isDynoSweeping
                ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                : isPressingGas
                ? 'bg-amber-500 text-black scale-95 shadow-inner'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md font-semibold'
            }`}
          >
            GAZ PEDALI (BASILI TUT)
          </button>

          {/* Dyno Sweep Test Button */}
          <button
            disabled={!isRunning || isDynoSweeping}
            onClick={onDynoSweep}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              isDynoSweeping
                ? 'bg-sky-600 text-white animate-pulse'
                : !isRunning
                ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                : 'bg-sky-600/90 hover:bg-sky-500 text-white shadow-md'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isDynoSweeping ? 'DYNO ÇEKİŞİ YAPILIYOR...' : 'DYNO TESTİ'}</span>
          </button>
        </div>

        {/* Throttle Slider (Manual Gas) */}
        <div className="flex items-center gap-2 bg-[#161a22] px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400">GAZ:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            disabled={!isRunning || isDynoSweeping}
            value={throttle}
            onChange={(e) => onThrottleChange(Number(e.target.value))}
            className="w-20 sm:w-24 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="font-mono text-[10px] text-amber-400 w-8 tabular-nums">
            %{Math.round(throttle * 100)}
          </span>
        </div>

        {/* 3D Visual Modes & Tools */}
        <div className="flex items-center gap-1.5">
          {/* X-Ray / Saydam Kesit Toggle */}
          <button
            onClick={onToggleXRay}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 border transition-all ${
              isXRay
                ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                : 'bg-[#161a22] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Motor bloğunu saydam yaparak piston ve krank hareketini görün"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KESİT (X-RAY)</span>
          </button>

          {/* Exploded View Slider */}
          <div className="flex items-center gap-1.5 bg-[#161a22] px-2.5 py-1.5 rounded-md border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-[10px] text-slate-400">PATLAT:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodedProgress}
              onChange={(e) => onExplodedChange(Number(e.target.value))}
              className="w-16 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              title="Parça patlatma görünümü"
            />
          </div>

          {/* Camera Angles Quick Menu */}
          <div className="flex items-center gap-0.5 bg-[#161a22] p-0.5 rounded-md border border-slate-800 text-[10px] font-mono">
            {['iso', 'front', 'side', 'top', 'exhaust'].map((c) => (
              <button
                key={c}
                onClick={() => onSelectCamera(c)}
                className="px-1.5 py-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-white uppercase"
              >
                {c === 'iso' ? 'İzo' : c === 'front' ? 'Ön' : c === 'side' ? 'Yan' : c === 'top' ? 'Üst' : 'Egz'}
              </button>
            ))}
          </div>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-md bg-[#161a22] border border-slate-800 text-slate-400 hover:text-white"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Garage Profiles Button */}
          <button
            onClick={onOpenGarage}
            className="px-2.5 py-1.5 rounded-md bg-rose-600/20 border border-rose-600/40 text-rose-300 hover:bg-rose-600/30 font-semibold flex items-center gap-1"
            title="Garaj ve Kayıtlı Motorlar"
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GARAJ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
