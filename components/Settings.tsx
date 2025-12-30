import React, { useRef } from 'react';
import { User } from '../types';
import { Download, ChevronRight, RefreshCcw, Lock, ShieldCheck, FileJson, Upload, Trash2 } from 'lucide-react';

interface SettingsProps {
  onResetData: () => void;
  currentUser: User;
  onImportVault: (data: any) => void;
  onExportVault: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onResetData, currentUser, onImportVault, onExportVault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (window.confirm("Import this vault file? It will replace all your current data.")) {
            onImportVault(json);
          }
        } catch (err) {
          alert("Invalid vault file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, variant = 'default' }: any) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-3xl border shadow-sm mb-3 active:scale-[0.99] transition-all ${variant === 'danger' ? 'bg-rose-950/20 border-rose-900/50' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-rose-900/30 text-rose-500' : 'bg-slate-800 text-slate-400'}`}><Icon size={18} /></div>
        <span className={`font-semibold ${variant === 'danger' ? 'text-rose-500' : 'text-slate-100'}`}>{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className="text-sm font-medium text-indigo-400">{value}</span>}
        <ChevronRight size={16} className="text-slate-600" />
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pb-12">
      <div className="flex items-center space-x-3 px-1">
         <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 text-xl">{currentUser.name[0].toUpperCase()}</div>
         <div>
            <h2 className="text-2xl font-bold">{currentUser.name}'s Vault</h2>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local Mode Active</p>
            </div>
         </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <FileJson size={80} />
        </div>
        <div className="flex items-center space-x-2 mb-4">
           <ShieldCheck size={18} className="text-indigo-400" />
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Security & Backup</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">This app stores data on your device. Export a <b>.money</b> file regularly to keep your backups safe.</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onExportVault} className="flex items-center justify-center space-x-2 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700">
             <Download size={14} />
             <span>Save Vault</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-600/20">
             <Upload size={14} />
             <span>Open Vault</span>
          </button>
          <input type="file" accept=".money,.json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-3">System</p>
        <SettingItem icon={Trash2} label="Factory Reset" variant="danger" onClick={onResetData} />
        <SettingItem icon={Lock} label="Security Info" onClick={() => alert("Your data never leaves this device. All records are stored locally in your browser's private storage.")} />
      </section>

      <div className="text-center pt-8">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Money Record v1.6.0-local</p>
      </div>
    </div>
  );
};