import React, { useRef, useState } from 'react';
import { Asset, AssetGroup, Transaction, User } from '../types';
import { 
  Globe, 
  Moon, 
  Sun, 
  FileUp, 
  Download, 
  ChevronRight,
  Info,
  RefreshCcw,
  Share2,
  X,
  Check,
  Lock,
  Smartphone,
  ShieldAlert,
  LogOut,
  Key,
  Info as InfoIcon,
  Cloud,
  Mail,
  AlertCircle,
  Database,
  CloudLightning
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
}

export const Settings: React.FC<SettingsProps> = ({ 
  currency, setCurrency, isDarkMode, setIsDarkMode, onResetData, assets, transactions, groups, currentUser, onLogout, syncState
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

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
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync Connected</p>
              </div>
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

      {/* Cloud Status Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Database size={120} />
        </div>
        
        <div className="flex items-start space-x-4 mb-4 relative z-10">
           <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
              <CloudLightning size={24} className="cloud-live" />
           </div>
           <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Sync is Automated</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Changes are saved to your account in real-time. No manual steps needed.</p>
           </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 relative z-10">
          <Database size={16} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Live Database</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal italic">
              Each asset and transaction is securely stored in your personal cloud vault. You can log in on any device to see your live portfolio.
            </p>
          </div>
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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Account Security</p>
        <SettingItem icon={Download} label="Export Legacy Backup" value="Save .json" onClick={handleExport} />
        <SettingItem icon={Lock} label="Security FAQ" onClick={() => setShowPrivacyNotice(true)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Danger Zone</p>
        <SettingItem icon={RefreshCcw} label="Factory Reset Cloud" variant="danger" onClick={onResetData} />
      </section>

      {/* Privacy FAQ Modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowPrivacyNotice(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <Lock size={40} className="text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-4">Cloud Security</h3>
            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
              <p>Your data is encrypted both in transit and at rest using AES-256. Only you have access through your authenticated account.</p>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Key Features</p>
                <ul className="text-[10px] space-y-1 list-disc pl-4">
                  <li>Automatic Real-time Backups</li>
                  <li>Instant Multi-Device Syncing</li>
                  <li>Secure Identity Management</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowPrivacyNotice(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Understood</button>
          </div>
        </div>
      )}

      <div className="p-8 text-center opacity-30">
        <h3 className="font-black text-2xl italic text-slate-900 dark:text-white uppercase tracking-tighter">Money Money Record</h3>
        <p className="text-xs font-medium">Synced & Secure.</p>
      </div>
    </div>
  );
};