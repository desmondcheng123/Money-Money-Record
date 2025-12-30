
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PortfolioStats, Asset, AssetGroup, TransactionType } from '../types';
import { 
  AreaChart,
  Area,
  XAxis,
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
// Added ArrowRight to imports from lucide-react
import { TrendingDown, ArrowUpRight, ArrowDownRight, ArrowRight, FolderPlus, X, Folder, GripVertical, Trash2, Edit3, Target, Scale, Cloud, Share2, Download, AlertCircle, RefreshCw, Mail, CheckCircle2, CloudOff, Zap, ShieldAlert } from 'lucide-react';
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
  syncState: 'IDLE' | 'SAVING' | 'ERROR';
  lastSyncTimestamp: string | null;
  isCloudActive: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  stats, assets, groups, portfolioHistory, currency, onAssetClick, onAddAsset, onAddGroup, onDeleteGroup, onMoveToGroup, onReorderAssets, transactions, syncState, lastSyncTimestamp, isCloudActive
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
      // Fix: Correctly destructure scrollWidth and clientWidth from the ref current element
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
  };

  const lastValue = portfolioHistory.length > 1 ? portfolioHistory[portfolioHistory.length - 2].value : stats.totalValue;
  const recentChangeAmt = stats.totalValue - lastValue;

  const allocationData = useMemo(() => {
    return assets.map(a => ({ name: a.ticker, value: a.currentValue, color: a.color }))
      .filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [assets]);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddGroup(newFolderName.trim());
      setNewFolderName('');
      setIsFolderModalOpen(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string | null | 'unassigned') => {
    e.preventDefault();
    setDropTargetId(targetId);
  };

  const handleDropOnGroup = (groupId?: string) => {
    if (draggedAssetId) {
      onMoveToGroup(draggedAssetId, groupId);
      setDraggedAssetId(null);
      setDropTargetId(null);
    }
  };

  const handleDropOnAsset = (targetAssetId: string) => {
    if (!draggedAssetId || draggedAssetId === targetAssetId) return;
    const sourceIdx = assets.findIndex(a => a.id === draggedAssetId);
    const targetIdx = assets.findIndex(a => a.id === targetAssetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const newAssets = [...assets];
    const [removed] = newAssets.splice(sourceIdx, 1);
    newAssets.splice(targetIdx, 0, { ...removed, groupId: newAssets[targetIdx].groupId });
    onReorderAssets(newAssets);
    setDraggedAssetId(null);
    setDropTargetId(null);
  };

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex justify-between items-start">
          <div className="animate-in slide-in-from-left duration-500">
            <div className="flex items-center space-x-2">
              <p className="text-slate-500 font-medium text-sm">Portfolio Value</p>
              <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${!isCloudActive ? 'bg-amber-100 text-amber-600' : syncState === 'SAVING' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {!isCloudActive ? <CloudOff size={10} /> : syncState === 'SAVING' ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} className="cloud-live" />}
                <span>{!isCloudActive ? 'Local Vault' : syncState === 'SAVING' ? 'Syncing...' : 'Cloud Active'}</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              {formatCurrency(stats.totalValue)}
            </h1>
          </div>
          <div className="flex space-x-2 animate-in slide-in-from-right duration-500">
            <button onClick={() => setIsFolderModalOpen(true)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 transition-colors">
               <FolderPlus size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1.5 pt-1 animate-in slide-in-from-bottom duration-500 delay-150">
          <div className="flex space-x-4 items-center">
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
        </div>
      </header>

      {!isCloudActive && (
        <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 text-white flex items-center justify-between group cursor-pointer" onClick={() => window.location.reload()}>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl"><Zap size={20} className="animate-pulse" /></div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Sync Unavailable</p>
                 <p className="text-xs font-bold leading-tight">Click to setup Manual Cloud Link</p>
              </div>
           </div>
           {/* Fixed: ArrowRight is now correctly imported */}
           <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Performance</h3>
            <button 
              onClick={() => setShowPurchaseDots(!showPurchaseDots)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showPurchaseDots ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
            >
              <Target size={12} />
              <span>MARKERS</span>
            </button>
          </div>
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
          >
            <div style={{ width: chartWidth }} className="h-64 px-4 py-6">
              {portfolioHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory} margin={{ top: 10, bottom: 0, left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="fullDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={formatXAxis} dy={10} interval={portfolioHistory.length > 10 ? Math.floor(portfolioHistory.length / 8) : 0} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', padding: '12px' }} labelFormatter={(label) => new Date(label).toLocaleString()} labelStyle={{ color: '#818cf8', fontWeight: 800, fontSize: '10px' }} itemStyle={{ color: '#f8fafc', fontSize: '14px', fontWeight: 700 }} formatter={(value: number) => [formatCurrency(value), 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" animationDuration={1000} dot={renderCustomizedDot} />
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
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Past</span>
              <input type="range" min="0" max="100" step="0.1" value={sliderVal} onChange={handleSliderChange} className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none" />
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Now</span>
            </div>
          </div>
        </div>

        {allocationData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center space-x-6">
            <div className="w-1/3 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" animationDuration={1500}>
                    {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Scale size={16} className="text-slate-300" /></div>
            </div>
            <div className="flex-1 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mix</h3>
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">Actual %</span>
              </div>
              <div className="grid grid-cols-1 gap-y-1.5">
                {allocationData.slice(0, 4).map((item, idx) => {
                  const weight = stats.totalValue > 0 ? (item.value / stats.totalValue) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
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

      <section className="space-y-6">
        {groups.map(group => {
          const groupAssets = sortedAssets.filter(a => a.groupId === group.id);
          const groupValue = groupAssets.reduce((acc, a) => acc + a.currentValue, 0);
          const isOver = dropTargetId === group.id;
          return (
            <div key={group.id} onDragOver={(e) => handleDragOver(e, group.id)} onDragLeave={() => setDropTargetId(null)} onDrop={() => handleDropOnGroup(group.id)} className="space-y-3">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center space-x-2">
                    <Folder size={18} className={`${isOver ? 'text-indigo-600 scale-125' : 'text-indigo-400'} transition-all`} />
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isOver ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>{group.name}</h3>
                    <button onClick={() => onDeleteGroup(group.id)} className="ml-2 p-1 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                 </div>
                 <span className="text-xs font-bold text-slate-400">{formatCurrency(groupValue)}</span>
              </div>
              <div className={`space-y-3 p-2 rounded-[2rem] border-2 border-dashed min-h-[80px] transition-all ${isOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-400' : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
                {groupAssets.map(asset => <AssetItemRow key={asset.id} asset={asset} formatCurrency={formatCurrency} onAssetClick={onAssetClick} onDragStart={() => setDraggedAssetId(asset.id)} onDropOnAsset={handleDropOnAsset} isDragged={draggedAssetId === asset.id} />)}
              </div>
            </div>
          );
        })}
        <div onDragOver={(e) => handleDragOver(e, 'unassigned')} onDragLeave={() => setDropTargetId(null)} onDrop={() => handleDropOnGroup(undefined)} className={`space-y-4 rounded-[2.5rem] transition-all ${dropTargetId === 'unassigned' ? 'ring-4 ring-indigo-500/20 border-2 border-indigo-400 border-dashed p-4' : ''}`}>
          <Portfolio assets={sortedAssets.filter(a => !a.groupId)} currency={currency} onAssetClick={onAssetClick} onAddAsset={onAddAsset} onDragStart={(id) => setDraggedAssetId(id)} onDropOnAsset={handleDropOnAsset} draggedAssetId={draggedAssetId} embedded={true} />
        </div>
      </section>

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsFolderModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6">Create Group</h3>
            <form onSubmit={handleAddFolder} className="space-y-4">
              <input required autoFocus placeholder="e.g. Retirement" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm outline-none" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20">Create Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetItemRow = ({ asset, formatCurrency, onAssetClick, onDragStart, onDropOnAsset, isDragged }: any) => {
  const returnAmt = asset.currentValue - asset.totalInvested;
  const returnPct = asset.totalInvested > 0 ? (returnAmt / asset.totalInvested) * 100 : 0;
  return (
    <div draggable onDragStart={onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.stopPropagation(); onDropOnAsset(asset.id); }} onClick={() => onAssetClick(asset.id)} className={`bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border transition-all flex justify-between items-center group ${isDragged ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1'}`}>
      <div className="flex items-center space-x-3 min-w-[100px]">
        <div className="p-1 cursor-grab active:cursor-grabbing"><GripVertical size={16} className="text-slate-300 opacity-40 group-hover:opacity-100" /></div>
        {asset.icon ? <img src={asset.icon} className="w-9 h-9 rounded-2xl object-cover shadow-sm" /> : <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: asset.color }}>{asset.ticker.slice(0, 2)}</div>}
        <div className="overflow-hidden"><h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{asset.ticker}</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">{asset.category}</p></div>
      </div>
      <div className="flex-1 h-8 mx-4 opacity-50 group-hover:opacity-100 transition-opacity">
        {asset.priceHistory && asset.priceHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={asset.priceHistory}><Line type="monotone" dataKey="value" stroke={returnAmt >= 0 ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        ) : <div className="h-full w-full border-b border-slate-100 dark:border-slate-800 opacity-20"></div>}
      </div>
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatCurrency(asset.currentValue)}</p>
        <div className={`text-[10px] font-black ${returnAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{returnPct.toFixed(1)}%</div>
      </div>
    </div>
  );
};
import { LineChart, Line } from 'recharts';
