import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import { Plus, X, Camera, GripVertical } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PortfolioProps {
  assets: Asset[];
  currency: string;
  onAssetClick: (id: string) => void;
  onAddAsset: (asset: Omit<Asset, 'id' | 'order' | 'priceHistory'>) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  draggedAssetId?: string | null;
  embedded?: boolean;
}

export const Portfolio: React.FC<PortfolioProps> = ({ 
  assets, currency, onAssetClick, onAddAsset, onDragStart, onDragEnd, draggedAssetId, embedded = false 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconPreview, setIconPreview] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    category: 'Stock' as const,
    currentValue: '',
    totalInvested: '',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
    }).format(val);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setIconPreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAsset({
      ticker: formData.ticker.toUpperCase(),
      name: formData.name,
      category: formData.category,
      currentValue: parseFloat(formData.currentValue),
      totalInvested: parseFloat(formData.totalInvested),
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      icon: iconPreview
    });
    setIsAdding(false);
    setIconPreview(undefined);
    setFormData({ ticker: '', name: '', category: 'Stock', currentValue: '', totalInvested: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold">{embedded ? 'Assets' : 'My Assets'}</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl shadow-md text-[10px] font-bold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus size={14} className="inline mr-1" /> Add Asset
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-6">New Asset</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 overflow-hidden group">
                  {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <><Camera size={24} className="text-slate-400 mb-1 group-hover:text-indigo-500" /><span className="text-[10px] text-slate-400 font-bold uppercase">Icon</span></>}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ticker</label>
                  <input required placeholder="AAPL" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.ticker} onChange={e => setFormData({...formData, ticker: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                    <option value="Stock">Stock</option><option value="ETF">ETF</option><option value="Crypto">Crypto</option><option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Current Value (RM)</label>
                <input required type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.currentValue} onChange={e => setFormData({...formData, currentValue: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Invested (RM)</label>
                <input required type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.totalInvested} onChange={e => setFormData({...formData, totalInvested: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all">Create Asset</button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {assets.map((asset) => (
          <AssetItemRow 
            key={asset.id}
            asset={asset}
            formatCurrency={formatCurrency}
            onAssetClick={onAssetClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragged={draggedAssetId === asset.id}
          />
        ))}
        {assets.length === 0 && (
          <div className="text-center py-10 opacity-20">
             <p className="text-[10px] font-black uppercase tracking-widest">No unassigned assets</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AssetItemRow = ({ asset, formatCurrency, onAssetClick, onDragStart, onDragEnd, isDragged }: any) => {
  const returnAmt = asset.currentValue - asset.totalInvested;
  const returnPct = asset.totalInvested > 0 ? (returnAmt / asset.totalInvested) * 100 : 0;

  return (
    <div 
      draggable 
      onDragStart={() => onDragStart?.(asset.id)}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => onAssetClick(asset.id)}
      className={`bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border transition-all duration-300 flex justify-between items-center cursor-pointer group ${
        isDragged 
          ? 'opacity-20 scale-95 border-indigo-500' 
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-[100px]">
        <div className="p-1 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="text-slate-300 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
        {asset.icon ? <img src={asset.icon} className="w-9 h-9 rounded-2xl object-cover shadow-sm" /> : <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white text-[10px] shadow-sm" style={{ backgroundColor: asset.color }}>{asset.ticker.slice(0, 2)}</div>}
        <div className="overflow-hidden">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{asset.ticker}</h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">{asset.category}</p>
        </div>
      </div>

      <div className="flex-1 h-8 mx-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
        {asset.priceHistory && asset.priceHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={asset.priceHistory}>
              <Line type="monotone" dataKey="value" stroke={returnAmt >= 0 ? "#10b981" : "#f43f5e"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full border-b border-slate-100 dark:border-slate-800 opacity-20"></div>
        )}
      </div>

      <div className="text-right min-w-[80px]">
        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatCurrency(asset.currentValue)}</p>
        <div className={`text-[10px] font-black ${returnAmt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{returnPct.toFixed(1)}%</div>
      </div>
    </div>
  );
};