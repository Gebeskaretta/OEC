import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EngineConfig, EngineStats } from './types/engine';
import { calculateEngineStats, DEFAULT_ENGINE_CONFIG } from './services/enginePhysics';
import { engineSound } from './services/soundEngine';
import { ThreeEngineCanvas } from './components/ThreeEngineCanvas';
import { CategoryPanel } from './components/CategoryPanel';
import { DynoChart } from './components/DynoChart';
import { GaugeCluster } from './components/GaugeCluster';
import { DynoControlBar } from './components/DynoControlBar';
import { GarageModal } from './components/GarageModal';
import { 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  Settings2, 
  Wrench, 
  Sparkles,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_ENGINE_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentRpm, setCurrentRpm] = useState<number>(0);
  const [throttle, setThrottle] = useState<number>(0);
  const [isDynoSweeping, setIsDynoSweeping] = useState<boolean>(false);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [isXRay, setIsXRay] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<string>('iso');
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(true);
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDynoCard, setShowDynoCard] = useState<boolean>(true);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Compute calculated statistics and dyno curves
  const stats: EngineStats = useMemo(() => {
    return calculateEngineStats(config);
  }, [config]);

  // Check portrait orientation for mobile landscape prompt
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Engine Run / Stop
  const handleToggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      setCurrentRpm(0);
      setThrottle(0);
      setIsDynoSweeping(false);
      engineSound.stop();
    } else {
      setIsRunning(true);
      setCurrentRpm(stats.idleRpm);
      engineSound.start(config.cylinderCount, stats.idleRpm);
    }
  };

  // Smooth RPM update loop based on throttle and idle
  useEffect(() => {
    if (!isRunning) {
      setCurrentRpm(0);
      return;
    }

    if (isDynoSweeping) return; // Dyno sweep handles its own timeline

    const interval = window.setInterval(() => {
      // Target RPM based on throttle
      const idle = stats.idleRpm;
      const redline = stats.redlineRpm;
      const targetRpm = idle + Math.pow(throttle, 1.25) * (redline - idle);

      setCurrentRpm((prev) => {
        // Flywheel inertia factor: light carbon flywheel accelerates/decelerates faster!
        const inertiaSpeed = config.flywheelClutch === 'twin_disc_carbon' ? 0.28 : config.flywheelClutch === 'lightweight_steel' ? 0.2 : 0.14;
        const diff = targetRpm - prev;
        const nextRpm = Math.abs(diff) < 15 ? targetRpm : prev + diff * inertiaSpeed;

        // Current boost pressure at this RPM
        let currentBoost = 0;
        if (config.aspiration !== 'na') {
          const closest = stats.dynoCurve.reduce((p, c) =>
            Math.abs(c.rpm - nextRpm) < Math.abs(p.rpm - nextRpm) ? c : p
          );
          currentBoost = closest ? closest.boostBar * throttle : 0;
        }

        // Feed to Web Audio synthesizer
        engineSound.updateRpm(nextRpm, redline, config.aspiration !== 'na', currentBoost);

        return nextRpm;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isRunning, throttle, isDynoSweeping, stats, config]);

  // Automated Dyno Sweep Test
  const handleDynoSweep = () => {
    if (!isRunning || isDynoSweeping) return;
    setIsDynoSweeping(true);
    const startRpm = 1500;
    const endRpm = stats.redlineRpm;
    const durationMs = 4500;
    const startTime = performance.now();

    const sweepStep = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth sweep acceleration
      const sweptRpm = startRpm + Math.pow(progress, 0.9) * (endRpm - startRpm);
      setCurrentRpm(sweptRpm);
      setThrottle(Math.min(1.0, 0.4 + progress * 0.6));

      // Boost calculation
      let currentBoost = 0;
      if (config.aspiration !== 'na') {
        const closest = stats.dynoCurve.reduce((p, c) =>
          Math.abs(c.rpm - sweptRpm) < Math.abs(p.rpm - sweptRpm) ? c : p
        );
        currentBoost = closest ? closest.boostBar : 0;
      }
      engineSound.updateRpm(sweptRpm, stats.redlineRpm, config.aspiration !== 'na', currentBoost);

      if (progress < 1.0) {
        requestAnimationFrame(sweepStep);
      } else {
        // Redline cut bounce & backfire
        engineSound.triggerBackfirePop();
        setTimeout(() => {
          setIsDynoSweeping(false);
          setThrottle(0);
          engineSound.triggerBlowOffSurge();
        }, 400);
      }
    };

    requestAnimationFrame(sweepStep);
  };

  // Mute audio
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engineSound.setMute(next);
  };

  // Current boost estimate
  const currentBoost = useMemo(() => {
    if (config.aspiration === 'na' || !isRunning) return 0;
    const closest = stats.dynoCurve.reduce((p, c) =>
      Math.abs(c.rpm - currentRpm) < Math.abs(p.rpm - currentRpm) ? c : p
    );
    return closest ? closest.boostBar * (throttle > 0 ? throttle : 0.05) : 0;
  }, [config.aspiration, isRunning, stats, currentRpm, throttle]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0d13] text-slate-100 font-sans select-none">
      
      {/* Landscape Warning Banner for Mobile Portrait */}
      {isPortrait && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
          <Smartphone className="w-4 h-4 animate-bounce" />
          <span>En iyi deneyim ve geniş 3D motor görüntüsü için telefonunuzu YATAY konuma çevirin.</span>
        </div>
      )}

      {/* Top Application Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-11 bg-[#0d1017]/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-rose-500/50 shadow" />
            <h1 className="font-extrabold tracking-wider text-sm text-white font-mono uppercase">
              OTOMACHINE <span className="text-rose-500 font-bold">ENGINE CREATOR</span>
            </h1>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium hidden sm:inline">{config.name}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hidden md:inline">
            {config.layout} · {stats.displacementL}L ({stats.displacementCc} cc)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dyno Card Toggle */}
          <button
            onClick={() => setShowDynoCard(!showDynoCard)}
            className={`px-2.5 py-1 rounded flex items-center gap-1 border transition-all ${
              showDynoCard
                ? 'bg-sky-950/60 border-sky-600 text-sky-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}
            title="Dyno Grafiği Göster/Gizle"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DYNO GRAFİĞİ</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Tam Ekran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3D Scene Viewport (Full Bleed Background) */}
      <main className="absolute inset-0 z-0">
        <ThreeEngineCanvas
          config={config}
          currentRpm={currentRpm}
          isRunning={isRunning}
          explodedProgress={explodedProgress}
          isXRay={isXRay}
          cameraPreset={cameraPreset}
          onCameraPresetHandled={() => setCameraPreset('')}
        />
      </main>

      {/* Left Vertical Categories & Submenu Panel */}
      <CategoryPanel
        config={config}
        onChange={setConfig}
        isOpen={isCategoryOpen}
        onToggleOpen={() => setIsCategoryOpen(!isCategoryOpen)}
      />

      {/* Right Telemetry & Dyno Overlay */}
      <aside className="fixed top-14 right-3 z-20 w-80 sm:w-96 flex flex-col gap-2 pointer-events-auto max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
        {/* Main Telemetry & Gauges */}
        <GaugeCluster
          stats={stats}
          config={config}
          currentRpm={currentRpm}
          currentBoost={currentBoost}
          isRunning={isRunning}
        />

        {/* Automation Dyno Chart */}
        {showDynoCard && (
          <DynoChart
            dynoCurve={stats.dynoCurve}
            peakHp={stats.peakHp}
            peakHpRpm={stats.peakHpRpm}
            peakTorqueNm={stats.peakTorqueNm}
            peakTorqueRpm={stats.peakTorqueRpm}
            currentRpm={currentRpm}
            redlineRpm={stats.redlineRpm}
            isRunning={isRunning}
          />
        )}
      </aside>

      {/* Bottom Dyno Control Bar */}
      <DynoControlBar
        isRunning={isRunning}
        onToggleRun={handleToggleRun}
        throttle={throttle}
        onThrottleChange={setThrottle}
        onDynoSweep={handleDynoSweep}
        isDynoSweeping={isDynoSweeping}
        isXRay={isXRay}
        onToggleXRay={() => setIsXRay(!isXRay)}
        explodedProgress={explodedProgress}
        onExplodedChange={setExplodedProgress}
        onSelectCamera={(cam) => setCameraPreset(cam)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGarage={() => setIsGarageOpen(true)}
      />

      {/* Garage Save/Load Profiles Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        currentConfig={config}
        onLoadConfig={setConfig}
      />
    </div>
  );
}
