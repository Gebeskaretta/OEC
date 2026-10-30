import React, { useState } from 'react';
import { EngineConfig, CylinderLayout, MaterialType, HeadType, CrankshaftType, PistonType, IntakeType, AspirationType, ExhaustType, TransmissionType, FlywheelClutchType } from '../types/engine';
import { 
  Layers, 
  Settings, 
  Disc, 
  Wind, 
  Flame, 
  Gauge, 
  Zap, 
  Sliders, 
  Palette, 
  ChevronRight,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';

interface CategoryPanelProps {
  config: EngineConfig;
  onChange: (updated: EngineConfig) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
  config,
  onChange,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<string>('block');

  const update = (partial: Partial<EngineConfig>) => {
    onChange({ ...config, ...partial });
  };

  const categories = [
    { id: 'block', name: 'Motor Bloğu', icon: Layers },
    { id: 'heads', name: 'Silindir Kapağı & Valfler', icon: Settings },
    { id: 'crank', name: 'Krank Mili', icon: Disc },
    { id: 'pistons', name: 'Pistonlar & Kollar', icon: Sliders },
    { id: 'intake', name: 'Emme Sistemi', icon: Wind },
    { id: 'aspiration', name: 'Turbo / Supercharger', icon: Zap },
    { id: 'exhaust', name: 'Egzoz Sistemi', icon: Flame },
    { id: 'cam_rev', name: 'Eksantrik & Devir Limiti', icon: Gauge },
    { id: 'transmission', name: 'Şanzıman', icon: Disc },
    { id: 'flywheel_clutch', name: 'Volan & Debriyaj', icon: Disc },
    { id: 'appearance', name: 'Görünüm & Boya', icon: Palette },
  ];

  const cylinderLayouts: { id: CylinderLayout; label: string; cyls: number }[] = [
    { id: 'I4', label: 'Sıralı 4 (I4)', cyls: 4 },
    { id: 'I6', label: 'Sıralı 6 (I6)', cyls: 6 },
    { id: 'V6', label: 'V6 60°', cyls: 6 },
    { id: 'V8', label: 'V8 90°', cyls: 8 },
    { id: 'V10', label: 'V10 90°', cyls: 10 },
    { id: 'V12', label: 'V12 60°', cyls: 12 },
  ];

  const materials: { id: MaterialType; label: string; desc: string }[] = [
    { id: 'cast_iron', label: 'Döküm Demir', desc: 'Ağır, aşırı sağlam ve ekonomik.' },
    { id: 'aluminium', label: 'Alüminyum Alaşım', desc: 'Hafif, dengeli ve standart performans.' },
    { id: 'alsi', label: 'AlSi (Alüminyum-Silisyum)', desc: 'Yüksek ısı transferi ve dayanıklılık.' },
    { id: 'magnesium', label: 'Magnezyum', desc: 'Ultra hafif fakat yüksek maliyetli.' },
    { id: 'titanium', label: 'Titanyum', desc: 'Havacılık sınıfı hafiflik ve ekstrem güç.' },
  ];

  return (
    <div className={`fixed top-12 bottom-16 left-3 z-30 transition-all duration-300 flex ${isOpen ? 'w-80 sm:w-96' : 'w-12'}`}>
      {/* Side Main Tabs Strip */}
      <div className="w-12 bg-[#0e1117] border-y border-l border-slate-800 rounded-l-lg flex flex-col items-center py-2 gap-1.5 shadow-2xl">
        <button
          onClick={onToggleOpen}
          className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800/60 mb-2 border-b border-slate-800"
          title={isOpen ? 'Menüyü Gizle' : 'Menüyü Aç'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  if (!isOpen) onToggleOpen();
                }}
                className={`w-9 h-9 rounded flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Category Submenu & Controls */}
      {isOpen && (
        <div className="flex-1 bg-[#12161f]/95 border border-slate-800 rounded-r-lg shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-[#171c26] flex items-center justify-between">
            <span className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-2">
              {categories.find((c) => c.id === activeTab)?.name}
            </span>
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
              {config.layout} {config.cylinderCount} Silindir
            </span>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs text-slate-200">
            {/* 1. MOTOR BLOĞU */}
            {activeTab === 'block' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Silindir Düzeni & Konfigürasyon
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {cylinderLayouts.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => update({ layout: l.id, cylinderCount: l.cyls })}
                        className={`px-2.5 py-2 rounded text-left border transition-all ${
                          config.layout === l.id
                            ? 'bg-rose-950/60 border-rose-600 text-rose-200 font-medium'
                            : 'bg-[#181e2b] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs">{l.label}</div>
                        <div className="text-[10px] text-slate-400">{l.cyls} Silindir</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Blok Malzemesi
                  </label>
                  <div className="space-y-1.5">
                    {materials.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => update({ blockMaterial: m.id })}
                        className={`w-full px-2.5 py-1.5 rounded text-left border flex items-center justify-between transition-all ${
                          config.blockMaterial === m.id
                            ? 'bg-rose-950/60 border-rose-600 text-white'
                            : 'bg-[#181e2b] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{m.label}</div>
                          <div className="text-[10px] text-slate-400">{m.desc}</div>
                        </div>
                        {config.blockMaterial === m.id && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bore & Stroke */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Silindir Çapı (Bore)</span>
                      <span className="font-mono text-sky-400 font-semibold">{config.boreMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={105}
                      value={config.boreMm}
                      onChange={(e) => update({ boreMm: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Piston Stroku (Stroke)</span>
                      <span className="font-mono text-sky-400 font-semibold">{config.strokeMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={55}
                      max={110}
                      value={config.strokeMm}
                      onChange={(e) => update({ strokeMm: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SİLİNDİR KAPAĞI */}
            {activeTab === 'heads' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Silindir Kapağı Mekanizması
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'pushrod' as HeadType, title: 'Pushrod (İtici Kollu OHV)', desc: 'Klasik Amerikan tasarımı, düşük devirde yüksek tork.' },
                      { id: 'sohc' as HeadType, title: 'SOHC (Üstten Tek Eksantrik)', desc: 'Ekonomik ve güvenilir valf kontrolü.' },
                      { id: 'dohc' as HeadType, title: 'DOHC (Üstten Çift Eksantrik)', desc: 'Yüksek devir hava akışı ve maksimum beygir gücü.' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        onClick={() => update({ headType: h.id })}
                        className={`w-full px-2.5 py-1.5 rounded text-left border ${
                          config.headType === h.id
                            ? 'bg-rose-950/60 border-rose-600 text-white'
                            : 'bg-[#181e2b] border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-xs">{h.title}</div>
                        <div className="text-[10px] text-slate-400">{h.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Silindir Başına Valf Sayısı
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => update({ valvesPerCylinder: v as 2 | 4 | 5 })}
                        className={`py-2 text-center rounded border font-mono font-semibold ${
                          config.valvesPerCylinder === v
                            ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                            : 'bg-[#181e2b] border-slate-800 text-slate-400'
                        }`}
                      >
                        {v} Valf
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Kapak Malzemesi
                  </label>
                  <div className="space-y-1.5">
                    {materials.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => update({ headMaterial: m.id })}
                        className={`w-full px-2.5 py-1.5 rounded text-left border flex items-center justify-between ${
                          config.headMaterial === m.id
                            ? 'bg-rose-950/60 border-rose-600 text-white'
                            : 'bg-[#181e2b] border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold text-xs">{m.label}</span>
                        {config.headMaterial === m.id && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. KRANK MİLİ */}
            {activeTab === 'crank' && (
              <div className="space-y-2">
                {[
                  { id: 'cast' as CrankshaftType, name: 'Döküm Krank Mili', limit: '380 Nm Tork Limiti', desc: 'Standart üretim araçları için uygun, ucuz.' },
                  { id: 'forged_steel' as CrankshaftType, name: 'Dövme Çelik Krank', limit: '750 Nm Tork Limiti', desc: 'Spor ve modifiye motorlar için yüksek mukavemet.' },
                  { id: 'billet_steel' as CrankshaftType, name: 'Kütük (Billet) Çelik Krank', limit: '1200 Nm Tork Limiti', desc: 'CNC işlenmiş, drag ve pist yarışları için en yüksek tokluk.' },
                  { id: 'lightweight_titanium' as CrankshaftType, name: 'Hafifletilmiş Titanyum Krank', limit: '1600 Nm Tork Limiti', desc: 'Ultra hızlı devir tırmanışı ve sıfır atalet.' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update({ crankshaft: c.id })}
                    className={`w-full px-3 py-2 rounded text-left border transition-all ${
                      config.crankshaft === c.id
                        ? 'bg-rose-950/60 border-rose-600 text-white'
                        : 'bg-[#181e2b] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-xs">{c.name}</span>
                      <span className="text-[10px] font-mono text-amber-400">{c.limit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 4. PİSTONLAR VE KOLLAR */}
            {activeTab === 'pistons' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {[
                    { id: 'cast' as PistonType, name: 'Standart Döküm Pistonlar', limit: '19.5 m/s Piston Hızı', desc: 'Düşük maliyetli. Yüksek turbo basıncında kırılma riski.' },
                    { id: 'forged_alu' as PistonType, name: 'Dövme Alüminyum Piston', limit: '23.5 m/s Piston Hızı', desc: 'Yüksek basınca ve 1.5 bar turboya dayanıklı.' },
                    { id: 'heavy_duty_forged' as PistonType, name: 'Ağır Hizmet Dövme Piston', limit: '26.5 m/s Piston Hızı', desc: '2.5 bar turbo ve aşırı tork yükleri için güçlendirilmiş etek.' },
                    { id: 'race_titanium' as PistonType, name: 'Titanyum Yarış Pistonları', limit: '30.0 m/s Piston Hızı', desc: '10.000+ RPM limitine ulaşabilen tüy kadar hafif yarış parçası.' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => update({ pistons: p.id })}
                      className={`w-full px-3 py-2 rounded text-left border transition-all ${
                        config.pistons === p.id
                          ? 'bg-rose-950/60 border-rose-600 text-white'
                          : 'bg-[#181e2b] border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-xs">{p.name}</span>
                        <span className="text-[10px] font-mono text-sky-400">{p.limit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Sıkıştırma Oranı</span>
                    <span className="font-mono text-rose-400 font-semibold">{config.compressionRatio.toFixed(1)}:1</span>
                  </div>
                  <input
                    type="range"
                    min={7.5}
                    max={14.0}
                    step={0.1}
                    value={config.compressionRatio}
                    onChange={(e) => update({ compressionRatio: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>7.5:1 (Turbo Güvenli)</span>
                    <span>14.0:1 (Yüksek Sıkıştırma NA)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. EMME SİSTEMİ */}
            {activeTab === 'intake' && (
              <div className="space-y-2">
                {[
                  { id: 'carburetor' as IntakeType, name: 'Klasik Karbüratör', desc: 'Mekanik yakıt karışımı, nostaljik hava girişi sesi.' },
                  { id: 'standard_efi' as IntakeType, name: 'Standart EFI (Elektronik Enjeksiyon)', desc: 'Ekonomik tek/çok nokta yakıt püskürtme.' },
                  { id: 'perf_mpi' as IntakeType, name: 'Performans Emme Manifoldu (MPI)', desc: 'Büyük hacimli plenum ve akış optimize edilmiş runner boruları.' },
                  { id: 'itb_trumpets' as IntakeType, name: 'Bireysel Kelebekler (ITB Trumpets)', desc: 'Her silindire özel krom trompet hava hunisi, anında gaz tepkisi!' },
                ].map((i) => (
                  <button
                    key={i.id}
                    onClick={() => update({ intake: i.id })}
                    className={`w-full px-3 py-2 rounded text-left border transition-all ${
                      config.intake === i.id
                        ? 'bg-rose-950/60 border-rose-600 text-white'
                        : 'bg-[#181e2b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{i.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{i.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 6. TURBO / SUPERCHARGER */}
            {activeTab === 'aspiration' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    { id: 'na' as AspirationType, name: 'Atmosferik (NA)', desc: 'Doğal emişli, turbo gecikmesi yok, saf motor sesi.' },
                    { id: 'single_turbo' as AspirationType, name: 'Tek Turboşarj', desc: 'Büyük güç artışı, orta ve üst devirlerde tepe itiş gücü.' },
                    { id: 'twin_turbo' as AspirationType, name: 'Çift Turbo (Biturbo)', desc: 'Daha hızlı dolum (spool), geniş tork bandı.' },
                    { id: 'supercharger' as AspirationType, name: 'Mekanik Supercharger (Kompresör)', desc: 'Kranktan kayış tahrikli, rölantiden itibaren anında tam tork.' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => update({ aspiration: a.id, boostBar: a.id === 'na' ? 0 : Math.max(0.6, config.boostBar) })}
                      className={`w-full px-3 py-2 rounded text-left border ${
                        config.aspiration === a.id
                          ? 'bg-rose-950/60 border-rose-600 text-white'
                          : 'bg-[#181e2b] border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{a.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{a.desc}</div>
                    </button>
                  ))}
                </div>

                {config.aspiration !== 'na' && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Turbo / Kompresör Basıncı</span>
                      <span className="font-mono text-sky-400 font-semibold">{config.boostBar.toFixed(2)} Bar</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2.8}
                      step={0.05}
                      value={config.boostBar}
                      onChange={(e) => update({ boostBar: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span>0.20 Bar (Düşük)</span>
                      <span>2.80 Bar (Yarış Basıncı)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. EGZOZ SİSTEMİ */}
            {activeTab === 'exhaust' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    { id: 'cast_manifold' as ExhaustType, name: 'Döküm Egzoz Manifoldu', desc: 'Fabrika çıkış standart sessiz ve kısıtlayıcı egzoz.' },
                    { id: 'stainless_headers' as ExhaustType, name: 'Paslanmaz Çelik Headers', desc: 'Eşit boy borulu, geri basıncı düşüren performans boruları.' },
                    { id: 'long_tube_headers' as ExhaustType, name: 'Uzun Borulu (Long Tube) Headers', desc: 'Maksimum tork tahliyesi ve derin bas kükremesi.' },
                    { id: 'titanium_straight' as ExhaustType, name: 'Titanyum Düz Boru (Straight Pipe)', desc: 'Aşırı hafif, yüksek devirde kızaran agresif yarış egzozu.' },
                  ].map((e) => (
                    <button
                      key={e.id}
                      onClick={() => update({ exhaust: e.id })}
                      className={`w-full px-3 py-2 rounded text-left border ${
                        config.exhaust === e.id
                          ? 'bg-rose-950/60 border-rose-600 text-white'
                          : 'bg-[#181e2b] border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{e.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{e.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Egzoz Boru Çapı</span>
                    <span className="font-mono text-sky-400 font-semibold">{config.exhaustDiameterMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={90}
                    value={config.exhaustDiameterMm}
                    onChange={(e) => update({ exhaustDiameterMm: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* 8. EKSANTRİK & DEVİR LİMİTİ */}
            {activeTab === 'cam_rev' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Eksantrik Mili Profili (Cam Profile)</span>
                    <span className="font-mono text-rose-400 font-semibold">%{config.camProfile}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.camProfile}
                    onChange={(e) => update({ camProfile: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>%0 (Ekonomik / Sakin Rölanti)</span>
                    <span>%100 (Agresif Yarış / Dalgalı Rölanti)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Devir Kesici (Rev Limiter)</span>
                    <span className="font-mono text-rose-400 font-semibold">{config.revLimiterRpm} RPM</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={10000}
                    step={100}
                    value={config.revLimiterRpm}
                    onChange={(e) => update({ revLimiterRpm: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>5000 RPM</span>
                    <span>10000 RPM (F1 Seviyesi)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 9. ŞANZIMAN */}
            {activeTab === 'transmission' && (
              <div className="space-y-2">
                {[
                  { id: 'manual_5' as TransmissionType, name: '5-İleri Manuel Şanzıman', desc: 'Klasik H-vites mekanizması, hafif ve yalın.' },
                  { id: 'manual_6' as TransmissionType, name: '6-İleri Spor Manuel', desc: 'Yakın oranlı dişli grubu, yüksek son hız.' },
                  { id: 'sequential_6' as TransmissionType, name: '6-İleri Sıralı (Sequential)', desc: 'Debriyajsız anında vites geçişi, ralli ve pist standardı.' },
                  { id: 'dual_clutch_7' as TransmissionType, name: '7-İleri Çift Kavrama (DCT)', desc: 'Milisaniyelik çift debriyajlı vites geçişi ve maksimum ivmelenme.' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => update({ transmission: t.id })}
                    className={`w-full px-3 py-2 rounded text-left border ${
                      config.transmission === t.id
                        ? 'bg-rose-950/60 border-rose-600 text-white'
                        : 'bg-[#181e2b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 10. VOLAN & DEBRİYAJ */}
            {activeTab === 'flywheel_clutch' && (
              <div className="space-y-2">
                {[
                  { id: 'heavy_cast' as FlywheelClutchType, name: 'Ağır Döküm Volan & Organik Baskı', desc: 'Yüksek atalet, pürüzsüz rölanti, kalkışlarda stop etmesi zor.' },
                  { id: 'lightweight_steel' as FlywheelClutchType, name: 'Hafifletilmiş Çelik Volan & Seramik Disk', desc: 'Hızlı devirlenme, sert kavrama, spor sürüş için ideal.' },
                  { id: 'twin_disc_carbon' as FlywheelClutchType, name: 'Çift Disk Karbon Volan & Debriyaj', desc: 'Sıfır kaydırma, 1500+ Nm tork dayanımı ve yarış hissi.' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => update({ flywheelClutch: f.id })}
                    className={`w-full px-3 py-2 rounded text-left border ${
                      config.flywheelClutch === f.id
                        ? 'bg-rose-950/60 border-rose-600 text-white'
                        : 'bg-[#181e2b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{f.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* 11. GÖRÜNÜM & BOYA */}
            {activeTab === 'appearance' && (
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Külbütör / Silindir Kapağı Rengi (Valve Cover)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: '#dc2626', name: 'Kırmızı' },
                    { color: '#2563eb', name: 'Mavi' },
                    { color: '#16a34a', name: 'Yeşil' },
                    { color: '#ca8a04', name: 'Altın' },
                    { color: '#9333ea', name: 'Mor' },
                    { color: '#ea580c', name: 'Turuncu' },
                    { color: '#0f172a', name: 'Gece Siyahı' },
                    { color: '#e2e8f0', name: 'Krom / Gümüş' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => update({ valveCoverColor: c.color })}
                      className={`h-9 rounded-md border flex items-center justify-center transition-all ${
                        config.valveCoverColor === c.color ? 'ring-2 ring-white scale-105' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
