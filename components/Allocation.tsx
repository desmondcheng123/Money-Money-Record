
import React from 'react';
import { Asset } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationProps {
  assets: Asset[];
}

export const Allocation: React.FC<AllocationProps> = ({ assets }) => {
  const totalValue = assets.reduce((acc, asset) => acc + asset.currentValue, 0);
  
  const assetData = assets.map(a => ({
    name: a.ticker,
    value: a.currentValue,
    color: a.color
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Allocation</h2>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="h-56 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {assetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Diversification</span>
            <span className="text-xl font-black">Healthy</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest px-1">Holdings Breakdown</h3>
        <div className="grid grid-cols-1 gap-3">
          {assetData.map((data, idx) => {
            const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{data.name}</span>
                </div>
                <div className="text-right">
                   <p className="font-bold text-slate-800 dark:text-slate-100">{weight.toFixed(1)}%</p>
                   <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weight}%` }}></div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
