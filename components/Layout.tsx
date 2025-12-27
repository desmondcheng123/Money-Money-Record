
import React from 'react';
import { Screen } from '../types';
import { 
  LayoutDashboard, 
  History, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  isDarkMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, setCurrentScreen, isDarkMode }) => {
  const navItems = [
    { id: Screen.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: Screen.ACTIVITY, label: 'Activity', icon: History },
    { id: Screen.SETTINGS, label: 'More', icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <main className="pb-20">
        {children}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t z-50 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-2xl mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 py-1 rounded-xl ${
                currentScreen === item.id 
                  ? 'text-indigo-600' 
                  : isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <item.icon size={20} strokeWidth={currentScreen === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
