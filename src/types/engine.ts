export type CylinderLayout = 'I4' | 'I6' | 'V6' | 'V8' | 'V10' | 'V12';

export type MaterialType = 'cast_iron' | 'aluminium' | 'alsi' | 'magnesium' | 'titanium';

export type HeadType = 'pushrod' | 'sohc' | 'dohc';

export type CrankshaftType = 'cast' | 'forged_steel' | 'billet_steel' | 'lightweight_titanium';

export type PistonType = 'cast' | 'forged_alu' | 'heavy_duty_forged' | 'race_titanium';

export type IntakeType = 'carburetor' | 'standard_efi' | 'perf_mpi' | 'itb_trumpets';

export type AspirationType = 'na' | 'single_turbo' | 'twin_turbo' | 'supercharger';

export type ExhaustType = 'cast_manifold' | 'stainless_headers' | 'long_tube_headers' | 'titanium_straight';

export type TransmissionType = 'manual_5' | 'manual_6' | 'sequential_6' | 'dual_clutch_7';

export type FlywheelClutchType = 'heavy_cast' | 'lightweight_steel' | 'twin_disc_carbon';

export interface EngineConfig {
  id: string;
  name: string;
  description?: string;
  layout: CylinderLayout;
  cylinderCount: number;
  blockMaterial: MaterialType;
  headMaterial: MaterialType;
  headType: HeadType;
  valvesPerCylinder: 2 | 4 | 5;
  boreMm: number; // 60 - 105 mm
  strokeMm: number; // 55 - 110 mm
  compressionRatio: number; // 7.5 - 14.0 : 1
  crankshaft: CrankshaftType;
  pistons: PistonType;
  camProfile: number; // 0 - 100 (Eco to Full Race Cam)
  revLimiterRpm: number; // 5000 - 10000 RPM
  intake: IntakeType;
  aspiration: AspirationType;
  boostBar: number; // 0.2 - 2.8 bar (for turbo / supercharger)
  exhaust: ExhaustType;
  exhaustDiameterMm: number; // 45 - 90 mm
  transmission: TransmissionType;
  flywheelClutch: FlywheelClutchType;
  valveCoverColor: string; // Hex color for valve cover
}

export interface DynoPoint {
  rpm: number;
  torqueNm: number;
  powerHp: number;
  boostBar: number;
}

export interface EngineStats {
  displacementCc: number;
  displacementL: number;
  peakHp: number;
  peakHpRpm: number;
  peakTorqueNm: number;
  peakTorqueRpm: number;
  idleRpm: number;
  redlineRpm: number;
  engineWeightKg: number;
  estimatedCostTl: number;
  durabilityScore: number; // 0 - 100
  isOverstressed: boolean;
  warnings: string[];
  dynoCurve: DynoPoint[];
}

export interface EnginePreset {
  name: string;
  tag: string;
  description: string;
  config: EngineConfig;
}
