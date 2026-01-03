import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Asset, Transaction, TransactionType } from '../types';
import { ArrowLeft, Plus, History, Trash2, AlertCircle, X, ArrowUpRight, ArrowDownRight, TrendingUp, Edit2, Check, Target, Camera, Settings as SettingsIcon, Scale } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface AssetDetailProps {
  asset: Asset;
  transactions: Transaction[];
  currency: string;
  onBack: () => void;
  onDelete: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (txId: string) => void;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, transactions, currency, onBack, onDelete, onAddTransaction, onDeleteTransaction, onUpdateAsset }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showPurchaseDots, setShowPurchaseDots] = useState(true);
  const [sliderVal, setSliderVal] = useState(100);
  const [tempPrice, setTempPrice] = useState(asset.currentValue.toString());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [infoFormData, setInfoFormData] = useState({
    ticker: asset.ticker,
    name: asset.name,
    category: asset.category,
    icon: asset.icon,
  });

  const [txFormData, setTxFormData] = useState({
    type: TransactionType.BUY,
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

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
    setTempPrice(asset.currentValue.toString());
  }, [asset.currentValue]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [asset.priceHistory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: currency }).format(val);
  };

  const returnAmt = asset.currentValue - asset.totalInvested;
  const returnPct = asset.totalInvested > 0 ? (returnAmt / asset.totalInvested) * 100 : 0;

  const lastValue = useMemo(() => {
    if (asset.priceHistory.length > 1) {
      return asset.priceHistory[asset.priceHistory.length - 2].value;
    }
    return asset.currentValue;
  }, [asset.priceHistory, asset.currentValue]);

  const recentChangeAmt = asset.currentValue - lastValue;
  const recentChangePct = lastValue > 0 ? (recentChangeAmt / lastValue) * 100 : 0;

  const groupedPriceHistory = useMemo(() => {
    const dates = Array.from(new Set<string>(asset.priceHistory.map(p => p.date.split('T')[0]))).sort();
    return dates.map(dateStr => {
      const relevant = asset.priceHistory.filter(p => p.date.split('T')[0] === dateStr);
      const latest = relevant.sort((a, b) => b.date.localeCompare(a.date))[0];
      return { 
        date: dateStr, 
        value: latest.value 
      };
    });
  }, [asset.priceHistory]);

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = txFormData.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const now = new Date();
    localDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    onAddTransaction({ assetId: asset.id, ticker: asset.ticker, type: txFormData.type, amount: parseFloat(txFormData.amount), date: localDate.toISOString() });
    setIsRecording(false);
    setTxFormData({ type: TransactionType.BUY, amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSavePrice = () => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice !== asset.currentValue) {
      onAddTransaction({ assetId: asset.id, ticker: asset.ticker, type: TransactionType.PRICE_UPDATE, amount: newPrice, date: new Date().toISOString() });
    }
    setIsEditingPrice(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setInfoFormData(prev => ({ ...prev, icon: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAsset(asset.id, { 
      ticker: infoFormData.ticker.toUpperCase(), 
      name: infoFormData.name, 
      category: infoFormData.category, 
      icon: infoFormData.icon 
    });
    setIsEditingInfo(false);
  };

  const formatXAxis = (tickItem: string) => {
    const d = new Date(tickItem);
    const now = new Date();
    if (d.getFullYear() !== now.getFullYear()) return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const chartWidth = useMemo(() => {
    return Math.max(400, groupedPriceHistory.length * 50);
  }, [groupedPriceHistory]);

  const renderCustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!showPurchaseDots) return null;
    const hasPurchase = transactions.some(t => t.type === TransactionType.BUY && new Date(t.date).toDateString() === new Date(payload.date).toDateString());
    if (hasPurchase) {
      const color = returnAmt >= 0 ? "#10b981" : "#f43f5e";
      return (
        <svg x={cx - 5} y={cy - 5} width={10} height={10} fill={color} viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="2" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-slate-500 font-semibold hover:text-indigo-600 transition-colors"><ArrowLeft size={20} className="mr-2" /> Home</button>
        <div className="flex space-x-2">
          <button onClick={() => {
            // Re-sync local state with actual asset values when opening
            setInfoFormData({
              ticker: asset.ticker,
              name: asset.name,
              category: asset.category,
              icon: asset.icon,
            });
            setIsEditingInfo(true);
          }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"><SettingsIcon size={20} /></button>
          <button onClick={() => setShowConfirmDelete(true)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"><div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-[2rem] p-6 shadow-2xl text-center"><AlertCircle size={32} className="mx-auto text-rose-500 mb-2"/><h3 className="font-bold text-lg">Remove Asset?</h3><p className="text-sm text-slate-500 mb-6">Remove {asset.ticker} and all history?</p><div className="flex space-x-3"><button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 bg-slate-100 rounded-xl">No</button><button onClick={onDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">Yes</button></div></div></div>
      )}

      {isRecording && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"><div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative"><button onClick={() => setIsRecording(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button><h3 className="text-xl font-bold mb-6">Record Activity</h3><form onSubmit={handleRecordSubmit} className="space-y-4"><div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">{([TransactionType.BUY, TransactionType.SELL, TransactionType.DIVIDEND, TransactionType.PRICE_UPDATE]).map(t => (<button key={t} type="button" onClick={() => setTxFormData({...txFormData, type: t})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${txFormData.type === t ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t.replace('_', ' ')}</button>))}</div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Amount (MYR)</label><input required type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" value={txFormData.amount} onChange={e => setTxFormData({...txFormData, amount: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input required type="date" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 outline-none" value={txFormData.date} onChange={e => setTxFormData({...txFormData, date: e.target.value})} /></div><button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">Confirm Action</button></form></div></div>
      )}

      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsEditingInfo(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6">Edit Asset Details</h3>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 overflow-hidden group">
                  {infoFormData.icon ? <img src={infoFormData.icon} className="w-full h-full object-cover" /> : <><Camera size={24} className="text-slate-400 mb-1 group-hover:text-indigo-500" /><span className="text-[10px] text-slate-400 font-bold uppercase">Icon</span></>}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ticker</label>
                  <input required placeholder="AAPL" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={infoFormData.ticker} onChange={e => setInfoFormData({...infoFormData, ticker: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={infoFormData.category} 
                    onChange={e => setInfoFormData({...infoFormData, category: e.target.value as any})}
                  >
                    <option value="Stock">Stock</option>
                    <option value="ETF">ETF</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Asset Name</label>
                <input required placeholder="Apple Inc." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={infoFormData.name} onChange={e => setInfoFormData({...infoFormData, name: e.target.value})} />
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all mt-4">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {asset.icon ? <img src={asset.icon} className="w-14 h-14 rounded-3xl object-cover shadow-lg" /> : <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-bold text-white text-xl shadow-lg" style={{ backgroundColor: asset.color }}>{asset.ticker}</div>}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">{asset.ticker}</h2>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-500 rounded-md tracking-widest">{asset.category}</span>
            </div>
            <p className="text-sm text-slate-500">{asset.name}</p>
          </div>
        </div>
        <button onClick={() => setIsRecording(true)} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"><Plus size={20} /><span className="text-xs font-bold uppercase">Update</span></button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Holding Value</p>
              <div className="flex items-center space-x-3 mt-1">
                {isEditingPrice ? (
                  <div className="flex items-center space-x-2 w-full animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">RM</span>
                      <input autoFocus type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500 rounded-2xl pl-12 pr-4 py-2 text-2xl font-bold outline-none" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(); if (e.key === 'Escape') setIsEditingPrice(false); }} />
                    </div>
                    <button onClick={handleSavePrice} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg"><Check size={20} /></button>
                    <button onClick={() => setIsEditingPrice(false)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl"><X size={20} /></button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-4xl font-bold">{formatCurrency(asset.currentValue)}</p>
                    <button onClick={() => setIsEditingPrice(true)} className="p-2 text-slate-300 hover:text-indigo-500 transition-all"><Edit2 size={18} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-6 items-center border-t border-slate-50 dark:border-slate-800 pt-3 mt-1">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recent Movement</span>
              <div className={`flex items-center font-bold text-sm ${recentChangeAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {recentChangeAmt >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />} 
                {formatCurrency(Math.abs(recentChangeAmt))} ({recentChangePct.toFixed(1)}%)
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Return</span>
              <div className={`flex items-center font-bold text-sm ${returnAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {returnAmt >= 0 ? '+' : ''}{formatCurrency(returnAmt)} ({returnPct.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
          <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
            <div style={{ width: chartWidth }} className="h-64 px-4 py-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={groupedPriceHistory} margin={{ top: 10, bottom: 0, left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={returnAmt >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={returnAmt >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={formatXAxis} dy={10} interval={groupedPriceHistory.length > 10 ? Math.floor(groupedPriceHistory.length / 8) : 0} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', padding: '12px' }} labelStyle={{ color: returnAmt >= 0 ? '#34d399' : '#fb7185', fontWeight: 800, fontSize: '10px' }} itemStyle={{ color: '#f8fafc', fontSize: '14px', fontWeight: 700 }} formatter={(value: number) => [formatCurrency(value), 'Value']} />
                  <Area type="monotone" dataKey="value" stroke={returnAmt >= 0 ? "#10b981" : "#f43f5e"} strokeWidth={3} fillOpacity={1} fill="url(#colorAsset)" animationDuration={1000} dot={renderCustomizedDot} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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

      <div className="space-y-4">
        <div className="flex justify-between items-center"><h3 className="font-semibold flex items-center"><History size={18} className="mr-2 text-indigo-500" /> History</h3></div>
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
              <div className="flex items-center space-x-3"><button onClick={() => onDeleteTransaction(t.id)} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button><div><p className="text-xs font-bold">{t.type.replace('_', ' ')}</p><p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p></div></div>
              <p className={`font-bold text-sm ${t.type === TransactionType.SELL ? 'text-rose-500' : t.type === TransactionType.DIVIDEND ? 'text-emerald-500' : t.type === TransactionType.PRICE_UPDATE ? 'text-indigo-500' : ''}`}>
                {formatCurrency(t.amount)}
              </p>
            </div>
          ))}
          {transactions.length === 0 && <div className="text-center py-8 text-[10px] text-slate-400 font-bold uppercase">No records</div>}
        </div>
      </div>
    </div>
  );
};
