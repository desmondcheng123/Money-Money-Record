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

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, setCurrentScreen, isDarkMode }) => {
  const navItems = [
    { id: Screen.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: Screen.ACTIVITY, label: 'Activity', icon: History },
    { id: Screen.SETTINGS, label: 'Vault', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t z-50 transition-colors duration-300 ios-safe-bottom bg-slate-900/90 border-slate-800 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex justify-around items-center h-full px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 py-1 rounded-xl ${
                currentScreen === item.id 
                  ? 'text-indigo-500' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <item.icon size={22} strokeWidth={currentScreen === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};