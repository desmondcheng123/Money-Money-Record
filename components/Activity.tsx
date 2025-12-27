
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Plus, Minus, Gift, Filter } from 'lucide-react';

interface ActivityProps {
  transactions: Transaction[];
  currency: string;
}

export const Activity: React.FC<ActivityProps> = ({ transactions, currency }) => {
  const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(val);
  };

  const filtered = transactions.filter(t => filter === 'ALL' || t.type === filter);

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY: return <Plus size={16} className="text-indigo-600" />;
      case TransactionType.SELL: return <Minus size={16} className="text-rose-600" />;
      case TransactionType.DIVIDEND: return <Gift size={16} className="text-emerald-600" />;
    }
  };

  const getBg = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY: return 'bg-indigo-50 dark:bg-indigo-900/20';
      case TransactionType.SELL: return 'bg-rose-50 dark:bg-rose-900/20';
      case TransactionType.DIVIDEND: return 'bg-emerald-50 dark:bg-emerald-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Activity</h2>
        <button className="flex items-center text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-sm">
          <Filter size={14} className="mr-1.5" /> Filter
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {['ALL', TransactionType.BUY, TransactionType.SELL, TransactionType.DIVIDEND].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white' 
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
          >
            {f === 'ALL' ? 'Everything' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center justify-between group">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getBg(t.type)}`}>
                {getIcon(t.type)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{t.ticker}</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {t.shares ? ` • ${t.shares} shares` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${t.type === TransactionType.SELL ? 'text-rose-500' : t.type === TransactionType.DIVIDEND ? 'text-emerald-600' : ''}`}>
                {t.type === TransactionType.SELL ? '-' : t.type === TransactionType.DIVIDEND ? '+' : ''}
                {formatCurrency(t.amount)}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{t.type}</p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
