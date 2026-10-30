import React, { useState, useEffect } from 'react';
import { EngineConfig, EnginePreset } from '../types/engine';
import { PRESET_ENGINES } from '../services/enginePhysics';
import { X, Save, Trash2, Download, Upload, Check, Sparkles, Folder } from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: EngineConfig;
  onLoadConfig: (config: EngineConfig) => void;
}

const STORAGE_KEY = 'otomachine_saved_engines_v1';

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onLoadConfig,
}) => {
  const [savedEngines, setSavedEngines] = useState<EngineConfig[]>([]);
  const [customName, setCustomName] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedEngines(JSON.parse(data));
      }
    } catch {
      // LocalStorage fallback
    }
  }, [isOpen]);

  const saveCurrentEngine = () => {
    if (!customName.trim()) return;
    const newEntry: EngineConfig = {
      ...currentConfig,
      id: `engine_${Date.now()}`,
      name: customName.trim(),
    };
    const updated = [newEntry, ...savedEngines];
    setSavedEngines(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setCustomName('');
  };

  const deleteEngine = (id: string) => {
    const updated = savedEngines.filter((e) => e.id !== id);
    setSavedEngines(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentConfig.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.layout && parsed.cylinderCount) {
          onLoadConfig(parsed);
          onClose();
        }
      } catch {
        alert('Geçersiz motor konfigürasyon dosyası.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121620] border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#161b26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-base text-white tracking-wide">GARAGE / MOTORLARIM</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Save Current Engine Section */}
          <div className="bg-[#181e2b] border border-slate-800 rounded-lg p-3.5 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
              Mevcut Motoru Garaja Kaydet
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Örn: 3.5L Twin-Turbo Canavar"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 bg-[#0f131a] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={saveCurrentEngine}
                disabled={!customName.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>

          {/* Preset Factory Templates */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hazır Fabrika & Yarış Şablonları</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ENGINES.map((preset) => (
                <div
                  key={preset.name}
                  className="bg-[#181e2b] border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-100">{preset.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      onLoadConfig(preset.config);
                      onClose();
                    }}
                    className="mt-2.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
                  >
                    Bu Şablonu Yükle
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Saved Engines List */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
              Kayıtlı Motor Profileriniz ({savedEngines.length})
            </span>
            {savedEngines.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-[#161a22] rounded-lg border border-slate-800">
                Henüz kayıtlı özel bir motorunuz yok. Yukarıdaki formdan kaydedebilirsiniz.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedEngines.map((engine) => (
                  <div
                    key={engine.id}
                    className="bg-[#181e2b] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">{engine.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {engine.layout} · {engine.cylinderCount} Silindir · {engine.boreMm}x{engine.strokeMm} mm · {engine.aspiration.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onLoadConfig(engine);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                      >
                        Yükle
                      </button>
                      <button
                        onClick={() => deleteEngine(engine.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export / Import JSON */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-[#1e2533] hover:bg-[#252e3f] text-slate-300 rounded border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON Olarak İndir</span>
              </button>

              <label className="px-3 py-1.5 bg-[#1e2533] hover:bg-[#252e3f] text-slate-300 rounded border border-slate-700 flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>JSON İçe Aktar</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
