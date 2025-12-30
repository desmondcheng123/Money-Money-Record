import React from 'react';
import { Screen, User } from '../types';
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
  currentUser: User;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, setCurrentScreen, isDarkMode, currentUser }) => {
  const navItems = [
    { id: Screen.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: Screen.ACTIVITY, label: 'Activity', icon: History },
    { id: Screen.SETTINGS, label: 'More', icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <main className="pb-24">
        {children}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t z-50 transition-colors duration-300 ios-safe-bottom ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-2xl mx-auto flex justify-around items-center h-full px-2">
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
          <div className="flex-1 flex justify-center py-1">
             <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                {currentUser.name.slice(0, 2)}
             </div>
          </div>
        </div>
      </nav>
    </div>
  );
};