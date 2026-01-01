import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PortfolioStats, Asset, AssetGroup, TransactionType } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, FolderPlus, X, Folder, GripVertical, Trash2, Target, Scale, FileJson, Layers } from 'lucide-react';
import { Portfolio } from './Portfolio';

interface DashboardProps {
  stats: PortfolioStats;
  assets: Asset[];
  groups: AssetGroup[];
  portfolioHistory: { date: string, fullDate: string, value: number }[];
  currency: string;
  onAssetClick: (id: string) => void;
  onAddAsset: (asset: Omit<Asset, 'id' | 'order' | 'priceHistory'>) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onMoveToGroup: (assetId: string, groupId?: string) => void;
  onReorderAssets: (assets: Asset[]) => void;
  transactions: any[];
  hasUnsavedChanges: boolean;
  onExportVault: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Stock': '#6366f1',
  'ETF': '#10b981',
  'Crypto': '#f59e0b',
  'Cash': '#94a3b8'
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  stats, assets, groups, portfolioHistory, currency, onAssetClick, onAddAsset, onAddGroup, onDeleteGroup, onMoveToGroup, onReorderAssets, transactions, hasUnsavedChanges, onExportVault
}) => {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showPurchaseDots, setShowPurchaseDots] = useState(true);
  const [sliderVal, setSliderVal] = useState(100);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null | 'unassigned'>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) setSliderVal((scrollLeft / maxScroll) * 100);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSliderVal(val);
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      scrollContainerRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [portfolioHistory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: currency }).format(val);
  };

  const lastValue = portfolioHistory.length > 1 ? portfolioHistory[portfolioHistory.length - 2].value : stats.totalValue;
  const recentChangeAmt = stats.totalValue - lastValue;

  const allocationData = useMemo(() => {
    return assets.map(a => ({ name: a.ticker, value: a.currentValue, color: a.color }))
      .filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [assets]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    assets.forEach(asset => {
      totals[asset.category] = (totals[asset.category] || 0) + asset.currentValue;
    });
    return Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#6366f1' }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => a.order - b.order);
  }, [assets]);

  const chartWidth = Math.max(400, portfolioHistory.length * 45);

  const formatXAxis = (tickItem: string) => {
    const d = new Date(tickItem);
    const now = new Date();
    if (d.getFullYear() !== now.getFullYear()) return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderCustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!showPurchaseDots) return null;
    const hasPurchase = transactions.some(t => t.type === TransactionType.BUY && new Date(t.date).toDateString() === new Date(payload.fullDate).toDateString());
    if (hasPurchase) {
      return (
        <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="#4f46e5" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="2" />
        </svg>
      );
    }
    return null;
  };

  // REORDERING LOGIC
  const handleDragStart = (id: string) => {
    setTimeout(() => setDraggedAssetId(id), 0);
  };

  const handleDragEnd = () => {
    setDraggedAssetId(null);
    setDropTargetId(null);
  };

  const handleDropOnGroup = (groupId?: string) => {
    if (draggedAssetId) {
      onMoveToGroup(draggedAssetId, groupId);
    }
    handleDragEnd();
  };

  const handleDropOnAsset = (targetAssetId: string) => {
    if (!draggedAssetId || draggedAssetId === targetAssetId) return;

    const currentAssets = [...sortedAssets];
    const dragIdx = currentAssets.findIndex(a => a.id === draggedAssetId);
    const targetIdx = currentAssets.findIndex(a => a.id === targetAssetId);
    
    if (dragIdx === -1 || targetIdx === -1) return;

    const [draggedItem] = currentAssets.splice(dragIdx, 1);
    const targetItem = currentAssets[targetIdx];
    
    // Update the dragged item's group to match the target's group
    draggedItem.groupId = targetItem.groupId;
    
    // Insert at the target position
    currentAssets.splice(targetIdx, 0, draggedItem);
    
    onReorderAssets(currentAssets);
    handleDragEnd();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex justify-between items-start">
          <div className="animate-in slide-in-from-left duration-500">
            <p className="text-slate-500 font-medium text-sm">Portfolio Value</p>
            <h1 className="text-4xl font-bold tracking-tight">
              {formatCurrency(stats.totalValue)}
            </h1>
          </div>
          <div className="flex space-x-2 animate-in slide-in-from-right duration-500">
            <button 
              onClick={onExportVault} 
              className={`p-3 rounded-2xl transition-all relative ${hasUnsavedChanges ? 'bg-indigo-600 text-white shadow-lg save-pulse' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
              title="Save Vault File (.money)"
            >
               <FileJson size={22} />
               {hasUnsavedChanges && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-slate-950 rounded-full"></span>
               )}
            </button>
            <button onClick={() => setIsFolderModalOpen(true)} className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors">
               <FolderPlus size={22} />
            </button>
          </div>
        </div>
        
        <div className="flex space-x-4 items-center pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Growth</span>
            <span className={`flex items-center text-sm font-bold ${recentChangeAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {recentChangeAmt >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
              {formatCurrency(Math.abs(recentChangeAmt))}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Return</span>
            <span className={`flex items-center text-sm font-bold ${stats.totalReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.totalReturn >= 0 ? '+' : ''}{formatCurrency(stats.totalReturn)} ({stats.totalReturnPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Performance</h3>
            <button 
              onClick={() => setShowPurchaseDots(!showPurchaseDots)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showPurchaseDots ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
            >
              <Target size={12} />
              <span>MARKERS</span>
            </button>
          </div>
          
          <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing">
            <div style={{ width: chartWidth }} className="h-64 px-4 py-6">
              {portfolioHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory} margin={{ top: 10, bottom: 0, left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="fullDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} tickFormatter={formatXAxis} dy={10} interval={portfolioHistory.length > 10 ? Math.floor(portfolioHistory.length / 8) : 0} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', padding: '12px' }} labelFormatter={(label) => new Date(label).toLocaleString()} labelStyle={{ color: '#818cf8', fontWeight: 800, fontSize: '10px' }} itemStyle={{ color: '#f8fafc', fontSize: '14px', fontWeight: 700 }} formatter={(value: number) => [formatCurrency(value), 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" animationDuration={1000} dot={renderCustomizedDot} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center">No history recorded</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 pb-6 pt-2">
            <div className="flex items-center space-x-4">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Past</span>
              <input type="range" min="0" max="100" step="0.1" value={sliderVal} onChange={handleSliderChange} className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none" />
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Now</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allocationData.length > 0 && (
            <div className="bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-800 p-6 flex items-center space-x-6">
              <div className="w-1/3 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" animationDuration={1500}>
                      {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Scale size={16} className="text-slate-700" /></div>
              </div>
              <div className="flex-1 space-y-3 overflow-hidden">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Mix</h3>
                <div className="grid grid-cols-1 gap-y-1.5">
                  {allocationData.slice(0, 4).map((item, idx) => {
                    const weight = stats.totalValue > 0 ? (item.value / stats.totalValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-1.5 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-slate-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{weight.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {categoryData.length > 0 && (
            <div className="bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-800 p-6 flex items-center space-x-6">
              <div className="w-1/3 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" animationDuration={1500}>
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Layers size={16} className="text-slate-700" /></div>
              </div>
              <div className="flex-1 space-y-3 overflow-hidden">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Allocation</h3>
                <div className="grid grid-cols-1 gap-y-1.5">
                  {categoryData.map((item, idx) => {
                    const weight = stats.totalValue > 0 ? (item.value / stats.totalValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-1.5 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-slate-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{weight.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-6">
        {groups.map(group => {
          const groupAssets = sortedAssets.filter(a => a.groupId === group.id);
          const groupValue = groupAssets.reduce((acc, a) => acc + a.currentValue, 0);
          const isOver = dropTargetId === group.id;
          return (
            <div key={group.id} onDragOver={(e) => { e.preventDefault(); setDropTargetId(group.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={() => handleDropOnGroup(group.id)} className="space-y-3">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center space-x-2">
                    <Folder size={18} className={`${isOver ? 'text-indigo-400 scale-125' : 'text-slate-500'} transition-all`} />
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isOver ? 'text-indigo-400' : 'text-slate-400'}`}>{group.name}</h3>
                    <button onClick={() => onDeleteGroup(group.id)} className="ml-2 p-1 text-slate-700 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                 </div>
                 <span className="text-xs font-bold text-slate-500">{formatCurrency(groupValue)}</span>
              </div>
              <div className={`space-y-3 p-2 rounded-[2rem] border-2 border-dashed min-h-[80px] transition-all ${isOver ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-slate-900/30 border-slate-800'}`}>
                {groupAssets.map(asset => (
                  <AssetItemRow 
                    key={asset.id} 
                    asset={asset} 
                    formatCurrency={formatCurrency} 
                    onAssetClick={onAssetClick} 
                    onDragStart={() => handleDragStart(asset.id)} 
                    onDragEnd={handleDragEnd}
                    onDropOnAsset={handleDropOnAsset}
                    isDragged={draggedAssetId === asset.id} 
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        <div onDragOver={(e) => { e.preventDefault(); setDropTargetId('unassigned'); }} onDragLeave={() => setDropTargetId(null)} onDrop={() => handleDropOnGroup(undefined)} className={`space-y-4 rounded-[2.5rem] transition-all ${dropTargetId === 'unassigned' ? 'ring-2 ring-indigo-500/50 border-2 border-indigo-400 border-dashed p-4' : ''}`}>
          <Portfolio 
            assets={sortedAssets.filter(a => !a.groupId)} 
            currency={currency} 
            onAssetClick={onAssetClick} 
            onAddAsset={onAddAsset} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
            onDropOnAsset={handleDropOnAsset}
            draggedAssetId={draggedAssetId} 
            embedded={true} 
          />
        </div>
      </section>

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="bg-slate-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-800">
            <button onClick={() => setIsFolderModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-500"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6">Create Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddGroup(newFolderName); setNewFolderName(''); setIsFolderModalOpen(false); }} className="space-y-4">
              <input required autoFocus placeholder="e.g. Retirement" className="w-full bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-600" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Create Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetItemRow = ({ asset, formatCurrency, onAssetClick, onDragStart, onDragEnd, onDropOnAsset, isDragged }: any) => {
  const returnAmt = asset.currentValue - asset.totalInvested;
  const returnPct = asset.totalInvested > 0 ? (returnAmt / asset.totalInvested) * 100 : 0;
  
  return (
    <div 
      draggable 
      onDragStart={onDragStart} 
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.stopPropagation(); onDropOnAsset(asset.id); }}
      onClick={() => onAssetClick(asset.id)} 
      className={`bg-slate-900 p-4 rounded-3xl shadow-sm border transition-all flex justify-between items-center group cursor-pointer ${
        isDragged 
          ? 'opacity-20 scale-95 border-indigo-500 ring-2 ring-indigo-500/20' 
          : 'opacity-100 border-slate-800 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-[100px]">
        <div className="p-1 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="text-slate-600 opacity-40 group-hover:opacity-100" />
        </div>
        {asset.icon ? (
          <img src={asset.icon} className="w-9 h-9 rounded-2xl object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: asset.color }}>
            {asset.ticker.slice(0, 2)}
          </div>
        )}
        <div className="overflow-hidden">
          <h4 className="font-bold text-slate-100 truncate text-sm">{asset.ticker}</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter truncate">{asset.category}</p>
        </div>
      </div>
      
      <div className="flex-1 h-8 mx-4 opacity-30 group-hover:opacity-100 transition-opacity">
        {asset.priceHistory && asset.priceHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={asset.priceHistory}>
              <Line type="monotone" dataKey="value" stroke={returnAmt >= 0 ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full border-b border-slate-800 opacity-20"></div>
        )}
      </div>

      <div className="text-right min-w-[80px]">
        <p className="font-bold text-slate-100 text-sm">{formatCurrency(asset.currentValue)}</p>
        <div className={`text-[10px] font-black ${returnAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {returnPct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};