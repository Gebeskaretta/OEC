import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EngineConfig } from '../types/engine';

interface ThreeEngineCanvasProps {
  config: EngineConfig;
  currentRpm: number;
  isRunning: boolean;
  explodedProgress: number; // 0 (assembled) to 1 (exploded)
  isXRay: boolean;
  cameraPreset?: string;
  onCameraPresetHandled?: () => void;
}

export const ThreeEngineCanvas: React.FC<ThreeEngineCanvasProps> = ({
  config,
  currentRpm,
  isRunning,
  explodedProgress,
  isXRay,
  cameraPreset,
  onCameraPresetHandled,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Animated sub-components references
  const movingPartsRef = useRef<{
    crankshaft: THREE.Group | null;
    pulleys: THREE.Mesh[];
    pistons: { mesh: THREE.Group; bankAngle: number; phase: number; stroke: number; baseY: number; baseX: number; baseZ: number }[];
    exhaustMeshes: THREE.Mesh[];
    flamePuffs: THREE.Mesh[];
    engineBlockGroup: THREE.Group | null;
    headsGroup: THREE.Group | null;
    intakeGroup: THREE.Group | null;
    exhaustGroup: THREE.Group | null;
    turboGroup: THREE.Group | null;
  }>({
    crankshaft: null,
    pulleys: [],
    pistons: [],
    exhaustMeshes: [],
    flamePuffs: [],
    engineBlockGroup: null,
    headsGroup: null,
    intakeGroup: null,
    exhaustGroup: null,
    turboGroup: null,
  });

  const stateRef = useRef({
    rpm: currentRpm,
    isRunning,
    exploded: explodedProgress,
    isXRay,
    crankAngle: 0,
    vibrationOffset: new THREE.Vector3(),
  });

  // Sync props to mutable ref for high-performance zero-GC RAF loop
  useEffect(() => {
    stateRef.current.rpm = currentRpm;
    stateRef.current.isRunning = isRunning;
    stateRef.current.exploded = explodedProgress;
    stateRef.current.isXRay = isXRay;
  }, [currentRpm, isRunning, explodedProgress, isXRay]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (cameraPreset) {
      case 'iso':
        cam.position.set(2.8, 2.2, 3.2);
        ctrl.target.set(0, 0.9, 0);
        break;
      case 'front':
        cam.position.set(0, 1.4, 4.0);
        ctrl.target.set(0, 0.9, 0);
        break;
      case 'side':
        cam.position.set(4.2, 1.2, 0);
        ctrl.target.set(0, 0.9, 0);
        break;
      case 'top':
        cam.position.set(0, 4.5, 0.1);
        ctrl.target.set(0, 0.9, 0);
        break;
      case 'exhaust':
        cam.position.set(-2.8, 1.3, -2.5);
        ctrl.target.set(0, 0.9, 0);
        break;
    }
    ctrl.update();
    onCameraPresetHandled?.();
  }, [cameraPreset, onCameraPresetHandled]);

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x13171d);
    scene.fog = new THREE.FogExp2(0x13171d, 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      60
    );
    camera.position.set(2.9, 2.1, 3.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Lighting (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.7);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.2);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(0, 3, -6);
    scene.add(rimLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.9, 0);
    controls.minDistance = 1.2;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.04; // Don't flip below floor
    controls.update();

    // Workshop Floor with Safety Stripes CanvasTexture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#1e242d';
    fctx.fillRect(0, 0, 512, 512);

    // Grid lines
    fctx.strokeStyle = '#28313d';
    fctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 64) {
      fctx.beginPath();
      fctx.moveTo(i, 0);
      fctx.lineTo(i, 512);
      fctx.stroke();
      fctx.beginPath();
      fctx.moveTo(0, i);
      fctx.lineTo(512, i);
      fctx.stroke();
    }

    // Caution border
    fctx.fillStyle = '#eab308';
    fctx.fillRect(96, 96, 320, 24);
    fctx.fillRect(96, 392, 320, 24);
    fctx.fillRect(96, 96, 24, 320);
    fctx.fillRect(392, 96, 24, 320);

    // Black diagonal warning stripes
    fctx.fillStyle = '#18181b';
    for (let s = 96; s < 416; s += 28) {
      fctx.beginPath();
      fctx.moveTo(s, 96);
      fctx.lineTo(s + 14, 96);
      fctx.lineTo(s - 14, 120);
      fctx.lineTo(s - 28, 120);
      fctx.fill();

      fctx.beginPath();
      fctx.moveTo(s, 392);
      fctx.lineTo(s + 14, 392);
      fctx.lineTo(s - 14, 416);
      fctx.lineTo(s - 28, 416);
      fctx.fill();
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(3, 3);

    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Soft Radial Contact Shadow under engine stand
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // Build Automation-style Dyno Bed & Garage Workshop Props
    buildGarageEnvironment(scene);

    // Build the initial Engine
    buildProceduralEngine(scene, config, movingPartsRef.current);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    function renderLoop() {
      const dt = Math.min(clock.getDelta(), 0.05);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Animate engine parts
      const parts = movingPartsRef.current;
      const { rpm, isRunning, crankAngle, exploded, isXRay } = stateRef.current;

      if (isRunning) {
        // Crank angle advancement: RPS * 2 * PI * dt
        const rps = rpm / 60;
        const deltaAngle = rps * Math.PI * 2 * dt;
        stateRef.current.crankAngle = (crankAngle + deltaAngle) % (Math.PI * 2);

        // Subtle realistic engine vibration / cam rock
        const vibIntensity = Math.min(0.0035, (rpm / 8000) * 0.003 + 0.001);
        const vibX = Math.sin(clock.getElapsedTime() * 45) * vibIntensity;
        const vibY = Math.cos(clock.getElapsedTime() * 52) * vibIntensity;

        if (parts.engineBlockGroup) {
          parts.engineBlockGroup.position.x = vibX;
          parts.engineBlockGroup.position.y = 0.45 + vibY;
        }

        // Rotate crankshaft
        if (parts.crankshaft) {
          parts.crankshaft.rotation.z = stateRef.current.crankAngle;
        }

        // Spin front accessory pulleys
        parts.pulleys.forEach((p, idx) => {
          p.rotation.z = (stateRef.current.crankAngle * (idx === 0 ? 1 : 1.35)) % (Math.PI * 2);
        });

        // Oscillate pistons inside cylinder bores
        const angle = stateRef.current.crankAngle;
        parts.pistons.forEach((p) => {
          const pistonTheta = angle + p.phase;
          // Simple piston kinematic formula: y = r * (cos theta + (r/2l) * cos 2theta)
          const travel = Math.cos(pistonTheta) * (p.stroke * 0.5);
          const rad = p.bankAngle;
          p.mesh.position.y = p.baseY + travel * Math.cos(rad);
          p.mesh.position.x = p.baseX + travel * Math.sin(rad);
        });

        // Exhaust header glow when revving hard (> 4500 RPM)
        const glowFactor = Math.max(0, (rpm - 3500) / 4500);
        parts.exhaustMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            mat.emissive.setRGB(glowFactor * 0.95, glowFactor * 0.28, glowFactor * 0.04);
            mat.emissiveIntensity = glowFactor * 1.8;
          }
        });

        // Limiter / high rev exhaust flame flashes
        if (rpm > config.revLimiterRpm - 150 && Math.random() < 0.35) {
          parts.flamePuffs.forEach((flame) => {
            flame.scale.setScalar(0.8 + Math.random() * 0.6);
            flame.visible = true;
          });
        } else {
          parts.flamePuffs.forEach((flame) => {
            flame.visible = false;
          });
        }
      } else {
        // Idle position, no vibration
        if (parts.engineBlockGroup) {
          parts.engineBlockGroup.position.set(0, 0.45, 0);
        }
        parts.exhaustMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            mat.emissive.setRGB(0, 0, 0);
          }
        });
        parts.flamePuffs.forEach((flame) => {
          flame.visible = false;
        });
      }

      // Smooth Exploded View Layer Separations
      if (parts.headsGroup) {
        parts.headsGroup.position.y = exploded * 0.35;
      }
      if (parts.intakeGroup) {
        parts.intakeGroup.position.y = exploded * 0.65;
      }
      if (parts.exhaustGroup) {
        parts.exhaustGroup.position.x = exploded * 0.45;
      }
      if (parts.turboGroup) {
        parts.turboGroup.position.z = exploded * 0.35;
      }

      // X-Ray Transparency Handling
      if (parts.engineBlockGroup) {
        parts.engineBlockGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).name === 'blockBody') {
            const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.transparent = isXRay;
              mat.opacity = isXRay ? 0.28 : 1.0;
              mat.depthWrite = !isXRay;
            }
          }
        });
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Re-build engine when config changes
  useEffect(() => {
    if (!sceneRef.current) return;
    buildProceduralEngine(sceneRef.current, config, movingPartsRef.current);
  }, [config]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing select-none" />;
};

// ==============================================================================
// Procedural Engine Geometry & PBR Assembly
// ==============================================================================

function getMaterial(type: string, isBlock: boolean = true): THREE.MeshStandardMaterial {
  switch (type) {
    case 'cast_iron':
      return new THREE.MeshStandardMaterial({
        color: 0x3a3f47,
        roughness: 0.78,
        metalness: 0.4,
      });
    case 'aluminium':
      return new THREE.MeshStandardMaterial({
        color: 0xd8dde3,
        roughness: 0.28,
        metalness: 0.88,
      });
    case 'alsi':
      return new THREE.MeshStandardMaterial({
        color: 0xb5bec8,
        roughness: 0.35,
        metalness: 0.72,
      });
    case 'magnesium':
      return new THREE.MeshStandardMaterial({
        color: 0xc4b391,
        roughness: 0.32,
        metalness: 0.8,
      });
    case 'titanium':
      return new THREE.MeshStandardMaterial({
        color: 0x93a3b8,
        roughness: 0.18,
        metalness: 0.95,
      });
    default:
      return new THREE.MeshStandardMaterial({
        color: 0x8892b0,
        roughness: 0.4,
        metalness: 0.7,
      });
  }
}

function buildGarageEnvironment(scene: THREE.Scene) {
  const envGroup = new THREE.Group();
  envGroup.name = 'garageEnv';

  // Dyno Bed Frame (Automation Orange Industrial Steel Stand!)
  const orangeStandMat = new THREE.MeshStandardMaterial({
    color: 0xe65100, // Vibrant Industrial Dyno Orange
    roughness: 0.42,
    metalness: 0.65,
  });

  const standBaseGeo = new THREE.BoxGeometry(2.4, 0.12, 1.4);
  const standBase = new THREE.Mesh(standBaseGeo, orangeStandMat);
  standBase.position.set(0, 0.06, 0);
  standBase.castShadow = true;
  standBase.receiveShadow = true;
  envGroup.add(standBase);

  // 4 Corner vertical beams
  const beamGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
  const beamPositions = [
    [-0.95, 0.28, -0.55],
    [0.95, 0.28, -0.55],
    [-0.95, 0.28, 0.55],
    [0.95, 0.28, 0.55],
  ];
  beamPositions.forEach(([x, y, z]) => {
    const beam = new THREE.Mesh(beamGeo, orangeStandMat);
    beam.position.set(x, y, z);
    beam.castShadow = true;
    envGroup.add(beam);
  });

  // Cross struts
  const topPlateGeo = new THREE.BoxGeometry(2.1, 0.08, 1.2);
  const topPlate = new THREE.Mesh(topPlateGeo, orangeStandMat);
  topPlate.position.set(0, 0.5, 0);
  topPlate.castShadow = true;
  envGroup.add(topPlate);

  // Heavy Electric Dyno Absorber Unit (Rear blue cylinder with cooling ribs)
  const dynoMotorMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Dyno Cyan/Blue
    roughness: 0.35,
    metalness: 0.82,
  });

  const dynoGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 24);
  const dynoMesh = new THREE.Mesh(dynoGeo, dynoMotorMat);
  dynoMesh.rotation.x = Math.PI / 2;
  dynoMesh.position.set(0, 0.78, -1.25);
  dynoMesh.castShadow = true;
  envGroup.add(dynoMesh);

  // Dyno drive shaft coupling
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.2,
    metalness: 0.92,
  });
  const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 16);
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  shaftMesh.rotation.x = Math.PI / 2;
  shaftMesh.position.set(0, 0.78, -0.65);
  envGroup.add(shaftMesh);

  // Dyno Exhaust Extraction Hoses / Arm
  const ductMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.5,
    metalness: 0.7,
  });
  const ductGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.8, 16);
  const ductMesh = new THREE.Mesh(ductGeo, ductMat);
  ductMesh.rotation.z = Math.PI / 2.3;
  ductMesh.position.set(1.5, 1.4, -0.6);
  envGroup.add(ductMesh);

  // Workshop Back Brick Wall
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 512;
  const wctx = wallCanvas.getContext('2d')!;
  wctx.fillStyle = '#642f2b'; // Brick red
  wctx.fillRect(0, 0, 512, 512);
  wctx.strokeStyle = '#3e1e1b';
  wctx.lineWidth = 3;
  const brickH = 24;
  const brickW = 64;
  for (let y = 0; y < 512; y += brickH) {
    const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.lineTo(512, y);
    wctx.stroke();
    for (let x = -offset; x < 512; x += brickW) {
      wctx.beginPath();
      wctx.moveTo(x, y);
      wctx.lineTo(x, y + brickH);
      wctx.stroke();
    }
  }

  const wallTexture = new THREE.CanvasTexture(wallCanvas);
  wallTexture.colorSpace = THREE.SRGBColorSpace;
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(5, 3);

  const wallMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 12),
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.85,
      metalness: 0.05,
    })
  );
  wallMesh.position.set(0, 6, -6.5);
  wallMesh.receiveShadow = true;
  envGroup.add(wallMesh);

  // Overhead Industrial Strip Light Fixture
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lampGeo = new THREE.BoxGeometry(3.5, 0.08, 0.35);
  const lampMesh = new THREE.Mesh(lampGeo, lampMat);
  lampMesh.position.set(0, 4.8, 0);
  envGroup.add(lampMesh);

  scene.add(envGroup);
}

function buildProceduralEngine(
  scene: THREE.Scene,
  config: EngineConfig,
  movingParts: {
    crankshaft: THREE.Group | null;
    pulleys: THREE.Mesh[];
    pistons: { mesh: THREE.Group; bankAngle: number; phase: number; stroke: number; baseY: number; baseX: number; baseZ: number }[];
    exhaustMeshes: THREE.Mesh[];
    flamePuffs: THREE.Mesh[];
    engineBlockGroup: THREE.Group | null;
    headsGroup: THREE.Group | null;
    intakeGroup: THREE.Group | null;
    exhaustGroup: THREE.Group | null;
    turboGroup: THREE.Group | null;
  }
) {
  // Remove existing engine model if any
  const existing = scene.getObjectByName('engineRoot');
  if (existing) {
    scene.remove(existing);
    existing.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });
  }

  const root = new THREE.Group();
  root.name = 'engineRoot';
  root.position.set(0, 0.45, 0); // Grounded on top of dyno bed

  movingParts.pulleys = [];
  movingParts.pistons = [];
  movingParts.exhaustMeshes = [];
  movingParts.flamePuffs = [];

  const isVEngine = config.layout.startsWith('V');
  const cylPerBank = isVEngine ? config.cylinderCount / 2 : config.cylinderCount;
  const bankAngleRad = isVEngine ? (config.layout === 'V6' ? Math.PI / 6 : Math.PI / 4) : 0; // 60 deg or 90 deg included

  // Scale based on bore/stroke
  const boreScale = config.boreMm / 85;
  const strokeScale = config.strokeMm / 85;
  const cylPitch = 0.22 * boreScale;
  const blockLength = cylPerBank * cylPitch + 0.25;
  const blockWidth = isVEngine ? 0.72 * boreScale : 0.42 * boreScale;
  const blockHeight = 0.52 * strokeScale;

  const blockMat = getMaterial(config.blockMaterial, true);
  const headMat = getMaterial(config.headMaterial, true);

  // 1. ENGINE BLOCK (Lower crankcase and cylinder banks)
  const blockGroup = new THREE.Group();
  blockGroup.name = 'engineBlock';
  movingParts.engineBlockGroup = blockGroup;

  // Crankcase base
  const crankcaseGeo = new THREE.BoxGeometry(blockWidth * 0.8, blockHeight * 0.55, blockLength);
  const crankcase = new THREE.Mesh(crankcaseGeo, blockMat);
  crankcase.name = 'blockBody';
  crankcase.position.set(0, 0.25, 0);
  crankcase.castShadow = true;
  blockGroup.add(crankcase);

  // Oil Pan (Sump)
  const sumpMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.5,
  });
  const sumpGeo = new THREE.BoxGeometry(blockWidth * 0.75, 0.16, blockLength * 0.9);
  const sump = new THREE.Mesh(sumpGeo, sumpMat);
  sump.position.set(0, 0.05, 0);
  sump.castShadow = true;
  blockGroup.add(sump);

  // 2. CYLINDER BANKS & BORES
  const headsGroup = new THREE.Group();
  headsGroup.name = 'headsGroup';
  movingParts.headsGroup = headsGroup;

  const valveCoverMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.valveCoverColor),
    roughness: 0.25,
    metalness: 0.6,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.08,
    metalness: 0.98,
  });

  // Piston material
  const pistonMat = new THREE.MeshStandardMaterial({
    color: config.pistons === 'race_titanium' ? 0x93c5fd : 0xd1d5db,
    roughness: 0.18,
    metalness: 0.92,
  });

  const numBanks = isVEngine ? 2 : 1;

  for (let b = 0; b < numBanks; b++) {
    const bankDir = isVEngine ? (b === 0 ? -1 : 1) : 0;
    const angle = bankDir * bankAngleRad;

    // Bank cylinder casting
    const bankGeo = new THREE.BoxGeometry(0.32 * boreScale, blockHeight * 0.85, blockLength);
    const bankMesh = new THREE.Mesh(bankGeo, blockMat);
    bankMesh.name = 'blockBody';
    bankMesh.rotation.z = angle;
    bankMesh.position.set(bankDir * 0.22, 0.45, 0);
    bankMesh.castShadow = true;
    blockGroup.add(bankMesh);

    // Valve Cover on top of bank
    const vcGeo = new THREE.BoxGeometry(0.34 * boreScale, 0.12, blockLength * 1.02);
    const vcMesh = new THREE.Mesh(vcGeo, valveCoverMat);
    vcMesh.rotation.z = angle;
    vcMesh.position.set(bankDir * (0.22 + Math.sin(angle) * 0.38), 0.45 + Math.cos(angle) * 0.38, 0);
    vcMesh.castShadow = true;
    headsGroup.add(vcMesh);

    // Ribbed detailing on valve cover
    for (let r = 0; r < 4; r++) {
      const ribGeo = new THREE.BoxGeometry(0.015, 0.02, blockLength * 0.85);
      const rib = new THREE.Mesh(ribGeo, chromeMat);
      rib.rotation.z = angle;
      rib.position.set(
        vcMesh.position.x + (r - 1.5) * 0.06 * Math.cos(angle),
        vcMesh.position.y - (r - 1.5) * 0.06 * Math.sin(angle) + 0.065,
        0
      );
      headsGroup.add(rib);
    }

    // Oil Filler Cap (on bank 0)
    if (b === 0) {
      const capGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(vcMesh.position.x + 0.05, vcMesh.position.y + 0.08, blockLength * 0.35);
      headsGroup.add(cap);
    }

    // Pistons & Connecting Rods for this bank
    for (let c = 0; c < cylPerBank; c++) {
      const zPos = (c - (cylPerBank - 1) / 2) * cylPitch;
      const pistonGroup = new THREE.Group();

      // Piston crown
      const pRadius = 0.09 * boreScale;
      const pGeo = new THREE.CylinderGeometry(pRadius, pRadius, 0.08, 20);
      const pMesh = new THREE.Mesh(pGeo, pistonMat);
      pistonGroup.add(pMesh);

      // Connecting rod
      const rodMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.85 });
      const rodGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.28, 12);
      const rodMesh = new THREE.Mesh(rodGeo, rodMat);
      rodMesh.position.y = -0.16;
      pistonGroup.add(rodMesh);

      pistonGroup.rotation.z = angle;
      const baseX = bankDir * 0.22;
      const baseY = 0.42;
      const baseZ = zPos;
      pistonGroup.position.set(baseX, baseY, baseZ);

      // Firing phase based on cylinder index & bank
      const phase = (c * Math.PI * 0.9) + (b * Math.PI * 0.5);
      headsGroup.add(pistonGroup);

      movingParts.pistons.push({
        mesh: pistonGroup,
        bankAngle: angle,
        phase,
        stroke: 0.14 * strokeScale,
        baseX,
        baseY,
        baseZ,
      });
    }
  }

  // 3. FRONT ACCESSORY DRIVE (Pulleys, Alternator & Serpentine Belt)
  const pulleyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.85,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.1,
  });

  const frontZ = blockLength / 2 + 0.04;

  // Crank Pulley (bottom center)
  const crankPulleyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24);
  const crankPulley = new THREE.Mesh(crankPulleyGeo, pulleyMat);
  crankPulley.rotation.x = Math.PI / 2;
  crankPulley.position.set(0, 0.28, frontZ);
  crankPulley.castShadow = true;
  blockGroup.add(crankPulley);
  movingParts.pulleys.push(crankPulley);

  // Alternator Pulley (top left)
  const altPulleyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.035, 20);
  const altPulley = new THREE.Mesh(altPulleyGeo, pulleyMat);
  altPulley.rotation.x = Math.PI / 2;
  altPulley.position.set(-0.35, 0.65, frontZ);
  altPulley.castShadow = true;
  blockGroup.add(altPulley);
  movingParts.pulleys.push(altPulley);

  // Alternator housing
  const altGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16);
  const altMesh = new THREE.Mesh(altGeo, headMat);
  altMesh.rotation.x = Math.PI / 2;
  altMesh.position.set(-0.35, 0.65, frontZ - 0.12);
  blockGroup.add(altMesh);

  // Water Pump / Tensioner Pulley (top right)
  const tensPulleyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.035, 20);
  const tensPulley = new THREE.Mesh(tensPulleyGeo, pulleyMat);
  tensPulley.rotation.x = Math.PI / 2;
  tensPulley.position.set(0.32, 0.58, frontZ);
  tensPulley.castShadow = true;
  blockGroup.add(tensPulley);
  movingParts.pulleys.push(tensPulley);

  // Serpentine Belt loop (Torus/Tubes)
  const beltGeo = new THREE.TorusGeometry(0.25, 0.015, 8, 32);
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.set(0, 0.48, frontZ);
  beltMesh.scale.set(1.4, 0.95, 1);
  blockGroup.add(beltMesh);

  // 4. REAR FLYWHEEL & CLUTCH BELLHOUSING
  const rearZ = -blockLength / 2 - 0.04;
  const flywheelMat = new THREE.MeshStandardMaterial({
    color: config.flywheelClutch === 'twin_disc_carbon' ? 0x1f2937 : 0x94a3b8,
    roughness: config.flywheelClutch === 'twin_disc_carbon' ? 0.7 : 0.25,
    metalness: config.flywheelClutch === 'twin_disc_carbon' ? 0.4 : 0.85,
  });
  const flywheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32);
  const flywheel = new THREE.Mesh(flywheelGeo, flywheelMat);
  flywheel.rotation.x = Math.PI / 2;
  flywheel.position.set(0, 0.48, rearZ);
  flywheel.castShadow = true;
  blockGroup.add(flywheel);

  // 5. INTAKE SYSTEM (ITB Velocity Stacks or High Flow MPI Plenum)
  const intakeGroup = new THREE.Group();
  intakeGroup.name = 'intakeGroup';
  movingParts.intakeGroup = intakeGroup;

  if (config.intake === 'itb_trumpets') {
    // Individual Throttle Bodies with Trumpet Velocity Stacks! (Automation Screenshot Style!)
    const trumpetMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.08,
      metalness: 0.95,
    });

    for (let b = 0; b < numBanks; b++) {
      const bankDir = isVEngine ? (b === 0 ? -1 : 1) : 0;
      for (let c = 0; c < cylPerBank; c++) {
        const zPos = (c - (cylPerBank - 1) / 2) * cylPitch;
        const trumpetGeo = new THREE.CylinderGeometry(0.065, 0.038, 0.16, 20);
        const trumpet = new THREE.Mesh(trumpetGeo, trumpetMat);
        trumpet.position.set(bankDir * 0.12, 0.88, zPos);
        trumpet.castShadow = true;
        intakeGroup.add(trumpet);

        // Flared bellmouth lip
        const lipGeo = new THREE.TorusGeometry(0.064, 0.008, 8, 20);
        const lip = new THREE.Mesh(lipGeo, trumpetMat);
        lip.rotation.x = Math.PI / 2;
        lip.position.set(trumpet.position.x, trumpet.position.y + 0.08, trumpet.position.z);
        intakeGroup.add(lip);
      }
    }
  } else {
    // Twin or Single Performance Plenum with Carbon or Polished Alloy
    const plenumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const plenumGeo = new THREE.BoxGeometry(0.36, 0.18, blockLength * 0.95);
    const plenum = new THREE.Mesh(plenumGeo, plenumMat);
    plenum.position.set(0, 0.82, 0);
    plenum.castShadow = true;
    intakeGroup.add(plenum);

    // Front Throttle Body
    const tbGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 20);
    const tb = new THREE.Mesh(tbGeo, chromeMat);
    tb.rotation.x = Math.PI / 2;
    tb.position.set(0, 0.82, blockLength * 0.52);
    intakeGroup.add(tb);
  }

  // 6. EXHAUST SYSTEM (Tuned Runner Headers & Merge Collectors!)
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'exhaustGroup';
  movingParts.exhaustGroup = exhaustGroup;

  const exhaustPipeMat = new THREE.MeshStandardMaterial({
    color: config.exhaust === 'titanium_straight' ? 0x60a5fa : 0xd1d5db,
    roughness: 0.22,
    metalness: 0.92,
    emissive: new THREE.Color(0x000000),
  });

  const headerSides = isVEngine ? [-1, 1] : [1];

  headerSides.forEach((side) => {
    const collectorZ = -blockLength * 0.45;
    for (let c = 0; c < cylPerBank; c++) {
      const startZ = (c - (cylPerBank - 1) / 2) * cylPitch;
      const startPoint = new THREE.Vector3(side * (blockWidth * 0.48), 0.55, startZ);
      const midPoint = new THREE.Vector3(side * (blockWidth * 0.75), 0.48, (startZ + collectorZ) * 0.5);
      const endPoint = new THREE.Vector3(side * (blockWidth * 0.65), 0.38, collectorZ);

      const curve = new THREE.CatmullRomCurve3([startPoint, midPoint, endPoint]);
      const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.032, 10, false);
      const tube = new THREE.Mesh(tubeGeo, exhaustPipeMat);
      tube.castShadow = true;
      exhaustGroup.add(tube);
      movingParts.exhaustMeshes.push(tube);
    }

    // Collector & Downpipe routed toward dyno exhaust duct
    const collectorGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.35, 16);
    const collector = new THREE.Mesh(collectorGeo, exhaustPipeMat);
    collector.rotation.x = Math.PI / 2.4;
    collector.position.set(side * (blockWidth * 0.65), 0.35, collectorZ - 0.2);
    exhaustGroup.add(collector);
    movingParts.exhaustMeshes.push(collector);

    // Flame burst mesh at collector outlet
    const flameGeo = new THREE.ConeGeometry(0.09, 0.3, 12);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = -Math.PI / 2;
    flameMesh.position.set(side * (blockWidth * 0.65), 0.32, collectorZ - 0.42);
    flameMesh.visible = false;
    exhaustGroup.add(flameMesh);
    movingParts.flamePuffs.push(flameMesh);
  });

  // 7. FORCED INDUCTION (Turbos or Supercharger)
  const turboGroup = new THREE.Group();
  turboGroup.name = 'turboGroup';
  movingParts.turboGroup = turboGroup;

  if (config.aspiration === 'single_turbo' || config.aspiration === 'twin_turbo') {
    const turboCount = config.aspiration === 'twin_turbo' ? 2 : 1;
    const turboSides = turboCount === 2 ? [-1, 1] : [1];

    turboSides.forEach((side) => {
      const turboSub = new THREE.Group();
      turboSub.position.set(side * (blockWidth * 0.8), 0.42, 0);

      // Exhaust Turbine Housing (Cast Iron Snail)
      const snailMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.6, metalness: 0.65 });
      const snailGeo = new THREE.TorusGeometry(0.12, 0.055, 12, 24);
      const snail = new THREE.Mesh(snailGeo, snailMat);
      turboSub.add(snail);

      // Compressor Housing (Polished Aluminum Snail)
      const compMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
      const compGeo = new THREE.TorusGeometry(0.13, 0.058, 12, 24);
      const comp = new THREE.Mesh(compGeo, compMat);
      comp.position.x = side * 0.08;
      turboSub.add(comp);

      // Compressor inlet snout
      const inletGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 16);
      const inlet = new THREE.Mesh(inletGeo, compMat);
      inlet.rotation.z = Math.PI / 2;
      inlet.position.set(side * 0.15, 0, 0);
      turboSub.add(inlet);

      // Wastegate actuator canister
      const wgMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.8 });
      const wgGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.09, 12);
      const wg = new THREE.Mesh(wgGeo, wgMat);
      wg.position.set(0, 0.16, 0.08);
      turboSub.add(wg);

      turboGroup.add(turboSub);
    });
  } else if (config.aspiration === 'supercharger') {
    // Roots / Screw Supercharger sitting proudly atop the engine valley
    const scMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.25,
      metalness: 0.9,
    });
    const scGeo = new THREE.BoxGeometry(0.42, 0.24, blockLength * 0.8);
    const scMesh = new THREE.Mesh(scGeo, scMat);
    scMesh.position.set(0, 0.88, 0);
    scMesh.castShadow = true;
    turboGroup.add(scMesh);

    // Front drive snout & pulley
    const snoutGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.25, 16);
    const snout = new THREE.Mesh(snoutGeo, chromeMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.88, blockLength * 0.45);
    turboGroup.add(snout);

    const scPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 20), pulleyMat);
    scPulley.rotation.x = Math.PI / 2;
    scPulley.position.set(0, 0.88, blockLength * 0.58);
    turboGroup.add(scPulley);
    movingParts.pulleys.push(scPulley);
  }

  // Assemble hierarchy
  root.add(blockGroup);
  root.add(headsGroup);
  root.add(intakeGroup);
  root.add(exhaustGroup);
  root.add(turboGroup);

  scene.add(root);
}
