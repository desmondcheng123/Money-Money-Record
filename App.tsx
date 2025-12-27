import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Activity } from './components/Activity';
import { Settings } from './components/Settings';
import { AssetDetail } from './components/AssetDetail';
import { Auth } from './components/Auth';
import { Screen, Asset, Transaction, TransactionType, AssetGroup, PricePoint, User } from './types';
import { INITIAL_ASSETS, INITIAL_TRANSACTIONS } from './mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('zeninvest_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const userSuffix = currentUser ? `_${currentUser.id}` : '';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'MYR'>('USD');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Load user data on login
  useEffect(() => {
    if (currentUser) {
      const savedAssets = localStorage.getItem(`zeninvest_assets${userSuffix}`);
      const savedGroups = localStorage.getItem(`zeninvest_groups${userSuffix}`);
      const savedTransactions = localStorage.getItem(`zeninvest_transactions${userSuffix}`);
      const savedCurrency = localStorage.getItem(`zeninvest_currency${userSuffix}`) as 'USD' | 'MYR';
      const savedDark = localStorage.getItem(`zeninvest_darkmode${userSuffix}`) === 'true';

      setAssets(savedAssets ? JSON.parse(savedAssets) : []);
      setGroups(savedGroups ? JSON.parse(savedGroups) : []);
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
      setCurrency(savedCurrency || 'USD');
      setIsDarkMode(savedDark || false);
    }
  }, [currentUser, userSuffix]);

  // Sync / URL Import Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get('import');
    if (syncData) {
      try {
        const decoded = JSON.parse(atob(syncData));
        if (window.confirm(`Found sync data for ${decoded.user?.name || 'an account'}! Import it now?`)) {
          handleLogin(decoded.user, decoded);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Failed to parse sync data");
      }
    }
  }, []);

  useEffect(() => { 
    if (currentUser) {
      localStorage.setItem(`zeninvest_assets${userSuffix}`, JSON.stringify(assets));
      localStorage.setItem(`zeninvest_groups${userSuffix}`, JSON.stringify(groups));
      localStorage.setItem(`zeninvest_transactions${userSuffix}`, JSON.stringify(transactions));
      localStorage.setItem(`zeninvest_currency${userSuffix}`, currency);
      localStorage.setItem(`zeninvest_darkmode${userSuffix}`, String(isDarkMode));
    }
  }, [assets, groups, transactions, currency, isDarkMode, currentUser, userSuffix]);

  const handleLogin = (user: User, importedData?: any) => {
    setCurrentUser(user);
    localStorage.setItem('zeninvest_current_user', JSON.stringify(user));
    
    if (importedData) {
      setAssets(importedData.assets);
      setGroups(importedData.groups || []);
      setTransactions(importedData.transactions);
      setCurrency(importedData.currency || 'USD');
    }
  };

  const handleLogout = () => {
    if (window.confirm("Log out of this profile?")) {
      setCurrentUser(null);
      localStorage.removeItem('zeninvest_current_user');
      setCurrentScreen(Screen.DASHBOARD);
    }
  };

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
      localStorage.removeItem(`zeninvest_assets${userSuffix}`);
      localStorage.removeItem(`zeninvest_groups${userSuffix}`);
      localStorage.removeItem(`zeninvest_transactions${userSuffix}`);
      setCurrentScreen(Screen.DASHBOARD);
    }
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const assetTransactions = transactions.filter(t => t.assetId === selectedAssetId);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Layout 
        currentScreen={currentScreen} 
        setCurrentScreen={setCurrentScreen}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
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
              assets={assets}
              transactions={transactions}
              groups={groups}
              currentUser={currentUser}
              onLogout={handleLogout}
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