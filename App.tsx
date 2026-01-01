import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Activity } from './components/Activity';
import { Settings } from './components/Settings';
import { AssetDetail } from './components/AssetDetail';
import { Screen, Asset, Transaction, TransactionType, AssetGroup, PricePoint, User } from './types';

const STORAGE_KEY_ASSETS = 'money_record_assets';
const STORAGE_KEY_GROUPS = 'money_record_groups';
const STORAGE_KEY_TRANSACTIONS = 'money_record_transactions';
const SCHEMA_VERSION = "1.0";

const App: React.FC = () => {
  const currentUser: User = { id: 'local_user', name: 'Desmond' };
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currency = 'MYR';
  const isDarkMode = true;
  
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const savedAssets = localStorage.getItem(STORAGE_KEY_ASSETS);
    const savedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const savedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

    setHasLoadedInitialData(true);
  }, []);

  const persistChanges = useCallback(() => {
    if (!hasLoadedInitialData) return;
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    setHasUnsavedChanges(false);
  }, [assets, groups, transactions, hasLoadedInitialData]);

  useEffect(() => {
    if (!hasLoadedInitialData) return;
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => persistChanges(), 1000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [assets, groups, transactions, persistChanges, hasLoadedInitialData]);

  const handleImportVault = (data: any) => {
    if (!data || typeof data !== 'object') {
      alert("Error: Invalid file format.");
      return;
    }
    if (!Array.isArray(data.assets) || !Array.isArray(data.transactions)) {
      alert("Error: This file is missing essential portfolio data.");
      return;
    }
    if (data.assets) setAssets(data.assets);
    if (data.groups) setGroups(data.groups);
    if (data.transactions) setTransactions(data.transactions);
    setHasUnsavedChanges(true);
    setTimeout(() => persistChanges(), 100);
    alert("Vault Restored! Data Integrity Verified.");
  };

  const handleExportVault = () => {
    const data = { 
      version: SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      assets, 
      groups, 
      transactions, 
      currency,
      metadata: { app: "Money Money Record", owner: currentUser.name }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const ts = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    link.href = url;
    link.download = `Vault-${ts}.money`;
    link.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
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

  // FIX: Aggregate history by DATE (YYYY-MM-DD) instead of full ISO timestamp
  const portfolioHistory = useMemo(() => {
    // Collect every unique date string (YYYY-MM-DD) from all assets
    const allDateStrings = Array.from(new Set<string>(
      assets.flatMap(a => a.priceHistory.map(p => p.date.split('T')[0]))
    )).sort();

    if (allDateStrings.length === 0) return [];

    return allDateStrings.map((dateStr: string) => {
      const valueAtEndOfDay = assets.reduce((acc, asset) => {
        // Find points for this asset on or before this date
        const relevantPoints = asset.priceHistory.filter(p => p.date.split('T')[0] <= dateStr);
        if (relevantPoints.length === 0) return acc;
        
        // The "latest" point for this day is the one with the highest ISO string (most recent)
        const latestPoint = relevantPoints.sort((a, b) => b.date.localeCompare(a.date))[0];
        return acc + latestPoint.value;
      }, 0);

      return { 
        date: new Date(dateStr).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), 
        fullDate: dateStr, 
        value: valueAtEndOfDay 
      };
    });
  }, [assets]);

  const handleAssetClick = (id: string) => { setSelectedAssetId(id); setCurrentScreen(Screen.ASSET_DETAIL); };
  const handleAddAsset = (newAsset: Omit<Asset, 'id' | 'order' | 'priceHistory'>) => {
    const assetId = Math.random().toString(36).substr(2, 9);
    const initialTx: Transaction = { id: Math.random().toString(36).substr(2, 9), assetId, ticker: newAsset.ticker, type: TransactionType.BUY, amount: newAsset.totalInvested, date: new Date().toISOString() };
    const newAssets = [...assets, { ...newAsset, id: assetId, order: assets.length, priceHistory: [] }];
    const newTransactions = [initialTx, ...transactions];
    setTransactions(newTransactions);
    setAssets(newAssets);
    syncAssetWithTransactions(assetId, newTransactions);
  };
  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const handleDeleteAsset = (id: string) => { setAssets(prev => prev.filter(a => a.id !== id)); setTransactions(prev => prev.filter(t => t.assetId !== id)); setCurrentScreen(Screen.DASHBOARD); setSelectedAssetId(null); };
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => { const txWithId: Transaction = { ...newTx, id: Math.random().toString(36).substr(2, 9) }; const updatedTransactions = [txWithId, ...transactions]; setTransactions(updatedTransactions); syncAssetWithTransactions(newTx.assetId, updatedTransactions); };
  const handleDeleteTransaction = (txId: string) => { const txToDelete = transactions.find(t => t.id === txId); const updatedTransactions = transactions.filter(t => t.id !== txId); setTransactions(updatedTransactions); if (txToDelete) syncAssetWithTransactions(txToDelete.assetId, updatedTransactions); };
  const handleAddGroup = (name: string) => { setGroups(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, color: '#6366f1' }]); };
  const handleDeleteGroup = (groupId: string) => { setAssets(prev => prev.map(a => a.groupId === groupId ? { ...a, groupId: undefined } : a)); setGroups(prev => prev.filter(g => g.id !== groupId)); };
  const handleMoveToGroup = (assetId: string, groupId?: string) => setAssets(prev => prev.map(a => a.id === assetId ? { ...a, groupId } : a));
  const handleReorderAssets = (newAssets: Asset[]) => setAssets(newAssets.map((a, i) => ({ ...a, order: i })));
  const handleResetData = () => { if (window.confirm("Wipe all local data? This cannot be undone!")) { setAssets([]); setGroups([]); setTransactions([]); localStorage.clear(); window.location.reload(); } };

  return (
    <div className="dark min-h-screen bg-slate-950">
      <Layout currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} isDarkMode={isDarkMode} currentUser={currentUser}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-screen">
          {currentScreen === Screen.DASHBOARD && <Dashboard stats={portfolioStats} assets={assets} groups={groups} portfolioHistory={portfolioHistory} currency={currency} onAssetClick={handleAssetClick} onAddAsset={handleAddAsset} onAddGroup={handleAddGroup} onDeleteGroup={handleDeleteGroup} onMoveToGroup={handleDeleteGroup} onReorderAssets={handleReorderAssets} transactions={transactions} hasUnsavedChanges={hasUnsavedChanges} onExportVault={handleExportVault} />}
          {currentScreen === Screen.ACTIVITY && <Activity transactions={transactions} currency={currency} />}
          {currentScreen === Screen.SETTINGS && <Settings onResetData={handleResetData} currentUser={currentUser} onImportVault={handleImportVault} onExportVault={handleExportVault} assets={assets} transactions={transactions} />}
          {currentScreen === Screen.ASSET_DETAIL && selectedAssetId && assets.find(a => a.id === selectedAssetId) && <AssetDetail asset={assets.find(a => a.id === selectedAssetId)!} transactions={transactions.filter(t => t.assetId === selectedAssetId)} currency={currency} onBack={() => setCurrentScreen(Screen.DASHBOARD)} onDelete={() => handleDeleteAsset(selectedAssetId)} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateAsset={handleUpdateAsset} />}
        </div>
      </Layout>
    </div>
  );
};

export default App;