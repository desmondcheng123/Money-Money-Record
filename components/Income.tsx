
import React from 'react';
import { Asset } from '../types';
import { INCOME_DATA } from '../mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

interface IncomeProps {
  assets: Asset[];
  currency: string;
}

export const Income: React.FC<IncomeProps> = ({ assets, currency }) => {
  const [dripEnabled, setDripEnabled] = React.useState(true);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(val);
  };

  const totalAnnual = INCOME_DATA.reduce((acc, curr) => acc + curr.amount, 0) * 2; // Simulating a full year

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Income</h2>
          <p className="text-sm text-slate-500">Estimated annual dividends</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAnnual)}</p>
          <p className="text-xs text-slate-400 font-medium">Avg. {formatCurrency(totalAnnual / 12)}/mo</p>
        </div>
      </header>

      {/* Income Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Dividends Trend</h3>
          <button className="text-slate-400 hover:text-slate-600"><Download size={18} /></button>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={INCOME_DATA}>
              <Tooltip 
                cursor={{ fill: '#f1f5f9', radius: 10 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Income']}
              />
              <Bar 
                dataKey="amount" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              >
                 {INCOME_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === INCOME_DATA.length - 1 ? '#10b981' : '#dcfce7'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Settings & DRIP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-slate-500">DRIP</span>
            <button onClick={() => setDripEnabled(!dripEnabled)}>
              {dripEnabled ? <ToggleRight className="text-indigo-600" /> : <ToggleLeft className="text-slate-300" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-tight">Automatically reinvest dividends into the portfolio.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-slate-500">Yield</span>
            <span className="text-emerald-500 font-bold text-lg">3.4%</span>
          </div>
          <p className="text-xs text-slate-400 leading-tight">Total portfolio dividend yield based on current price.</p>
        </div>
      </div>

      {/* Dividend History */}
      <section className="space-y-3 pt-4">
        <h3 className="font-semibold flex items-center">
          <Calendar size={18} className="mr-2 text-indigo-500" /> 
          Recent Distributions
        </h3>
        <div className="space-y-2">
          {assets.filter(a => a.category !== 'Cash').slice(0, 4).map((a, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: a.color }}>
                     {a.ticker}
                   </div>
                   <div>
                     <p className="text-sm font-semibold">{a.ticker}</p>
                     <p className="text-[10px] text-slate-400">May 12, 2024 • Reinvested</p>
                   </div>
                </div>
                <p className="font-bold text-emerald-600">+{formatCurrency(Math.random() * 20 + 5)}</p>
             </div>
          ))}
        </div>
      </section>
    </div>
  );
};
