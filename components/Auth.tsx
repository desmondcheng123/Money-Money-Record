import React, { useState } from 'react';
import { User as UserIcon, Rocket, ShieldCheck, ArrowRight, UserPlus, LogIn, Sparkles, Mail, Lock, Info, Cloud, CloudOff, AlertCircle, RefreshCcw, ExternalLink, Terminal, ChevronRight, Zap, Database, Key, HelpCircle, X, CheckCircle2, Copy } from 'lucide-react';
import { User } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const manual = localStorage.getItem(`MANUAL_${key}`);
    if (manual) return manual;

    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
  } catch (e) {}

  try {
    const win = window as any;
    if (win.process?.env?.[key]) return win.process.env[key];
    if (win._env_?.[key]) return win._env_[key];
  } catch (e) {}
  
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  
  const isCloudReady = !!supabase;

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl && manualKey) {
      localStorage.setItem('MANUAL_VITE_SUPABASE_URL', manualUrl.trim());
      localStorage.setItem('MANUAL_VITE_SUPABASE_ANON_KEY', manualKey.trim());
      window.location.reload();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    if (!supabase) {
      setTimeout(() => {
        onLogin({ 
          id: 'demo_user', 
          name: name || email.split('@')[0] || 'Desmond', 
          lastLogin: new Date().toISOString() 
        });
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      if (mode === 'SIGNUP') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (signUpError) throw signUpError;
        
        // Handling the "Email Confirmation" case for Sign Up
        if (data.user && data.session === null) {
          setError("Account created! Please check your email for a confirmation link, or disable 'Email Confirmation' in your Supabase dashboard to login instantly.");
          setIsProcessing(false);
          return;
        }

        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            name: name || email.split('@')[0], 
            lastLogin: new Date().toISOString(),
          } as any);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          // Detect the specific Supabase error for unconfirmed emails
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            throw new Error("Email not confirmed. Please click the link in your inbox, or go to Supabase -> Auth -> Providers -> Email and turn OFF 'Confirm Email'.");
          }
          throw signInError;
        }
        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            name: data.user.user_metadata?.full_name || email.split('@')[0], 
            lastLogin: new Date().toISOString(),
          } as any);
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showManualSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl space-y-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300 relative overflow-hidden">
           <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-amber-500 text-white rounded-[2rem] shadow-xl shadow-amber-500/30 mb-2">
                <Database size={32} />
              </div>
              <h2 className="text-2xl font-bold">Manual Cloud Link</h2>
              <button 
                onClick={() => setShowHelpGuide(true)}
                className="inline-flex items-center text-[10px] text-amber-600 font-black uppercase tracking-widest hover:underline"
              >
                <HelpCircle size={12} className="mr-1" /> How to get these?
              </button>
           </div>

           <form onSubmit={handleManualSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  <ExternalLink size={10} className="mr-1.5" /> Supabase URL
                </label>
                <input required placeholder="https://xxxx.supabase.co" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono" value={manualUrl} onChange={e => setManualUrl(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  <Key size={10} className="mr-1.5" /> Anon API Key
                </label>
                <textarea required rows={3} placeholder="eyJhbGciOiJIUzI1Ni..." className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-amber-500 text-[10px] font-mono leading-tight resize-none" value={manualKey} onChange={e => setManualKey(e.target.value)} />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                 <p className="text-[9px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    Once saved, the app will reload and connect. This bypasses server detection issues.
                 </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowManualSetup(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest flex items-center justify-center">Save & Re-Connect</button>
              </div>
           </form>
        </div>

        {showHelpGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-[3rem] p-8 shadow-2xl relative overflow-y-auto no-scrollbar animate-in zoom-in duration-300">
                <button onClick={() => setShowHelpGuide(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={24} /></button>
                <div className="space-y-6">
                   <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4"><Zap size={32} /></div>
                      <h3 className="text-2xl font-black">Cloud Vault Setup</h3>
                      <p className="text-sm text-slate-400">Complete these 3 steps to sync everywhere.</p>
                   </div>

                   <div className="space-y-6">
                      <div className="flex space-x-4">
                         <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">1</div>
                         <div>
                            <p className="font-bold">Create Supabase Project</p>
                            <p className="text-xs text-slate-500">Go to <a href="https://supabase.com" target="_blank" className="text-indigo-600 underline">supabase.com</a>, sign up, and create a "New Project". Choose any name you like.</p>
                         </div>
                      </div>

                      <div className="flex space-x-4">
                         <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">2</div>
                         <div>
                            <p className="font-bold">Copy API Keys</p>
                            <p className="text-xs text-slate-500">Go to **Settings** (gear) -> **API**. Copy the **Project URL** and the **anon public key** into the screen behind this popup.</p>
                         </div>
                      </div>

                      <div className="flex space-x-4">
                         <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">3</div>
                         <div className="flex-1">
                            <p className="font-bold">Run Database Script</p>
                            <p className="text-xs text-slate-500 mb-3">Go to **SQL Editor** (icon looks like `>_`) in Supabase, click "New Query", paste this code, and click "Run":</p>
                            <div className="bg-slate-900 rounded-2xl p-4 relative group">
                               <pre className="text-[10px] text-indigo-300 overflow-x-auto font-mono leading-relaxed">
{`create table portfolios (
  user_id uuid references auth.users not null primary key,
  assets jsonb default '[]'::jsonb,
  groups jsonb default '[]'::jsonb,
  transactions jsonb default '[]'::jsonb,
  currency text default 'USD',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table portfolios enable row level security;

create policy "Users can manage their own portfolio" 
on portfolios for all 
using (auth.uid() = user_id);`}
                               </pre>
                               <button 
                                 onClick={() => {
                                   navigator.clipboard.writeText(`create table portfolios (user_id uuid references auth.users not null primary key, assets jsonb default '[]'::jsonb, groups jsonb default '[]'::jsonb, transactions jsonb default '[]'::jsonb, currency text default 'USD', updated_at timestamp with time zone default timezone('utc'::text, now()) not null); alter table portfolios enable row level security; create policy "Users can manage their own portfolio" on portfolios for all using (auth.uid() = user_id);`);
                                 }}
                                 className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <Copy size={14} />
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>

                   <button onClick={() => setShowHelpGuide(false)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl mt-4">Got it, Let's go!</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-600/30 mb-4">
            <Rocket size={32} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Money Money Record</h1>
          
          <div className="flex justify-center">
             {isCloudReady ? (
               <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full border border-emerald-100 dark:border-emerald-800">
                  <Cloud size={12} className="cloud-live" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cloud Sync Active</span>
               </div>
             ) : (
               <button 
                 onClick={() => setShowManualSetup(true)}
                 className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full border border-amber-100 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer group"
               >
                  <CloudOff size={12} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Local Mode • Setup Cloud?</span>
               </button>
             )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                {mode === 'LOGIN' ? <LogIn size={20} className="mr-2 text-indigo-500" /> : <UserPlus size={20} className="mr-2 text-indigo-500" />}
                {mode === 'LOGIN' ? 'Welcome Back' : 'Create Vault'}
              </h2>
            </div>

            {mode === 'SIGNUP' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required placeholder="Desmond" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="email" placeholder="you@email.com" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="flex flex-col space-y-2 bg-rose-50 p-4 rounded-xl border border-rose-100 animate-in shake duration-300">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-rose-600 leading-relaxed">{error}</p>
                </div>
                {error.toLowerCase().includes('confirm email') && (
                  <div className="pt-2 border-t border-rose-100">
                    <p className="text-[9px] text-rose-500 font-medium">Tip: Supabase -> Auth -> Providers -> Email -> Toggle OFF "Confirm Email"</p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 active:scale-95 hover:bg-indigo-700 transition-all mt-4">
              <span>{mode === 'LOGIN' ? (isCloudReady ? 'Sign in' : 'Guest Login') : 'Join Cloud'}</span>
              <ArrowRight size={18} />
            </button>

            <button type="button" onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-500 transition-colors">
              {mode === 'LOGIN' ? "Need a cloud account? Sign Up" : "Already have an account? Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};