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

const App: React.FC = () => {
  // Hardcoded for local use
  const currentUser: User = { id: 'local_user', name: 'Desmond' };
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currency = 'MYR'; // Forced MYR
  const isDarkMode = true; // Permanent Dark Mode
  
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  // Initial Load from LocalStorage
  useEffect(() => {
    const savedAssets = localStorage.getItem(STORAGE_KEY_ASSETS);
    const savedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const savedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

    setHasLoadedInitialData(true);
  }, []);

  // Auto-save to LocalStorage
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
    if (data.assets) setAssets(data.assets);
    if (data.groups) setGroups(data.groups);
    if (data.transactions) setTransactions(data.transactions);
    setHasUnsavedChanges(true);
    setTimeout(() => persistChanges(), 100);
    alert("Vault File Imported Successfully!");
  };

  const handleExportVault = () => {
    const data = { assets, groups, transactions, currency, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-vault-${new Date().toISOString().split('T')[0]}.money`;
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
  const handleResetData = () => { if (window.confirm("Wipe all local data?")) { setAssets([]); setGroups([]); setTransactions([]); localStorage.clear(); window.location.reload(); } };

  return (
    <div className="dark min-h-screen bg-slate-950">
      <Layout currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} isDarkMode={isDarkMode} currentUser={currentUser}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-screen">
          {currentScreen === Screen.DASHBOARD && <Dashboard stats={portfolioStats} assets={assets} groups={groups} portfolioHistory={portfolioHistory} currency={currency} onAssetClick={handleAssetClick} onAddAsset={handleAddAsset} onAddGroup={handleAddGroup} onDeleteGroup={handleDeleteGroup} onMoveToGroup={handleMoveToGroup} onReorderAssets={handleReorderAssets} transactions={transactions} hasUnsavedChanges={hasUnsavedChanges} onExportVault={handleExportVault} />}
          {currentScreen === Screen.ACTIVITY && <Activity transactions={transactions} currency={currency} />}
          {currentScreen === Screen.SETTINGS && <Settings onResetData={handleResetData} currentUser={currentUser} onImportVault={handleImportVault} onExportVault={handleExportVault} />}
          {currentScreen === Screen.ASSET_DETAIL && selectedAssetId && assets.find(a => a.id === selectedAssetId) && <AssetDetail asset={assets.find(a => a.id === selectedAssetId)!} transactions={transactions.filter(t => t.assetId === selectedAssetId)} currency={currency} onBack={() => setCurrentScreen(Screen.DASHBOARD)} onDelete={() => handleDeleteAsset(selectedAssetId)} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateAsset={handleUpdateAsset} />}
        </div>
      </Layout>
    </div>
  );
};

export default App;