import React, { useState } from 'react';
// Import User as UserIcon to avoid conflict with the User type
import { User as UserIcon, Rocket, ShieldCheck, Key, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';
// Import the User interface from the types file
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User, importedData?: any) => void;
}

// Utility for decompression
async function decompressData(base64: string) {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const decompressed = await new Response(stream).text();
    return JSON.parse(decompressed);
  } catch (e) {
    // Fallback for old non-compressed keys
    return JSON.parse(atob(base64));
  }
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'SYNC'>('LOGIN');
  const [name, setName] = useState('');
  const [syncKey, setSyncKey] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      lastLogin: new Date().toISOString()
    };
    
    const registry = JSON.parse(localStorage.getItem('zeninvest_users') || '[]');
    registry.push(newUser);
    localStorage.setItem('zeninvest_users', JSON.stringify(registry));
    
    onLogin(newUser);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncKey.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const decoded = await decompressData(syncKey.trim());
      if (decoded.assets && decoded.user) {
        onLogin(decoded.user, decoded);
      } else {
        setError("Invalid Sync Key content. Missing required data.");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid Sync Key format. Please ensure you copied the whole key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const registeredUsers = JSON.parse(localStorage.getItem('zeninvest_users') || '[]');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-600/30 mb-4">
            <Rocket size={32} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Money Money Record</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-8 leading-relaxed">
            Your private long-term investment vault. 
            <span className="block text-[10px] mt-1 text-indigo-500 uppercase font-black">Powered by Desmond & Gemini</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          {mode === 'LOGIN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center"><LogIn size={20} className="mr-2 text-indigo-500" /> Welcome Back</h2>
              </div>
              
              {registeredUsers.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Profile</p>
                  {registeredUsers.map((u: User) => (
                    <button 
                      key={u.id}
                      onClick={() => onLogin(u)}
                      className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">{u.name[0].toUpperCase()}</div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Local Account</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-400 italic">No local accounts found on this browser.</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button onClick={() => setMode('SIGNUP')} className="w-full py-4 flex items-center justify-center space-x-2 text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-2xl transition-all">
                  <UserPlus size={18} />
                  <span>Create New Profile</span>
                </button>
                <button onClick={() => setMode('SYNC')} className="w-full py-4 flex items-center justify-center space-x-2 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                  <Key size={18} />
                  <span>I have a Sync Key</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'SIGNUP' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <h2 className="text-xl font-bold flex items-center"><UserPlus size={20} className="mr-2 text-indigo-500" /> New Profile</h2>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Your Name</label>
                <input 
                  autoFocus 
                  required
                  placeholder="e.g. Desmond" 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight px-1 italic">
                Profiles are local to this browser by default. Use Sync Keys to move between devices.
              </p>
              <div className="flex flex-col space-y-3">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30">
                  Get Started
                </button>
                <button type="button" onClick={() => setMode('LOGIN')} className="w-full py-4 text-slate-400 font-bold">
                  Go Back
                </button>
              </div>
            </form>
          )}

          {mode === 'SYNC' && (
            <form onSubmit={handleSync} className="space-y-6">
              <h2 className="text-xl font-bold flex items-center"><Key size={20} className="mr-2 text-indigo-500" /> Restore Account</h2>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paste Your Master Sync Key</label>
                <textarea 
                  autoFocus 
                  required
                  rows={4}
                  placeholder="Paste long code here..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] font-mono leading-tight resize-none"
                  value={syncKey}
                  onChange={e => {setSyncKey(e.target.value); setError('');}}
                />
              </div>
              {error && <p className="text-[10px] font-bold text-rose-500 px-1">{error}</p>}
              <div className="flex flex-col space-y-3">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className={`w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center ${isProcessing ? 'opacity-70' : ''}`}
                >
                  {isProcessing ? 'Decompressing...' : 'Restore Data'}
                </button>
                <button type="button" onClick={() => setMode('LOGIN')} className="w-full py-4 text-slate-400 font-bold">
                  Go Back
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center space-x-6 opacity-40">
           <div className="flex items-center space-x-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Private</span>
           </div>
           <div className="flex items-center space-x-1">
              <Sparkles size={14} className="text-indigo-500" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Secure</span>
           </div>
        </div>
      </div>
    </div>
  );
};