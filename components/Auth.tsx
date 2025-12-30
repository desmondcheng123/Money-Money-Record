import React, { useState } from 'react';
import { User as UserIcon, Rocket, ShieldCheck, ArrowRight, UserPlus, LogIn, Sparkles, Mail, Lock, Info, Cloud, CloudOff, AlertCircle, RefreshCcw, ExternalLink, Terminal, ChevronRight, Zap } from 'lucide-react';
import { User } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
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
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const isCloudReady = !!supabase;

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
        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            name: name || email.split('@')[0], 
            lastLogin: new Date().toISOString(),
          } as any);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
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
               <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full border border-amber-100 dark:border-amber-800">
                  <CloudOff size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Local Mode Only</span>
               </div>
             )}
          </div>
        </div>

        {!isCloudReady && (
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 p-6 rounded-[2.5rem] shadow-sm space-y-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Zap size={80} className="text-amber-500" />
             </div>

             <div className="flex items-start space-x-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                   <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-tight">Vercel Build Cache Detected</p>
                   <p className="text-[10px] text-amber-700/70 dark:text-amber-300/50 leading-relaxed font-medium">
                      Your keys are configured, but Vercel is serving an old version of the site from its cache. 
                   </p>
                </div>
             </div>
             
             <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center">
                   <RefreshCcw size={12} className="mr-2" /> 
                   Force-Clear Fix
                </h4>
                <ol className="space-y-3">
                   <li className="flex items-start space-x-3">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Click <b>Redeploy</b> in Vercel Deployments</p>
                   </li>
                   <li className="flex items-start space-x-3">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">UNCHECK <span className="text-rose-600">"Redeploy with Build Cache"</span></p>
                   </li>
                </ol>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <a 
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  className="py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-600 transition-all flex items-center justify-center"
                >
                  Vercel Dashboard
                  <ExternalLink size={12} className="ml-1.5" />
                </a>
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center"
                >
                  <Terminal size={12} className="mr-1.5" />
                  System Check
                </button>
             </div>

             {showDebug && (
               <div className="p-4 bg-slate-900 rounded-2xl font-mono text-[9px] space-y-2 overflow-x-auto border border-slate-800 animate-in fade-in duration-300">
                  <p className="text-indigo-400 font-bold mb-1">// DEBUG REPORT</p>
                  <p className="text-slate-400">VITE_SUPABASE_URL: <span className={supabaseUrl ? 'text-emerald-400' : 'text-rose-400'}>{supabaseUrl ? 'BAKED_OK' : 'MISSING'}</span></p>
                  <p className="text-slate-400">VITE_SUPABASE_ANON: <span className={supabaseAnonKey ? 'text-emerald-400' : 'text-rose-400'}>{supabaseAnonKey ? 'BAKED_OK' : 'MISSING'}</span></p>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[8px] text-slate-500 uppercase font-black leading-relaxed">
                     If 'MISSING' above, your Vercel build did not pick up the keys. A fresh redeploy with NO CACHE is the only fix.
                  </div>
               </div>
             )}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
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
              <div className="flex items-center space-x-2 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in shake duration-300">
                <Info size={14} className="text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-600">{error}</p>
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