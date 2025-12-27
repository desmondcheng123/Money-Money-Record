
import React, { useRef, useState } from 'react';
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
  Smartphone,
  X,
  Check,
  QrCode,
  ExternalLink,
  AlertTriangle,
  Lock,
  Github,
  Rocket
} from 'lucide-react';

interface SettingsProps {
  currency: 'USD' | 'MYR';
  setCurrency: (c: 'USD' | 'MYR') => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currency, setCurrency, isDarkMode, setIsDarkMode, onResetData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showHostingGuide, setShowHostingGuide] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const data = {
      assets: JSON.parse(localStorage.getItem('zeninvest_assets') || '[]'),
      groups: JSON.parse(localStorage.getItem('zeninvest_groups') || '[]'),
      transactions: JSON.parse(localStorage.getItem('zeninvest_transactions') || '[]'),
      currency: localStorage.getItem('zeninvest_currency') || 'USD',
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
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
          if (window.confirm("Importing will overwrite your current data. Continue?")) {
            localStorage.setItem('zeninvest_assets', JSON.stringify(data.assets));
            localStorage.setItem('zeninvest_groups', JSON.stringify(data.groups || []));
            localStorage.setItem('zeninvest_transactions', JSON.stringify(data.transactions));
            localStorage.setItem('zeninvest_currency', data.currency || 'USD');
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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
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
        {copied && label === "Copy Current Link" ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className={variant === 'danger' ? 'text-rose-300' : 'text-slate-300'} />}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pb-12">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-bold">More</h2>
        <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-tighter">
          <ShieldCheck size={12} className="mr-1" />
          <span>Local Only Data</span>
        </div>
      </div>

      <section className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-600/20">
        <div className="flex items-center space-x-3 mb-3">
          <Github size={24} />
          <h3 className="font-bold text-lg">GitHub Setup Guide</h3>
        </div>
        <p className="text-xs text-indigo-100 leading-relaxed mb-4">
          Ready to put your app online? Follow these exact steps on your GitHub screen to avoid 404s.
        </p>
        <button 
          onClick={() => setShowHostingGuide(true)}
          className="w-full py-3 bg-white text-indigo-600 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg"
        >
          <Rocket size={14} />
          <span>Show Step-by-Step Tutorial</span>
        </button>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Public Sharing</p>
        <SettingItem 
          icon={QrCode} 
          label="Scan to Phone" 
          value="View QR" 
          onClick={() => setShowInstallGuide(true)} 
        />
        <SettingItem 
          icon={Share2} 
          label="Copy Link" 
          value={copied ? "Copied!" : "Copy URL"} 
          onClick={copyLink} 
        />
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
        <SettingItem icon={FileUp} label="Import Data" value="Upload .json" onClick={() => fileInputRef.current?.click()} />
        <SettingItem icon={Download} label="Export Data" value="Save .json" onClick={handleExport} />
        <SettingItem icon={ShieldCheck} label="Privacy FAQ" onClick={() => setShowPrivacyNotice(true)} />
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">System</p>
        <SettingItem icon={RefreshCcw} label="Reset Portfolio" variant="danger" onClick={onResetData} />
        <SettingItem icon={Info} label="App Version" value="v1.5.0" />
      </section>

      {/* Hosting/Public Guide Modal */}
      {showHostingGuide && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowHostingGuide(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
               <Github size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Step-by-Step Setup</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Follow these steps on GitHub to make your link work for everyone:</p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-sm">Create Repository</h4>
                  <p className="text-xs text-slate-500">Name it <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">money-record</code>. Choose <strong>Public</strong> visibility so GitHub Pages can host it for free.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-sm">Upload Your Files</h4>
                  <p className="text-xs text-slate-500">Upload all files (<code className="text-indigo-600">index.html</code>, <code className="text-indigo-600">App.tsx</code>, etc.). Do not put them in a folder; put them in the root.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-sm">Enable "Pages"</h4>
                  <p className="text-xs text-slate-500">Go to <strong>Settings</strong> > <strong>Pages</strong> (on left sidebar). Under "Branch", select <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">main</code> and click <strong>Save</strong>.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 border-2 border-dashed border-indigo-200 rounded-3xl">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold shrink-0"><Check size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Wait 2 Minutes</h4>
                  <p className="text-xs text-slate-500">GitHub needs time to "Build" your site. Refresh the Pages screen until you see: <span className="text-emerald-600 font-bold">"Your site is live at..."</span></p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowHostingGuide(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Got it, let's go!</button>
          </div>
        </div>
      )}

      {/* Privacy Notice Modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowPrivacyNotice(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
            <Lock size={40} className="text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold mb-4">Why Public is safe</h3>
            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
              <p>When you set GitHub to <strong>Public</strong>, you are only sharing the "engine" of the app.</p>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Think of it like this:</p>
                <p className="text-xs mt-1">If you share a photo of a calculator, everyone can use the calculator, but they can't see what numbers YOU typed into YOUR calculator yesterday.</p>
              </div>
              <p>Your portfolio data (your actual money) never leaves your browser. It's stored in your phone's memory, not on GitHub's servers.</p>
            </div>
            <button onClick={() => setShowPrivacyNotice(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">I feel safe now</button>
          </div>
        </div>
      )}

      {/* QR Code / Install Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-2">Sync to Mobile</h3>
            <p className="text-[10px] text-slate-500 mb-6 uppercase font-bold tracking-widest">Only works if your link is public!</p>
            
            <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-sm border border-slate-100">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                 alt="QR Code" 
                 className="w-48 h-48"
               />
            </div>

            <div className="text-left space-y-4">
               <div className="flex items-start space-x-3">
                 <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan the code above.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400">Tap <strong>Share</strong> (iPhone) or <strong>Menu</strong> (Android).</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400">Select <strong>'Add to Home Screen'</strong>.</p>
               </div>
            </div>

            <button onClick={() => setShowInstallGuide(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Close</button>
          </div>
        </div>
      )}

      <div className="p-8 text-center opacity-30">
        <h3 className="font-black text-2xl italic text-slate-900 dark:text-white uppercase tracking-tighter">Money Money Record</h3>
        <p className="text-xs font-medium">Invest for the long run.</p>
      </div>
    </div>
  );
};
