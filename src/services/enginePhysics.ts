import { EngineConfig, EngineStats, DynoPoint, EnginePreset } from '../types/engine';

export function calculateDisplacement(boreMm: number, strokeMm: number, cylinderCount: number): number {
  const radiusCm = boreMm / 20;
  const strokeCm = strokeMm / 10;
  const cylinderVolumeCc = Math.PI * Math.pow(radiusCm, 2) * strokeCm;
  return Math.round(cylinderVolumeCc * cylinderCount);
}

export function calculateEngineStats(config: EngineConfig): EngineStats {
  const displacementCc = calculateDisplacement(config.boreMm, config.strokeMm, config.cylinderCount);
  const displacementL = Number((displacementCc / 1000).toFixed(2));

  // Base mechanical weight
  let baseWeight = 70 + (displacementCc * 0.045);
  // Material factors for weight
  const blockWeightFactors = {
    cast_iron: 1.25,
    aluminium: 1.0,
    alsi: 0.9,
    magnesium: 0.8,
    titanium: 0.72,
  };
  const headWeightFactors = {
    cast_iron: 1.2,
    aluminium: 1.0,
    alsi: 0.95,
    magnesium: 0.85,
    titanium: 0.75,
  };

  let weight = baseWeight * (blockWeightFactors[config.blockMaterial] * 0.6 + headWeightFactors[config.headMaterial] * 0.4);

  // Aspiration weight & extras
  if (config.aspiration === 'single_turbo') weight += 18;
  if (config.aspiration === 'twin_turbo') weight += 28;
  if (config.aspiration === 'supercharger') weight += 22;

  // Flywheel weight
  if (config.flywheelClutch === 'heavy_cast') weight += 14;
  else if (config.flywheelClutch === 'lightweight_steel') weight += 8;
  else weight += 4;

  const engineWeightKg = Math.round(weight);

  // Base Cost (in TL)
  let baseCost = 65000 + displacementCc * 30;
  const materialCostMult = {
    cast_iron: 1.0,
    aluminium: 1.45,
    alsi: 1.8,
    magnesium: 2.3,
    titanium: 3.8,
  };
  baseCost *= materialCostMult[config.blockMaterial] * 0.7 + materialCostMult[config.headMaterial] * 0.3;

  if (config.crankshaft === 'forged_steel') baseCost += 28000;
  if (config.crankshaft === 'billet_steel') baseCost += 55000;
  if (config.crankshaft === 'lightweight_titanium') baseCost += 110000;

  if (config.pistons === 'forged_alu') baseCost += 24000;
  if (config.pistons === 'heavy_duty_forged') baseCost += 42000;
  if (config.pistons === 'race_titanium') baseCost += 95000;

  if (config.aspiration === 'single_turbo') baseCost += 48000;
  if (config.aspiration === 'twin_turbo') baseCost += 92000;
  if (config.aspiration === 'supercharger') baseCost += 85000;

  if (config.intake === 'perf_mpi') baseCost += 22000;
  if (config.intake === 'itb_trumpets') baseCost += 55000;

  if (config.exhaust === 'stainless_headers') baseCost += 25000;
  if (config.exhaust === 'long_tube_headers') baseCost += 42000;
  if (config.exhaust === 'titanium_straight') baseCost += 78000;

  const estimatedCostTl = Math.round(baseCost);

  // Volumetric Efficiency & Breathing calculations
  // Cam profile (0 = mild/eco, 50 = sports, 100 = full race)
  // Optimal VE RPM shifts higher with cam profile
  const camPeakRpm = 3800 + (config.camProfile / 100) * 3200; // 3800 to 7000 RPM
  const camWidth = 2600 + (config.camProfile / 100) * 1200;

  let baseVe = 0.82;
  // Head & valves influence
  if (config.headType === 'pushrod') baseVe -= 0.06;
  if (config.headType === 'sohc') baseVe -= 0.02;
  if (config.headType === 'dohc') baseVe += 0.06;

  if (config.valvesPerCylinder === 2) baseVe -= 0.05;
  if (config.valvesPerCylinder === 4) baseVe += 0.04;
  if (config.valvesPerCylinder === 5) baseVe += 0.06;

  // Intake influence
  if (config.intake === 'carburetor') baseVe -= 0.04;
  if (config.intake === 'standard_efi') baseVe += 0.02;
  if (config.intake === 'perf_mpi') baseVe += 0.07;
  if (config.intake === 'itb_trumpets') baseVe += 0.12;

  // Exhaust flow influence
  let exhaustFlowFactor = 1.0;
  if (config.exhaust === 'cast_manifold') exhaustFlowFactor = 0.92;
  if (config.exhaust === 'stainless_headers') exhaustFlowFactor = 1.02;
  if (config.exhaust === 'long_tube_headers') exhaustFlowFactor = 1.07;
  if (config.exhaust === 'titanium_straight') exhaustFlowFactor = 1.11;

  // Exhaust diameter match
  const idealExhaustDiam = Math.sqrt(displacementCc) * 1.05;
  const exhaustDiamDiff = Math.abs(config.exhaustDiameterMm - idealExhaustDiam);
  if (exhaustDiamDiff > 20) {
    exhaustFlowFactor -= 0.05;
  }

  // Compression ratio factor (ideal is around 10.5 for NA, 9.0 for high boost)
  // Thermal efficiency: 1 - (1 / CR^(gamma - 1)) where gamma = 1.35
  const thermalEfficiency = 1 - Math.pow(1 / config.compressionRatio, 0.3);

  // Calculate Dyno Points
  const dynoCurve: DynoPoint[] = [];
  const idleRpm = Math.max(750, Math.round(750 + (config.camProfile / 100) * 550));
  const redlineRpm = config.revLimiterRpm;

  let peakHp = 0;
  let peakHpRpm = 0;
  let peakTorqueNm = 0;
  let peakTorqueRpm = 0;

  const rpmStep = 250;
  for (let rpm = 1000; rpm <= redlineRpm; rpm += rpmStep) {
    // Volumetric curve (Gaussian shaped peak around camPeakRpm)
    const rpmDiff = rpm - camPeakRpm;
    const veCurve = Math.exp(-Math.pow(rpmDiff / camWidth, 2));
    const effectiveVe = (baseVe * 0.7 + baseVe * 0.3 * veCurve) * exhaustFlowFactor;

    // Forced induction boost at current RPM
    let effectiveBoost = 0;
    if (config.aspiration === 'single_turbo') {
      // Turbo lag spool up curve
      const spoolRpm = 2400 + (config.boostBar * 500);
      if (rpm >= spoolRpm) {
        const spoolProgress = Math.min(1.0, (rpm - spoolRpm) / 1200);
        effectiveBoost = config.boostBar * spoolProgress;
      }
    } else if (config.aspiration === 'twin_turbo') {
      // Faster spool twin turbo
      const spoolRpm = 1900 + (config.boostBar * 350);
      if (rpm >= spoolRpm) {
        const spoolProgress = Math.min(1.0, (rpm - spoolRpm) / 900);
        effectiveBoost = config.boostBar * spoolProgress;
      }
    } else if (config.aspiration === 'supercharger') {
      // Linear belt-driven boost across entire RPM range
      effectiveBoost = config.boostBar * Math.min(1.0, (rpm / 2000));
    }

    // Pressure multiplier: atmospheric 1.0 + boost
    const pressureRatio = 1.0 + effectiveBoost;

    // Theoretical air mass per stroke
    // Torque (Nm) = (Displacement in m3 * BMEP) / (2 * pi * (4-stroke factor 2))
    // Empirical formula aligned with real engines:
    // Naturally aspirated 1.0L makes ~90-115 Nm
    const naTorquePerLiter = 98 * (thermalEfficiency / 0.58) * effectiveVe;
    const boostTorqueMult = 1.0 + (effectiveBoost * 0.78); // Turbo pumping losses
    
    // Low RPM breathing penalty (under 1800 rpm if wild cam)
    let lowRpmFactor = 1.0;
    if (rpm < 2200 && config.camProfile > 60) {
      lowRpmFactor = 0.75 + (rpm / 2200) * 0.25;
    }

    // High RPM friction & pumping losses
    const frictionLoss = Math.pow(rpm / 10000, 2) * (displacementL * 14);

    let torqueNm = (displacementL * naTorquePerLiter * boostTorqueMult * lowRpmFactor) - frictionLoss;
    torqueNm = Math.max(15, Math.round(torqueNm));

    // Power (HP) = Torque(Nm) * RPM / 7127 (metric HP / PS approx 7120-7127)
    let powerHp = Math.round((torqueNm * rpm) / 7120);

    if (powerHp > peakHp) {
      peakHp = powerHp;
      peakHpRpm = rpm;
    }
    if (torqueNm > peakTorqueNm) {
      peakTorqueNm = torqueNm;
      peakTorqueRpm = rpm;
    }

    dynoCurve.push({
      rpm,
      torqueNm,
      powerHp,
      boostBar: Number(effectiveBoost.toFixed(2)),
    });
  }

  // Durability & Reliability Analysis
  const warnings: string[] = [];
  let durabilityScore = 100;

  // Mean Piston Speed = 2 * stroke(m) * (RPM / 60)
  const meanPistonSpeedMax = (2 * (config.strokeMm / 1000) * redlineRpm) / 60;
  
  // Piston material limits
  const pistonSpeedLimits = {
    cast: 19.5, // m/s
    forged_alu: 23.5,
    heavy_duty_forged: 26.5,
    race_titanium: 30.0,
  };
  if (meanPistonSpeedMax > pistonSpeedLimits[config.pistons]) {
    durabilityScore -= 30;
    warnings.push(`Piston hızı (${meanPistonSpeedMax.toFixed(1)} m/s) seçili ${config.pistons === 'cast' ? 'döküm' : 'malzeme'} piston limitini aşıyor! Piston kırılma riski yüksek.`);
  }

  // Crankshaft limits vs Peak Torque & RPM
  const crankTorqueLimits = {
    cast: 380,
    forged_steel: 750,
    billet_steel: 1200,
    lightweight_titanium: 1600,
  };
  if (peakTorqueNm > crankTorqueLimits[config.crankshaft]) {
    durabilityScore -= 35;
    warnings.push(`Maksimum tork (${peakTorqueNm} Nm) krank milinin taşıma kapasitesini (${crankTorqueLimits[config.crankshaft]} Nm) aşıyor!`);
  }

  // Boost vs Piston & Compression
  if (config.aspiration !== 'na' && config.boostBar > 0.8) {
    if (config.pistons === 'cast') {
      durabilityScore -= 40;
      warnings.push(`Yüksek turbo basıncı (${config.boostBar} bar) standart döküm pistonlarda patlamaya (detonasyon) yol açar!`);
    }
    if (config.compressionRatio > 11.0 && config.boostBar > 1.2) {
      durabilityScore -= 25;
      warnings.push(`Yüksek sıkıştırma oranı (${config.compressionRatio}:1) ve yüksek turbo basıncı aşırı silindir içi basınca sebep oluyor.`);
    }
  }

  // Valvetrain limits
  if (config.headType === 'pushrod' && redlineRpm > 6800) {
    durabilityScore -= 20;
    warnings.push(`İtici kollu (Pushrod) silindir kapağı 6800 devir üzerinde sübap kaçırması (valve float) yaşar.`);
  }

  durabilityScore = Math.max(10, Math.min(100, durabilityScore));
  const isOverstressed = durabilityScore < 60 || warnings.length > 0;

  return {
    displacementCc,
    displacementL,
    peakHp,
    peakHpRpm,
    peakTorqueNm,
    peakTorqueRpm,
    idleRpm,
    redlineRpm,
    engineWeightKg,
    estimatedCostTl,
    durabilityScore,
    isOverstressed,
    warnings,
    dynoCurve,
  };
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  id: 'default_v8',
  name: 'Otomachine 4.0L Biturbo V8',
  description: 'Düşük devirde yüksek tork ve agresif egzoz tınısı sunan çift turbolu V8 motor.',
  layout: 'V8',
  cylinderCount: 8,
  blockMaterial: 'aluminium',
  headMaterial: 'aluminium',
  headType: 'dohc',
  valvesPerCylinder: 4,
  boreMm: 86,
  strokeMm: 86,
  compressionRatio: 9.8,
  crankshaft: 'forged_steel',
  pistons: 'forged_alu',
  camProfile: 55,
  revLimiterRpm: 7500,
  intake: 'perf_mpi',
  aspiration: 'twin_turbo',
  boostBar: 1.2,
  exhaust: 'stainless_headers',
  exhaustDiameterMm: 70,
  transmission: 'dual_clutch_7',
  flywheelClutch: 'lightweight_steel',
  valveCoverColor: '#dc2626', // Red
};

export const PRESET_ENGINES: EnginePreset[] = [
  {
    name: '2.0L Turbo Ralli Canavarı',
    tag: 'I4 Turbo WRC',
    description: 'Yüksek devir çeviren, 2.0 bar basınca dayanıklı dövme pistonlu 4-silindirli ralli efsanesi.',
    config: {
      id: 'preset_i4_rally',
      name: '2.0L Turbo Ralli Canavarı',
      layout: 'I4',
      cylinderCount: 4,
      blockMaterial: 'cast_iron',
      headMaterial: 'aluminium',
      headType: 'dohc',
      valvesPerCylinder: 4,
      boreMm: 85,
      strokeMm: 88,
      compressionRatio: 8.8,
      crankshaft: 'billet_steel',
      pistons: 'heavy_duty_forged',
      camProfile: 70,
      revLimiterRpm: 8200,
      intake: 'perf_mpi',
      aspiration: 'single_turbo',
      boostBar: 2.1,
      exhaust: 'titanium_straight',
      exhaustDiameterMm: 76,
      transmission: 'sequential_6',
      flywheelClutch: 'twin_disc_carbon',
      valveCoverColor: '#1d4ed8',
    },
  },
  {
    name: '3.0L Sıralı 6 Twin-Turbo Drift',
    tag: 'I6 Biturbo JDM',
    description: 'Döküm bloklu, pürüzsüz güç dağılımı ve efsanevi sıralı 6 silindir kükremesi.',
    config: {
      id: 'preset_i6_drift',
      name: '3.0L Sıralı 6 Twin-Turbo Drift',
      layout: 'I6',
      cylinderCount: 6,
      blockMaterial: 'cast_iron',
      headMaterial: 'aluminium',
      headType: 'dohc',
      valvesPerCylinder: 4,
      boreMm: 86,
      strokeMm: 86,
      compressionRatio: 9.0,
      crankshaft: 'forged_steel',
      pistons: 'forged_alu',
      camProfile: 62,
      revLimiterRpm: 8000,
      intake: 'perf_mpi',
      aspiration: 'twin_turbo',
      boostBar: 1.5,
      exhaust: 'long_tube_headers',
      exhaustDiameterMm: 76,
      transmission: 'manual_6',
      flywheelClutch: 'lightweight_steel',
      valveCoverColor: '#9333ea',
    },
  },
  {
    name: '5.0L V8 Amerikan Kas Gücü',
    tag: 'V8 Supercharged Muscle',
    description: 'Büyük hacimli, supercharger beslemeli saf Amerikan tork canavarı.',
    config: {
      id: 'preset_v8_muscle',
      name: '5.0L V8 Amerikan Kas Gücü',
      layout: 'V8',
      cylinderCount: 8,
      blockMaterial: 'aluminium',
      headMaterial: 'aluminium',
      headType: 'dohc',
      valvesPerCylinder: 4,
      boreMm: 93,
      strokeMm: 92,
      compressionRatio: 10.0,
      crankshaft: 'billet_steel',
      pistons: 'heavy_duty_forged',
      camProfile: 65,
      revLimiterRpm: 7600,
      intake: 'perf_mpi',
      aspiration: 'supercharger',
      boostBar: 0.9,
      exhaust: 'long_tube_headers',
      exhaustDiameterMm: 80,
      transmission: 'manual_6',
      flywheelClutch: 'twin_disc_carbon',
      valveCoverColor: '#ea580c',
    },
  },
  {
    name: '6.5L V12 Saf Atmosferik F1 Çığlığı',
    tag: 'V12 NA Screamer',
    description: '10.000 devir çeviren, titanyum bileşenli ve ITB kelebekli saf yarış senfonisi.',
    config: {
      id: 'preset_v12_screamer',
      name: '6.5L V12 Saf Atmosferik F1 Çığlığı',
      layout: 'V12',
      cylinderCount: 12,
      blockMaterial: 'titanium',
      headMaterial: 'titanium',
      headType: 'dohc',
      valvesPerCylinder: 4,
      boreMm: 88,
      strokeMm: 89,
      compressionRatio: 13.2,
      crankshaft: 'lightweight_titanium',
      pistons: 'race_titanium',
      camProfile: 92,
      revLimiterRpm: 9800,
      intake: 'itb_trumpets',
      aspiration: 'na',
      boostBar: 0,
      exhaust: 'titanium_straight',
      exhaustDiameterMm: 85,
      transmission: 'sequential_6',
      flywheelClutch: 'twin_disc_carbon',
      valveCoverColor: '#e11d48',
    },
  },
  {
    name: '1.4L Eko-Şehir Kompakt',
    tag: 'I4 Eco City',
    description: 'Düşük sürtünmeli, ekonomik ve dayanıklı standart şehir motoru.',
    config: {
      id: 'preset_i4_eco',
      name: '1.4L Eko-Şehir Kompakt',
      layout: 'I4',
      cylinderCount: 4,
      blockMaterial: 'aluminium',
      headMaterial: 'aluminium',
      headType: 'dohc',
      valvesPerCylinder: 4,
      boreMm: 74,
      strokeMm: 80,
      compressionRatio: 10.5,
      crankshaft: 'cast',
      pistons: 'cast',
      camProfile: 25,
      revLimiterRpm: 6400,
      intake: 'standard_efi',
      aspiration: 'na',
      boostBar: 0,
      exhaust: 'cast_manifold',
      exhaustDiameterMm: 50,
      transmission: 'manual_5',
      flywheelClutch: 'heavy_cast',
      valveCoverColor: '#475569',
    },
  },
];
