import React, { useRef, useState } from 'react';
import { Asset, AssetGroup, Transaction, User } from '../types';
import { 
  Globe, 
  Moon, 
  Sun, 
  ShieldCheck, 
  FileUp, 
  Download, 
  ChevronRight,
  Info,
  RefreshCcw,
  Share2,
  X,
  Check,
  QrCode,
  Lock,
  Smartphone,
  ShieldAlert,
  Save,
  Rocket,
  Zap,
  LogOut,
  Key
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
}

// Utility for compression
async function compressData(data: any) {
  const str = JSON.stringify(data);
  const buf = new TextEncoder().encode(str);
  const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressedBuf = await new Response(stream).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(compressedBuf)));
}

export const Settings: React.FC<SettingsProps> = ({ 
  currency, setCurrency, isDarkMode, setIsDarkMode, onResetData, assets, transactions, groups, currentUser, onLogout 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');

  const handleExport = () => {
    const data = {
      assets,
      groups,
      transactions,
      currency,
      user: currentUser,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money-money-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.assets && data.transactions) {
          if (window.confirm("Importing will overwrite your current profile data. Continue?")) {
            const suffix = `_${currentUser.id}`;
            localStorage.setItem(`zeninvest_assets${suffix}`, JSON.stringify(data.assets));
            localStorage.setItem(`zeninvest_groups${suffix}`, JSON.stringify(data.groups || []));
            localStorage.setItem(`zeninvest_transactions${suffix}`, JSON.stringify(data.transactions));
            localStorage.setItem(`zeninvest_currency${suffix}`, data.currency || 'USD');
            window.location.reload();
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error reading backup file.");
      }
    };
    reader.readAsText(file);
  };

  const generateSyncData = async () => {
    setIsSyncing(true);
    const data = { assets, transactions, groups, currency, user: currentUser };
    const compressed = await compressData(data);
    setIsSyncing(false);
    return compressed;
  };

  const copySyncKey = async () => {
    const compressed = await generateSyncData();
    navigator.clipboard.writeText(compressed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSyncModal = async () => {
    setIsSyncing(true);
    const compressed = await generateSyncData();
    const baseUrl = window.location.href.split('?')[0];
    setSyncUrl(`${baseUrl}?import=${compressed}`);
    setShowSyncModal(true);
    setIsSyncing(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
           <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">{currentUser.name[0].toUpperCase()}</div>
           <div>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged In Profile</p>
           </div>
        </div>
        <button 
          onClick={onLogout} 
          className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          title="Logout"
        >
           <LogOut size={20} />
        </button>
      </div>

      {/* Persistence Advice Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-start space-x-4 mb-4">
           <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
              <ShieldAlert size={24} />
           </div>
           <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Cross-Device Sync</h3>
              <p className="text-xs text-slate-500 leading-relaxed">To use this app on another PC, you need your <strong>Compressed Sync Key</strong>.</p>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={copySyncKey} 
             disabled={isSyncing}
             className={`flex items-center justify-center space-x-2 py-3 font-bold rounded-2xl text-[11px] shadow-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-indigo-600/20'} ${isSyncing ? 'opacity-50' : ''}`}
           >
              {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : (copied ? <Check size={14} /> : <Key size={14} />)}
              <span>{copied ? 'Key Copied!' : 'Copy Sync Key'}</span>
           </button>
           <button 
             onClick={handleOpenSyncModal} 
             disabled={isSyncing}
             className={`flex items-center justify-center space-x-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-[11px] active:scale-95 transition-all ${isSyncing ? 'opacity-50' : ''}`}
           >
              {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : <Smartphone size={14} />}
              <span>QR Sync</span>
           </button>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Preferences</p>
        <SettingItem 
          icon={Globe} 
          label="Currency" 
          value={currency} 
          onClick={() => setCurrency(currency === 'USD' ? 'MYR' : 'USD')} 
        />
        <SettingItem 
          icon={isDarkMode ? Moon : Sun} 
          label="Appearance" 
          value={isDarkMode ? 'Dark' : 'Light'} 
          onClick={() => setIsDarkMode(!isDarkMode)} 
        />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Data & Portability</p>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleImport} accept=".json" />
        <SettingItem icon={FileUp} label="Import from File" value="Select .json" onClick={() => fileInputRef.current?.click()} />
        <SettingItem icon={Download} label="Export Backup" value="Save .json" onClick={handleExport} />
        <SettingItem icon={Lock} label="How is data stored?" onClick={() => setShowPrivacyNotice(true)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">System</p>
        <SettingItem icon={RefreshCcw} label="Reset Portfolio" variant="danger" onClick={onResetData} />
        <SettingItem icon={Info} label="App Version" value="v2.1.0" />
      </section>

      {/* Sync Modal with QR Code */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowSyncModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <Smartphone size={40} className="text-indigo-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-2">Sync to Phone</h3>
            <p className="text-[10px] text-slate-500 mb-6 uppercase font-bold tracking-widest">Scan with your mobile device</p>
            
            <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-sm border border-slate-100">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(syncUrl)}`} 
                 alt="QR Code" 
                 className="w-56 h-56"
               />
            </div>

            <div className="text-left space-y-4 mb-6">
               <div className="flex items-start space-x-3">
                 <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan this QR code with your phone's camera.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400">Tap the link to open the app and confirm import.</p>
               </div>
            </div>

            <button onClick={copyLink} className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center space-x-2 border transition-all ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}>
               {copied ? <Check size={16} /> : <Share2 size={16} />}
               <span>{copied ? 'Link Copied!' : 'Copy Sync Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Privacy FAQ Modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowPrivacyNotice(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <Lock size={40} className="text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-4">Your Data, Your Control</h3>
            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
              <p>Everything is stored locally on this machine under your User ID (<strong>{currentUser.id}</strong>).</p>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Backup Tips</p>
                <ul className="text-[10px] space-y-1 list-disc pl-4">
                  <li>Store your <strong>Master Sync Key</strong> in a safe place.</li>
                  <li>Export a backup file regularly.</li>
                  <li>The app does not use a central cloud—you are the owner of your data.</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowPrivacyNotice(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Understood</button>
          </div>
        </div>
      )}

      <div className="p-8 text-center opacity-30">
        <h3 className="font-black text-2xl italic text-slate-900 dark:text-white uppercase tracking-tighter">Money Money Record</h3>
        <p className="text-xs font-medium">Safe & Sound.</p>
      </div>
    </div>
  );
};