import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Activity } from './components/Activity';
import { Settings } from './components/Settings';
import { AssetDetail } from './components/AssetDetail';
import { Auth } from './components/Auth';
import { Screen, Asset, Transaction, TransactionType, AssetGroup, PricePoint, User } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Bulletproof environment variable detector
const getEnvVar = (key: string): string => {
  // 1. Check Vite's standard location
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}

  // 2. Check standard Node/Vercel location
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  // 3. Check window-injected location (used by some CI/CD tools)
  try {
    const win = window as any;
    if (win.process?.env?.[key]) return win.process.env[key];
    if (win._env_?.[key]) return win._env_[key];
  } catch (e) {}

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Initialize Supabase only if both keys are actually strings with content
const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('zeninvest_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'MYR'>('USD');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const [syncState, setSyncState] = useState<'IDLE' | 'SAVING' | 'ERROR'>('IDLE');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  // CLOUD FETCH
  const fetchData = useCallback(async (userId: string) => {
    if (!userId) return;
    setSyncState('SAVING');
    
    // DEMO USER
    if (userId === 'demo_user') {
      const suffix = '_demo';
      setAssets(JSON.parse(localStorage.getItem(`zeninvest_assets${suffix}`) || '[]'));
      setGroups(JSON.parse(localStorage.getItem(`zeninvest_groups${suffix}`) || '[]'));
      setTransactions(JSON.parse(localStorage.getItem(`zeninvest_transactions${suffix}`) || '[]'));
      setHasLoadedInitialData(true);
      setSyncState('IDLE');
      return;
    }

    // CLOUD MODE
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          setAssets(data.assets || []);
          setGroups(data.groups || []);
          setTransactions(data.transactions || []);
          setCurrency(data.currency || 'USD');
          setLastSyncTimestamp(data.updated_at);
          setHasLoadedInitialData(true);
          setSyncState('IDLE');
          return;
        }

        if (error && error.code === 'PGRST116') {
          const suffix = `_${userId}`;
          setAssets(JSON.parse(localStorage.getItem(`zeninvest_assets${suffix}`) || '[]'));
          setGroups(JSON.parse(localStorage.getItem(`zeninvest_groups${suffix}`) || '[]'));
          setTransactions(JSON.parse(localStorage.getItem(`zeninvest_transactions${suffix}`) || '[]'));
          setHasLoadedInitialData(true);
          setSyncState('IDLE');
          return;
        }
        throw error;
      } catch (err) {
        console.error("Cloud Sync Error:", err);
        setSyncState('ERROR');
      }
    } else {
      // Local Fallback
      const suffix = `_${userId}`;
      setAssets(JSON.parse(localStorage.getItem(`zeninvest_assets${suffix}`) || '[]'));
      setGroups(JSON.parse(localStorage.getItem(`zeninvest_groups${suffix}`) || '[]'));
      setTransactions(JSON.parse(localStorage.getItem(`zeninvest_transactions${suffix}`) || '[]'));
      setHasLoadedInitialData(true);
      setSyncState('IDLE');
    }
  }, []);

  // REALTIME CHANNEL
  useEffect(() => {
    if (supabase && currentUser && currentUser.id !== 'demo_user') {
      const channel = supabase
        .channel(`sync_v4_${currentUser.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'portfolios', filter: `user_id=eq.${currentUser.id}` }, 
          (payload) => {
            const cloudDate = payload.new.updated_at;
            if (!lastSyncTimestamp || new Date(cloudDate) > new Date(lastSyncTimestamp)) {
              setAssets(payload.new.assets || []);
              setGroups(payload.new.groups || []);
              setTransactions(payload.new.transactions || []);
              setCurrency(payload.new.currency || 'USD');
              setLastSyncTimestamp(cloudDate);
              setHasLoadedInitialData(true);
            }
          }
        ).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [currentUser, lastSyncTimestamp]);

  useEffect(() => {
    if (currentUser) fetchData(currentUser.id);
  }, [currentUser, fetchData]);

  // PERSISTENCE ENGINE
  const persistChanges = useCallback(async () => {
    if (!currentUser || !hasLoadedInitialData) return;
    
    setSyncState('SAVING');
    const suffix = currentUser.id === 'demo_user' ? '_demo' : `_${currentUser.id}`;
    localStorage.setItem(`zeninvest_assets${suffix}`, JSON.stringify(assets));
    localStorage.setItem(`zeninvest_groups${suffix}`, JSON.stringify(groups));
    localStorage.setItem(`zeninvest_transactions${suffix}`, JSON.stringify(transactions));

    if (supabase && currentUser.id !== 'demo_user') {
      try {
        const { error } = await supabase
          .from('portfolios')
          .upsert({
            user_id: currentUser.id,
            assets,
            groups,
            transactions,
            currency,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        if (error) throw error;
        setSyncState('IDLE');
      } catch (err) {
        setSyncState('ERROR');
      }
    } else {
      setTimeout(() => setSyncState('IDLE'), 300);
    }
    setLastSyncTimestamp(new Date().toISOString());
  }, [assets, groups, transactions, currency, currentUser, hasLoadedInitialData]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => persistChanges(), 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [assets, groups, transactions, currency, persistChanges]);

  const handleLogin = (user: User) => {
    setHasLoadedInitialData(false);
    setCurrentUser(user);
    localStorage.setItem('zeninvest_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (window.confirm("Log out? Data is safe in cloud.")) {
      setCurrentUser(null);
      localStorage.removeItem('zeninvest_current_user');
      setAssets([]);
      setTransactions([]);
      setGroups([]);
      setHasLoadedInitialData(false);
      setCurrentScreen(Screen.DASHBOARD);
    }
  };

  const syncAssetWithTransactions = useCallback((assetId: string, allTxs: Transaction[]) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === assetId) {
          const assetTxs = allTxs.filter(t => t.assetId === assetId).sort((a, b) => a.date.localeCompare(b.date));
          let runningValue = 0;
          let runningInvested = 0;
          const history: PricePoint[] = [];
          assetTxs.forEach(tx => {
            if (tx.type === TransactionType.BUY) { runningValue += tx.amount; runningInvested += tx.amount; }
            else if (tx.type === TransactionType.SELL) { runningValue = Math.max(0, runningValue - tx.amount); runningInvested = Math.max(0, runningInvested - tx.amount); }
            else if (tx.type === TransactionType.PRICE_UPDATE) { runningValue = tx.amount; }
            else if (tx.type === TransactionType.DIVIDEND) { runningValue += tx.amount; }
            history.push({ date: tx.date, value: runningValue });
          });
          return { ...asset, currentValue: runningValue, totalInvested: runningInvested, priceHistory: history };
        }
        return asset;
      });
    });
  }, []);

  const portfolioStats = useMemo(() => {
    const totalValue = assets.reduce((acc, asset) => acc + asset.currentValue, 0);
    const totalInvested = assets.reduce((acc, asset) => acc + asset.totalInvested, 0);
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    return { totalValue, totalInvested, totalReturn, totalReturnPercentage };
  }, [assets]);

  const portfolioHistory = useMemo(() => {
    const allTimestamps: string[] = Array.from(new Set<string>(assets.flatMap(a => a.priceHistory.map(p => p.date)))).sort();
    if (allTimestamps.length === 0) return [];
    return allTimestamps.map((timestamp: string) => {
      const value = assets.reduce((acc, asset) => {
        const exactPoint = asset.priceHistory.find(p => p.date === timestamp);
        if (exactPoint) return acc + exactPoint.value;
        const prevPoints = asset.priceHistory.filter(p => p.date < timestamp).sort((a, b) => b.date.localeCompare(a.date));
        return acc + (prevPoints.length > 0 ? prevPoints[0].value : 0);
      }, 0);
      return { date: new Date(timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), fullDate: timestamp, value };
    });
  }, [assets]);

  const handleAssetClick = (id: string) => { setSelectedAssetId(id); setCurrentScreen(Screen.ASSET_DETAIL); };

  const handleAddAsset = (newAsset: Omit<Asset, 'id' | 'order' | 'priceHistory'>) => {
    const assetId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const initialTx: Transaction = { id: Math.random().toString(36).substr(2, 9), assetId, ticker: newAsset.ticker, type: TransactionType.BUY, amount: newAsset.totalInvested, date: new Date(Date.now() - 1000).toISOString() };
    const newAssets = [...assets, { ...newAsset, id: assetId, order: assets.length, priceHistory: [] }];
    const newTransactions = [initialTx, ...transactions];
    setTransactions(newTransactions);
    setAssets(newAssets);
    if (newAsset.currentValue !== newAsset.totalInvested) {
      const updateTx: Transaction = { id: Math.random().toString(36).substr(2, 9), assetId, ticker: newAsset.ticker, type: TransactionType.PRICE_UPDATE, amount: newAsset.currentValue, date: now };
      const finalTxs = [updateTx, ...newTransactions];
      setTransactions(finalTxs);
      syncAssetWithTransactions(assetId, finalTxs);
    } else {
      syncAssetWithTransactions(assetId, newTransactions);
    }
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const handleDeleteAsset = (id: string) => { setAssets(prev => prev.filter(a => a.id !== id)); setTransactions(prev => prev.filter(t => t.assetId !== id)); setCurrentScreen(Screen.DASHBOARD); setSelectedAssetId(null); };
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => { const txWithId: Transaction = { ...newTx, id: Math.random().toString(36).substr(2, 9) }; const updatedTransactions = [txWithId, ...transactions]; setTransactions(updatedTransactions); syncAssetWithTransactions(newTx.assetId, updatedTransactions); };
  const handleDeleteTransaction = (txId: string) => { const txToDelete = transactions.find(t => t.id === txId); const updatedTransactions = transactions.filter(t => t.id !== txId); setTransactions(updatedTransactions); if (txToDelete) syncAssetWithTransactions(txToDelete.assetId, updatedTransactions); };
  const handleAddGroup = (name: string) => { const newGroup: AssetGroup = { id: Math.random().toString(36).substr(2, 9), name, color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') }; setGroups(prev => [...prev, newGroup]); };
  const handleDeleteGroup = (groupId: string) => { setAssets(prev => prev.map(a => a.groupId === groupId ? { ...a, groupId: undefined } : a)); setGroups(prev => prev.filter(g => g.id !== groupId)); };
  const handleMoveToGroup = (assetId: string, groupId?: string) => setAssets(prev => prev.map(a => a.id === assetId ? { ...a, groupId } : a));
  const handleReorderAssets = (newAssets: Asset[]) => setAssets(newAssets.map((a, i) => ({ ...a, order: i })));
  const handleResetData = () => { if (window.confirm("Wipe cloud data?")) { setAssets([]); setGroups([]); setTransactions([]); persistChanges(); } };

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Layout currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} isDarkMode={isDarkMode} currentUser={currentUser}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-screen">
          {currentScreen === Screen.DASHBOARD && <Dashboard stats={portfolioStats} assets={assets} groups={groups} portfolioHistory={portfolioHistory} currency={currency} onAssetClick={handleAssetClick} onAddAsset={handleAddAsset} onAddGroup={handleAddGroup} onDeleteGroup={handleDeleteGroup} onMoveToGroup={handleMoveToGroup} onReorderAssets={handleReorderAssets} transactions={transactions} syncState={syncState} lastSyncTimestamp={lastSyncTimestamp} />}
          {currentScreen === Screen.ACTIVITY && <Activity transactions={transactions} currency={currency} />}
          {currentScreen === Screen.SETTINGS && <Settings currency={currency} setCurrency={setCurrency} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onResetData={handleResetData} assets={assets} transactions={transactions} groups={groups} currentUser={currentUser} onLogout={handleLogout} syncState={syncState} onRefresh={() => fetchData(currentUser.id)} />}
          {currentScreen === Screen.ASSET_DETAIL && selectedAssetId && assets.find(a => a.id === selectedAssetId) && <AssetDetail asset={assets.find(a => a.id === selectedAssetId)!} transactions={transactions.filter(t => t.assetId === selectedAssetId)} currency={currency} onBack={() => setCurrentScreen(Screen.DASHBOARD)} onDelete={() => handleDeleteAsset(selectedAssetId)} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateAsset={handleUpdateAsset} />}
        </div>
      </Layout>
    </div>
  );
};

export default App;