import React, { useState } from 'react';
import { User as UserIcon, Rocket, ShieldCheck, Key, ArrowRight, UserPlus, LogIn, Sparkles, Mail, Lock, Info } from 'lucide-react';
import { User } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safety Guard for Supabase Initialization
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    // Demo Mode if Supabase is not configured
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
          onLogin({ id: data.user.id, name: name || email.split('@')[0], lastLogin: new Date().toISOString() });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            name: data.user.user_metadata?.full_name || email.split('@')[0], 
            lastLogin: new Date().toISOString() 
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your details.");
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
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-8 leading-relaxed">
            Your private long-term investment vault. 
            <span className="block text-[10px] mt-1 text-indigo-500 uppercase font-black">
              {supabase ? 'Live Cloud Sync Enabled' : 'Local Persistence Active'}
            </span>
          </p>
        </div>

        {!supabase && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-3xl flex items-start space-x-3">
             <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
             <div className="text-[10px] text-amber-800 dark:text-amber-200 leading-normal">
                <strong>Demo Mode Active:</strong> Supabase keys not detected. You can use the app normally, but data will only be stored in this browser. Add `VITE_SUPABASE_URL` to Vercel to enable Cloud Sync.
             </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                {mode === 'LOGIN' ? <LogIn size={20} className="mr-2 text-indigo-500" /> : <UserPlus size={20} className="mr-2 text-indigo-500" />}
                {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>

            {mode === 'SIGNUP' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required placeholder="Desmond" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="email" placeholder="you@example.com" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            {error && <p className="text-[10px] font-bold text-rose-500 px-1 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 active:scale-95 transition-all">
              {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                <>
                  <span>{mode === 'LOGIN' ? (supabase ? 'Login to Cloud' : 'Enter App') : 'Create Profile'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button type="button" onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              {mode === 'LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center space-x-6 opacity-40">
           <div className="flex items-center space-x-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Encrypted</span>
           </div>
           <div className="flex items-center space-x-1">
              <Sparkles size={14} className="text-indigo-500" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Safe Sync</span>
           </div>
        </div>
      </div>
    </div>
  );
};