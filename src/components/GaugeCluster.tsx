import React from 'react';
import { EngineStats, EngineConfig } from '../types/engine';
import { AlertTriangle, ShieldCheck, Gauge, Zap } from 'lucide-react';

interface GaugeClusterProps {
  stats: EngineStats;
  config: EngineConfig;
  currentRpm: number;
  currentBoost: number;
  isRunning: boolean;
}

export const GaugeCluster: React.FC<GaugeClusterProps> = ({
  stats,
  config,
  currentRpm,
  currentBoost,
  isRunning,
}) => {
  // Tachometer needle angle: maps 0 - 10000 RPM to -135deg to +135deg
  const maxRpmDisplay = Math.max(8000, Math.ceil(stats.redlineRpm / 1000) * 1000);
  const rpmFraction = Math.min(1, Math.max(0, currentRpm / maxRpmDisplay));
  const needleAngle = -135 + rpmFraction * 270;

  // Boost needle angle: maps -1.0 to 3.0 bar to -130deg to +130deg
  const boostFraction = Math.min(1, Math.max(0, (currentBoost + 1.0) / 4.0));
  const boostNeedleAngle = -130 + boostFraction * 260;

  return (
    <div className="flex flex-col gap-2">
      {/* Top Main Telemetry Cluster */}
      <div className="grid grid-cols-4 gap-2 bg-[#11141a]/95 border border-slate-800 rounded-lg p-2.5 shadow-xl">
        {/* Güç */}
        <div className="flex flex-col bg-[#161a22] border border-slate-800/80 rounded px-2.5 py-1.5">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Maksimum Güç</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">
              {stats.peakHp}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">BG</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">@{stats.peakHpRpm} dev</span>
        </div>

        {/* Tork */}
        <div className="flex flex-col bg-[#161a22] border border-slate-800/80 rounded px-2.5 py-1.5">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Maksimum Tork</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">
              {stats.peakTorqueNm}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Nm</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">@{stats.peakTorqueRpm} dev</span>
        </div>

        {/* Ağırlık */}
        <div className="flex flex-col bg-[#161a22] border border-slate-800/80 rounded px-2.5 py-1.5">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Motor Ağırlığı</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {stats.engineWeightKg}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">kg</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">{stats.displacementL}L / {stats.displacementCc} cc</span>
        </div>

        {/* Tahmini Maliyet */}
        <div className="flex flex-col bg-[#161a22] border border-slate-800/80 rounded px-2.5 py-1.5">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Tahmini Maliyet</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              ₺{stats.estimatedCostTl.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400">
            {stats.isOverstressed ? (
              <span className="text-amber-400 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Riskli Yapı
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Dayanıklı (%{stats.durabilityScore})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tachometer & Boost Dials */}
      <div className="flex items-center gap-3 bg-[#11141a]/95 border border-slate-800 rounded-lg p-2.5 shadow-xl">
        {/* Tachometer */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center bg-[#090c10] rounded-full border-2 border-slate-700 shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Ticks and marks */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => {
              const markRpm = k * 1000;
              if (markRpm > maxRpmDisplay) return null;
              const angle = -135 + (markRpm / maxRpmDisplay) * 270;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 38 * Math.cos(rad);
              const y1 = 50 + 38 * Math.sin(rad);
              const x2 = 50 + 44 * Math.cos(rad);
              const y2 = 50 + 44 * Math.sin(rad);
              const isRedline = markRpm >= stats.redlineRpm - 500;
              return (
                <line
                  key={k}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isRedline ? '#ef4444' : '#94a3b8'}
                  strokeWidth={k % 2 === 0 ? '2' : '1.2'}
                />
              );
            })}

            {/* Redline arc */}
            <circle
              cx="50"
              cy="50"
              r="41"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="40 200"
              strokeDashoffset="-140"
            />

            {/* Needle */}
            <g transform={`rotate(${needleAngle} 50 50)`} className="transition-transform duration-75">
              <line x1="50" y1="50" x2="50" y2="14" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              <line x1="50" y1="50" x2="50" y2="60" stroke="#f43f5e" strokeWidth="2.5" />
            </g>
            <circle cx="50" cy="50" r="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
          </svg>

          {/* Central digital RPM reading */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-5">
            <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
              {isRunning ? Math.round(currentRpm) : 0}
            </span>
            <span className="text-[8px] font-mono text-slate-400">RPM</span>
          </div>
        </div>

        {/* Turbo Boost Gauge (if forced induction) or Throttle/Power status */}
        {config.aspiration !== 'na' ? (
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center bg-[#090c10] rounded-full border-2 border-slate-700 shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Ticks for -1, 0, +1, +2, +3 Bar */}
              {[-1, 0, 1, 2, 3].map((b) => {
                const angle = -130 + ((b + 1) / 4) * 260;
                const rad = (angle * Math.PI) / 180;
                const x1 = 50 + 36 * Math.cos(rad);
                const y1 = 50 + 36 * Math.sin(rad);
                const x2 = 50 + 43 * Math.cos(rad);
                const y2 = 50 + 43 * Math.sin(rad);
                return (
                  <line
                    key={b}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={b > 1.5 ? '#f59e0b' : '#38bdf8'}
                    strokeWidth="1.8"
                  />
                );
              })}
              {/* Boost Needle */}
              <g transform={`rotate(${boostNeedleAngle} 50 50)`} className="transition-transform duration-75">
                <line x1="50" y1="50" x2="50" y2="15" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              </g>
              <circle cx="50" cy="50" r="4" fill="#38bdf8" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
              <span className="text-[11px] font-mono font-bold text-sky-400 tabular-nums">
                {currentBoost > 0 ? `+${currentBoost.toFixed(2)}` : currentBoost.toFixed(2)}
              </span>
              <span className="text-[7px] font-mono text-slate-400 uppercase">BAR BOOST</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center px-2 py-1 bg-[#161a22] border border-slate-800 rounded">
            <span className="text-[10px] text-slate-400 font-mono">EMME TÜRÜ</span>
            <span className="text-xs font-semibold text-emerald-400">Atmosferik (NA)</span>
            <span className="text-[9px] text-slate-500 mt-1">Anında gaz tepkisi, saf motor mekaniği</span>
          </div>
        )}

        {/* Live Engine Status Pill */}
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">DURUM:</span>
            <span className={`font-semibold ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isRunning ? 'ÇALIŞIYOR' : 'DURDURULDU'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">KESİCİ:</span>
            <span className="text-rose-400 font-semibold">{stats.redlineRpm} RPM</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">SIKIŞTIRMA:</span>
            <span className="text-sky-300 font-semibold">{config.compressionRatio.toFixed(1)}:1</span>
          </div>
        </div>
      </div>

      {/* Warnings & Engine Damage Alerts */}
      {stats.warnings.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-800/80 rounded-lg p-2 text-xs text-amber-200 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Mekanik Dayanıklılık Uyarıları:</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-200/90 pl-1 space-y-0.5">
            {stats.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
