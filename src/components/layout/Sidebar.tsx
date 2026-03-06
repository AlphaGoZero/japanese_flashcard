import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  BookOpen,
  Layers,
  Gamepad2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  PlusCircle,
  Trophy,
  TrendingUp,
  Heart,
  Zap,
  Crown,
  Pencil,
  Users,
  Smartphone,
  Library,
  FileText,
  Mic,
  Headphones,
  BookMarked,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BookOpen },
  { path: '/review', label: 'Daily Review', icon: BookOpen },
  { path: '/quick-review', label: 'Quick Review', icon: Zap },
  { path: '/decks', label: 'Decks', icon: Layers },
  { path: '/genres', label: 'Genres', icon: Library },
  { path: '/my-decks', label: 'My Decks', icon: PlusCircle },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/groups', label: 'Groups', icon: Crown },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/kanji', label: 'Kanji', icon: Pencil },
  { path: '/kanji/write', label: 'Kanji Writing', icon: Pencil },
  { path: '/grammar', label: 'Grammar', icon: GraduationCap },
  { path: '/jlpt', label: 'JLPT Exams', icon: FileText },
  { path: '/speech', label: 'Speech Practice', icon: Mic },
  { path: '/reading', label: 'Reading', icon: BookMarked },
  { path: '/listening', label: 'Listening', icon: Headphones },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/exchange', label: 'Language Exchange', icon: Globe },
  { path: '/widgets', label: 'Widgets', icon: Smartphone },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nihongo</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Flash</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
