
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Activity } from './components/Activity';
import { Settings } from './components/Settings';
import { AssetDetail } from './components/AssetDetail';
import { Screen, Asset, Transaction, TransactionType, AssetGroup, PricePoint } from './types';
import { INITIAL_ASSETS, INITIAL_TRANSACTIONS } from './mockData';

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('zeninvest_assets');
    if (saved) return JSON.parse(saved);
    return INITIAL_ASSETS.map((a, i) => ({ ...a, order: i, priceHistory: a.priceHistory || [] }));
  });

  const [groups, setGroups] = useState<AssetGroup[]>(() => {
    const saved = localStorage.getItem('zeninvest_groups');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('zeninvest_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [currency, setCurrency] = useState<'USD' | 'MYR'>(() => {
    return (localStorage.getItem('zeninvest_currency') as 'USD' | 'MYR') || 'USD';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('zeninvest_darkmode') === 'true';
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('zeninvest_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('zeninvest_groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem('zeninvest_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('zeninvest_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('zeninvest_darkmode', String(isDarkMode)); }, [isDarkMode]);

  const syncAssetWithTransactions = useCallback((assetId: string, allTxs: Transaction[]) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === assetId) {
          const assetTxs = allTxs
            .filter(t => t.assetId === assetId)
            .sort((a, b) => a.date.localeCompare(b.date));

          let runningValue = 0;
          let runningInvested = 0;
          const history: PricePoint[] = [];

          assetTxs.forEach(tx => {
            if (tx.type === TransactionType.BUY) {
              runningValue += tx.amount;
              runningInvested += tx.amount;
            } else if (tx.type === TransactionType.SELL) {
              runningValue = Math.max(0, runningValue - tx.amount);
              runningInvested = Math.max(0, runningInvested - tx.amount);
            } else if (tx.type === TransactionType.PRICE_UPDATE) {
              runningValue = tx.amount;
            } else if (tx.type === TransactionType.DIVIDEND) {
              runningValue += tx.amount;
            }
            history.push({ date: tx.date, value: runningValue });
          });

          return {
            ...asset,
            currentValue: runningValue,
            totalInvested: runningInvested,
            priceHistory: history
          };
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
        const prevPoints = asset.priceHistory
          .filter(p => p.date < timestamp)
          .sort((a, b) => b.date.localeCompare(a.date));
        return acc + (prevPoints.length > 0 ? prevPoints[0].value : 0);
      }, 0);
      const dateObj = new Date(timestamp);
      return { 
        date: dateObj.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), 
        fullDate: timestamp, 
        value 
      };
    });
  }, [assets]);

  const handleAssetClick = (id: string) => {
    setSelectedAssetId(id);
    setCurrentScreen(Screen.ASSET_DETAIL);
  };

  const handleAddAsset = (newAsset: Omit<Asset, 'id' | 'order' | 'priceHistory'>) => {
    const assetId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const initialTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: assetId,
      ticker: newAsset.ticker,
      type: TransactionType.BUY,
      amount: newAsset.totalInvested,
      date: new Date(Date.now() - 1000).toISOString()
    };
    const newAssets = [...assets, {
      ...newAsset,
      id: assetId,
      order: assets.length,
      priceHistory: []
    }];
    const newTransactions = [initialTx, ...transactions];
    setTransactions(newTransactions);
    setAssets(newAssets);
    if (newAsset.currentValue !== newAsset.totalInvested) {
      const updateTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        assetId: assetId,
        ticker: newAsset.ticker,
        type: TransactionType.PRICE_UPDATE,
        amount: newAsset.currentValue,
        date: now
      };
      const finalTxs = [updateTx, ...newTransactions];
      setTransactions(finalTxs);
      syncAssetWithTransactions(assetId, finalTxs);
    } else {
      syncAssetWithTransactions(assetId, newTransactions);
    }
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setTransactions(prev => prev.filter(t => t.assetId !== id));
    setCurrentScreen(Screen.DASHBOARD);
    setSelectedAssetId(null);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const txWithId: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedTransactions = [txWithId, ...transactions];
    setTransactions(updatedTransactions);
    syncAssetWithTransactions(newTx.assetId, updatedTransactions);
  };

  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = transactions.find(t => t.id === txId);
    const updatedTransactions = transactions.filter(t => t.id !== txId);
    setTransactions(updatedTransactions);
    if (txToDelete) {
      syncAssetWithTransactions(txToDelete.assetId, updatedTransactions);
    }
  };

  const handleAddGroup = (name: string) => {
    const newGroup: AssetGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
    setAssets(prev => prev.map(a => a.groupId === groupId ? { ...a, groupId: undefined } : a));
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleMoveToGroup = (assetId: string, groupId?: string) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, groupId } : a));
  };

  const handleReorderAssets = (newAssets: Asset[]) => {
    setAssets(newAssets.map((a, i) => ({ ...a, order: i })));
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all portfolio data? This cannot be undone.")) {
      setAssets([]);
      setGroups([]);
      setTransactions([]);
      localStorage.removeItem('zeninvest_assets');
      localStorage.removeItem('zeninvest_groups');
      localStorage.removeItem('zeninvest_transactions');
      setCurrentScreen(Screen.DASHBOARD);
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const assetTransactions = transactions.filter(t => t.assetId === selectedAssetId);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Layout 
        currentScreen={currentScreen} 
        setCurrentScreen={setCurrentScreen}
        isDarkMode={isDarkMode}
      >
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-screen transition-colors duration-500">
          {currentScreen === Screen.DASHBOARD && (
            <Dashboard 
              stats={portfolioStats} 
              assets={assets} 
              groups={groups}
              portfolioHistory={portfolioHistory}
              currency={currency} 
              onAssetClick={handleAssetClick}
              onAddAsset={handleAddAsset}
              onAddGroup={handleAddGroup}
              onDeleteGroup={handleDeleteGroup}
              onMoveToGroup={handleMoveToGroup}
              onReorderAssets={handleReorderAssets}
              transactions={transactions}
            />
          )}
          {currentScreen === Screen.ACTIVITY && (
            <Activity transactions={transactions} currency={currency} />
          )}
          {currentScreen === Screen.SETTINGS && (
            <Settings 
              currency={currency} 
              setCurrency={setCurrency} 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode} 
              onResetData={handleResetData}
            />
          )}
          {currentScreen === Screen.ASSET_DETAIL && selectedAsset && (
            <AssetDetail 
              asset={selectedAsset} 
              transactions={assetTransactions}
              currency={currency} 
              onBack={() => setCurrentScreen(Screen.DASHBOARD)} 
              onDelete={() => handleDeleteAsset(selectedAsset.id)}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateAsset={handleUpdateAsset}
            />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default App;
