import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { Sun, Moon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Aurora Finance</h1>
            <p className="text-foreground/60">Control your SaaS business finances.</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
