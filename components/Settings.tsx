
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
  Fingerprint,
  CloudOff,
  Key,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck
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
  isCloudActive: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ 
  currency, setCurrency, isDarkMode, setIsDarkMode, onResetData, assets, transactions, groups, currentUser, onLogout, syncState, onRefresh, isCloudActive
}) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showCloudWizard, setShowCloudWizard] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [revealKeys, setRevealKeys] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const savedUrl = localStorage.getItem('MANUAL_VITE_SUPABASE_URL') || '';
  const savedKey = localStorage.getItem('MANUAL_VITE_SUPABASE_ANON_KEY') || '';

  const handleExport = () => {
    const data = { assets, groups, transactions, currency, user: currentUser, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money-record-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('MANUAL_VITE_SUPABASE_URL', manualUrl.trim());
    localStorage.setItem('MANUAL_VITE_SUPABASE_ANON_KEY', manualKey.trim());
    window.location.reload();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, variant = 'default' }: any) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-3xl border shadow-sm mb-3 active:scale-[0.99] transition-all ${variant === 'danger' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}><Icon size={18} /></div>
        <span className={`font-semibold ${variant === 'danger' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className={`text-sm font-medium ${variant === 'danger' ? 'text-rose-600' : 'text-indigo-600'}`}>{value}</span>}
        <ChevronRight size={16} className="text-slate-300" />
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
                <div className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isCloudActive ? 'Sync Active' : 'Local Only'}
                </p>
              </div>
           </div>
        </div>
        <button onClick={onLogout} className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors"><LogOut size={20} /></button>
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cloud Status</h3>
           <button onClick={onRefresh} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
              <RefreshCcw size={14} className={syncState === 'SAVING' ? 'animate-spin' : ''} />
           </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] py-2 border-b border-slate-50 dark:border-slate-800">
             <span className="text-slate-400 font-bold uppercase">Vault Identity</span>
             <span className="text-slate-800 dark:text-slate-200 font-mono truncate max-w-[150px]">{currentUser.id}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] py-2">
             <span className="text-slate-400 font-bold uppercase">Cloud Mode</span>
             <span className={isCloudActive ? 'text-emerald-500 font-black flex items-center' : 'text-amber-500 font-black'}>
                {isCloudActive ? <CloudLightning size={10} className="mr-1" /> : <CloudOff size={10} className="mr-1" />}
                {isCloudActive ? 'CONNECTED' : 'DISCONNECTED'}
             </span>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button onClick={() => setShowCloudWizard(true)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
            {isCloudActive ? 'Update Keys' : 'Setup Cloud'}
          </button>
          {isCloudActive && (savedUrl || savedKey) && (
            <button onClick={() => setShowCredentials(true)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl active:scale-95 transition-all border border-slate-200 dark:border-slate-700">
               <Key size={18} />
            </button>
          )}
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Preferences</p>
        <SettingItem icon={Globe} label="Currency" value={currency} onClick={() => setCurrency(currency === 'USD' ? 'MYR' : 'USD')} />
        <SettingItem icon={isDarkMode ? Moon : Sun} label="Appearance" value={isDarkMode ? 'Dark' : 'Light'} onClick={() => setIsDarkMode(!isDarkMode)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Security & Backup</p>
        <SettingItem icon={Download} label="Export JSON Backup" value="Offline" onClick={handleExport} />
        <SettingItem icon={Lock} label="Security FAQ" onClick={() => setShowPrivacyNotice(true)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">System</p>
        <SettingItem icon={RefreshCcw} label="Factory Reset" variant="danger" onClick={onResetData} />
      </section>

      {/* Manual Cloud Wizard Modal */}
      {showCloudWizard && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300">
              <button onClick={() => setShowCloudWizard(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold mb-1">Cloud Link Setup</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">Enter Supabase keys below</p>
              
              <form onSubmit={handleManualSave} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supabase Project URL</label>
                    <input required placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500" value={manualUrl} onChange={e => setManualUrl(e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Anon API Key</label>
                    <textarea required rows={3} placeholder="eyJ..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-[9px] font-mono leading-tight resize-none outline-none focus:ring-2 focus:ring-indigo-500" value={manualKey} onChange={e => setManualKey(e.target.value)} />
                 </div>
                 <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Save & Link Cloud</button>
              </form>
           </div>
        </div>
      )}

      {/* Credentials Viewer Modal */}
      {showCredentials && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300">
              <button onClick={() => setShowCredentials(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-1">Vault Keys</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 leading-relaxed">Copy these to your other devices to sync data</p>
              
              <div className="space-y-5">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Project URL</span>
                       <button onClick={() => copyToClipboard(savedUrl, 'URL')} className="text-indigo-500 text-[10px] font-bold uppercase flex items-center">
                          <Copy size={10} className="mr-1" /> {copyFeedback === 'URL' ? 'Copied!' : 'Copy'}
                       </button>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-[10px] break-all border border-slate-100 dark:border-slate-700">
                       {savedUrl}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Anon API Key</span>
                       <div className="flex space-x-3">
                          <button onClick={() => setRevealKeys(!revealKeys)} className="text-slate-400 text-[10px] font-bold uppercase flex items-center">
                             {revealKeys ? <EyeOff size={10} className="mr-1" /> : <Eye size={10} className="mr-1" />} {revealKeys ? 'Hide' : 'Reveal'}
                          </button>
                          <button onClick={() => copyToClipboard(savedKey, 'Key')} className="text-indigo-500 text-[10px] font-bold uppercase flex items-center">
                             <Copy size={10} className="mr-1" /> {copyFeedback === 'Key' ? 'Copied!' : 'Copy'}
                          </button>
                       </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-[10px] break-all border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                       <span className={revealKeys ? '' : 'blur-[3px] select-none'}>{savedKey}</span>
                       {!revealKeys && (
                         <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 dark:bg-slate-800/20">
                            <Lock size={14} className="text-slate-300" />
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                 <p className="text-[9px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                   <b>Note:</b> These keys are required to connect a new browser to your existing data. Store them in a safe place.
                 </p>
              </div>
           </div>
        </div>
      )}

      {showPrivacyNotice && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowPrivacyNotice(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <Lock size={40} className="text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-4">Security FAQ</h3>
            <div className="space-y-4">
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Privacy</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Your data is stored in your private Supabase instance. Only you (and whoever has your keys) can access it.</p>
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Local Caching</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">A copy of your data is kept on this device so the app works offline. It syncs automatically when you go back online.</p>
               </div>
            </div>
            <button onClick={() => setShowPrivacyNotice(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-all">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
