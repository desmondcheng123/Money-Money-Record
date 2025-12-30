import React, { useRef, useState } from 'react';
import { Asset, AssetGroup, Transaction, User } from '../types';
import { 
  Globe, 
  Moon, 
  Sun, 
  FileUp, 
  Download, 
  ChevronRight,
  RefreshCcw,
  LogOut,
  Lock,
  Database,
  CloudLightning,
  AlertCircle,
  Cloud,
  CheckCircle2,
  X,
  Mail,
  Fingerprint
} from 'lucide-react';

interface SettingsProps {
  currency: 'USD' | 'MYR';
  setCurrency: (c: 'USD' | 'MYR') => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  onResetData: () => void;
  assets: Asset[];
  transactions: Transaction[];
  groups: AssetGroup[];
  currentUser: User;
  onLogout: () => void;
  syncState: 'IDLE' | 'SAVING' | 'ERROR';
  onRefresh: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  currency, setCurrency, isDarkMode, setIsDarkMode, onResetData, assets, transactions, groups, currentUser, onLogout, syncState, onRefresh
}) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  const handleExport = () => {
    const data = { assets, groups, transactions, currency, user: currentUser, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money-money-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, variant = 'default' }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-3xl border shadow-sm mb-3 active:scale-[0.99] transition-all ${
        variant === 'danger' 
          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
          <Icon size={18} />
        </div>
        <span className={`font-semibold ${variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className={`text-sm font-medium ${variant === 'danger' ? 'text-rose-600' : 'text-indigo-600'}`}>{value}</span>}
        {variant !== 'danger' && <ChevronRight size={16} className="text-slate-300" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pb-12">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20">{currentUser.name[0].toUpperCase()}</div>
           <div>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncState === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {syncState === 'ERROR' ? 'Sync Error' : 'Cloud Connected'}
                </p>
              </div>
           </div>
        </div>
        <button onClick={onLogout} className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
           <LogOut size={20} />
        </button>
      </div>

      {/* Cloud Diagnostic Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sync Diagnostics</h3>
           <button onClick={onRefresh} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
              <RefreshCcw size={14} className={syncState === 'SAVING' ? 'animate-spin' : ''} />
           </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] py-2 border-b border-slate-50 dark:border-slate-800">
             <span className="text-slate-400 font-bold uppercase">Account Link</span>
             <span className="text-slate-800 dark:text-slate-200 font-mono truncate max-w-[150px]">{currentUser.id}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] py-2 border-b border-slate-50 dark:border-slate-800">
             <span className="text-slate-400 font-bold uppercase">Sync Mode</span>
             <span className="text-emerald-500 font-black uppercase flex items-center">
                <CloudLightning size={10} className="mr-1" /> FULL CLOUD SYNC
             </span>
          </div>
          <div className="flex items-center justify-between text-[11px] py-2">
             <span className="text-slate-400 font-bold uppercase">Status</span>
             <span className={syncState === 'ERROR' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                {syncState === 'SAVING' ? 'Syncing...' : syncState === 'ERROR' ? 'Disconnected' : 'Online & Current'}
             </span>
          </div>
        </div>

        <button 
          onClick={onRefresh}
          className="w-full mt-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
        >
          Force Pull from Cloud
        </button>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Preferences</p>
        <SettingItem icon={Globe} label="Currency" value={currency} onClick={() => setCurrency(currency === 'USD' ? 'MYR' : 'USD')} />
        <SettingItem icon={isDarkMode ? Moon : Sun} label="Appearance" value={isDarkMode ? 'Dark' : 'Light'} onClick={() => setIsDarkMode(!isDarkMode)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Security & Data</p>
        <SettingItem icon={Download} label="Export JSON Backup" value="Local .json" onClick={handleExport} />
        <SettingItem icon={Lock} label="Cloud Privacy FAQ" onClick={() => setShowPrivacyNotice(true)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Danger Zone</p>
        <SettingItem icon={RefreshCcw} label="Factory Reset Cloud" variant="danger" onClick={onResetData} />
      </section>

      {showPrivacyNotice && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowPrivacyNotice(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <Lock size={40} className="text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-4">Cloud Security</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">Your data is synced via Supabase. If you log in on Browser B with the same email, it should immediately fetch your Cloud vault.</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase mb-2">Diagnostic Tips</p>
                <ul className="text-[10px] space-y-2 list-disc pl-4 text-slate-500">
                  <li>Ensure both devices show "Cloud Active" on login.</li>
                  <li>Use the "Force Pull" button if data feels stale.</li>
                  <li>Real-time sync pushes updates instantly across tabs.</li>
                </ul>
            </div>
            <button onClick={() => setShowPrivacyNotice(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Close</button>
          </div>
        </div>
      )}

      <div className="p-8 text-center opacity-30">
        <h3 className="font-black text-2xl italic text-slate-900 dark:text-white uppercase tracking-tighter">Money Money Record</h3>
        <p className="text-xs font-medium">Built for Long-Term Value.</p>
      </div>
    </div>
  );
};