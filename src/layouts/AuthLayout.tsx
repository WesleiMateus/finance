import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';

export const AuthLayout: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="absolute top-6 right-6 z-50">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
        >
          {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
        </Button>
      </div>

      <div className="py-6 px-4 w-full">
        <div className="grid lg:grid-cols-2 items-center gap-6 max-w-6xl w-full mx-auto">
          <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-6 sm:p-8 max-w-md w-full shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-lg:mx-auto bg-white dark:bg-slate-800 transition-colors z-10">
            <Outlet />
          </div>

          <div className="max-lg:mt-8 relative hidden lg:flex items-center justify-center p-12 min-h-[500px]">
            {/* Background Ornaments */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md">
              <div className="absolute top-0 right-0 size-64 bg-blue-600/10 dark:bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 size-64 bg-indigo-600/10 dark:bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {/* Floating SVG Icons */}
            <div className="relative grid grid-cols-2 gap-8 z-10">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-700 shadow-xl border border-slate-200 dark:border-slate-600 animate-bounce transition-colors duration-300" style={{ animationDuration: '3s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-700 shadow-xl border border-slate-200 dark:border-slate-600 animate-bounce transition-colors duration-300 delay-150" style={{ animationDuration: '4s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-700 shadow-xl border border-slate-200 dark:border-slate-600 animate-bounce transition-colors duration-300 delay-300" style={{ animationDuration: '3.5s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-700 shadow-xl border border-slate-200 dark:border-slate-600 animate-bounce transition-colors duration-300 delay-500" style={{ animationDuration: '4.5s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 dark:text-amber-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Mobile Ornament Fallback */}
          <div className="max-lg:mt-8 lg:hidden h-24 relative overflow-hidden rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent animate-pulse" />
            <div className="flex gap-4 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
