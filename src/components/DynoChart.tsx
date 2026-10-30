import React from 'react';
import { DynoPoint } from '../types/engine';

interface DynoChartProps {
  dynoCurve: DynoPoint[];
  peakHp: number;
  peakHpRpm: number;
  peakTorqueNm: number;
  peakTorqueRpm: number;
  currentRpm: number;
  redlineRpm: number;
  isRunning: boolean;
}

export const DynoChart: React.FC<DynoChartProps> = ({
  dynoCurve,
  peakHp,
  peakHpRpm,
  peakTorqueNm,
  peakTorqueRpm,
  currentRpm,
  redlineRpm,
  isRunning,
}) => {
  if (!dynoCurve || dynoCurve.length === 0) return null;

  // Chart dimensions
  const width = 440;
  const height = 180;
  const padding = { top: 20, right: 35, bottom: 25, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find max values for scale
  const minRpm = 1000;
  const maxRpm = redlineRpm;
  const maxPower = Math.max(100, Math.ceil((peakHp * 1.15) / 50) * 50);
  const maxTorque = Math.max(100, Math.ceil((peakTorqueNm * 1.15) / 50) * 50);

  const getX = (rpm: number) => {
    return padding.left + ((rpm - minRpm) / (maxRpm - minRpm)) * plotWidth;
  };

  const getPowerY = (hp: number) => {
    return padding.top + plotHeight - (hp / maxPower) * plotHeight;
  };

  const getTorqueY = (nm: number) => {
    return padding.top + plotHeight - (nm / maxTorque) * plotHeight;
  };

  // Build SVG path strings
  let powerPath = '';
  let torquePath = '';

  dynoCurve.forEach((point, i) => {
    const x = getX(point.rpm);
    const py = getPowerY(point.powerHp);
    const ty = getTorqueY(point.torqueNm);

    if (i === 0) {
      powerPath = `M ${x.toFixed(1)} ${py.toFixed(1)}`;
      torquePath = `M ${x.toFixed(1)} ${ty.toFixed(1)}`;
    } else {
      powerPath += ` L ${x.toFixed(1)} ${py.toFixed(1)}`;
      torquePath += ` L ${x.toFixed(1)} ${ty.toFixed(1)}`;
    }
  });

  // Calculate current RPM values for live overlay
  let currentHp = 0;
  let currentTorque = 0;
  if (isRunning) {
    const closest = dynoCurve.reduce((prev, curr) =>
      Math.abs(curr.rpm - currentRpm) < Math.abs(prev.rpm - currentRpm) ? curr : prev
    );
    currentHp = closest ? closest.powerHp : 0;
    currentTorque = closest ? closest.torqueNm : 0;
  }

  const cursorX = getX(Math.min(maxRpm, Math.max(minRpm, currentRpm)));

  return (
    <div className="bg-[#11141a]/95 border border-slate-800 rounded-lg p-2.5 shadow-xl select-none">
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 tracking-wider">DYNO EĞRİSİ</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
            <span className="text-sky-300 font-mono text-[11px]">Güç ({peakHp} BG)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span className="text-rose-400 font-mono text-[11px]">Tork ({peakTorqueNm} Nm)</span>
          </div>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-sky-300">{currentHp} BG</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400">{currentTorque} Nm</span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Background grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#090c10"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const y = padding.top + plotHeight * (1 - frac);
            const hpVal = Math.round(maxPower * frac);
            return (
              <g key={frac}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {hpVal}
                </text>
              </g>
            );
          })}

          {/* Vertical RPM grid lines */}
          {[2000, 4000, 6000, 8000, 10000].map((rpm) => {
            if (rpm > maxRpm) return null;
            const x = getX(rpm);
            return (
              <g key={rpm}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="#1e293b"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {rpm / 1000}k
                </text>
              </g>
            );
          })}

          {/* Power Curve (Blue) */}
          <path
            d={powerPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Torque Curve (Red) */}
          <path
            d={torquePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak Power Point marker */}
          <circle
            cx={getX(peakHpRpm)}
            cy={getPowerY(peakHp)}
            r="4.5"
            fill="#38bdf8"
            stroke="#0369a1"
            strokeWidth="1.5"
          />

          {/* Peak Torque Point marker */}
          <circle
            cx={getX(peakTorqueRpm)}
            cy={getTorqueY(peakTorqueNm)}
            r="4.5"
            fill="#f43f5e"
            stroke="#be123c"
            strokeWidth="1.5"
          />

          {/* Live Dyno / Engine RPM cursor line */}
          {isRunning && (
            <g>
              <line
                x1={cursorX}
                y1={padding.top}
                x2={cursorX}
                y2={padding.top + plotHeight}
                stroke="#eab308"
                strokeWidth="2"
              />
              <circle cx={cursorX} cy={getPowerY(currentHp)} r="4" fill="#38bdf8" />
              <circle cx={cursorX} cy={getTorqueY(currentTorque)} r="4" fill="#f43f5e" />
            </g>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
        <span>Pik Güç: <strong className="text-sky-300">{peakHp} BG</strong> @ {peakHpRpm} devir</span>
        <span>Pik Tork: <strong className="text-rose-400">{peakTorqueNm} Nm</strong> @ {peakTorqueRpm} devir</span>
      </div>
    </div>
  );
};
