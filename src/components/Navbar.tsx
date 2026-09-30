import React from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  PenTool,
  Compass,
  BookMarked,
  User as UserIcon,
  Home,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  LogOut
} from 'lucide-react';
import { UserProfile, ViewRoute } from '../types';

interface NavbarProps {
  currentRoute: ViewRoute;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  user: UserProfile | null;
  unreadNotifications: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  user,
  unreadNotifications,
  darkMode,
  onToggleDarkMode,
  onOpenSearch,
  onLogout
}) => {
  return (
    <>
      {/* Desktop & Tablet Top Bar following strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-900/10 dark:border-slate-100/10 bg-[#FBF9F5]/90 dark:bg-[#080D1A]/90 backdrop-blur-md transition-colors">
        <div className="max-w-[1360px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-6">
          {/* Zone 1: Single Brand Wordmark Element */}
          <button
            type="button"
            onClick={() => onNavigate(ViewRoute.HOME)}
            className="flex items-center gap-2.5 text-left group focus:outline-none whitespace-nowrap shrink-0"
          >
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 text-[#0B132B] dark:text-[#F8FAFC] transition-transform duration-200 group-hover:scale-105"
              fill="none"
            >
              <rect
                x="2"
                y="2"
                width="32"
                height="32"
                rx="8"
                className="fill-[#0B132B] dark:fill-[#1E293B]"
              />
              {/* Stylized "I" stem + open book / wave curves */}
              <path
                d="M18 8V28"
                stroke="#F8FAFC"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M9 22C12.5 18.5 15.5 24.5 18 21C20.5 17.5 23.5 23.5 27 20"
                stroke="#3B82F6"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M10 14C13 11.5 15.5 16 18 13.5C20.5 11 23 15.5 26 13"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-serif text-xl font-semibold tracking-tight text-[#0B132B] dark:text-[#F8FAFC]">
              INKWAVE
            </span>
          </button>

          {/* Zone 2: 4-6 Clean Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => onNavigate(ViewRoute.HOME)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                currentRoute === ViewRoute.HOME
                  ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                  : 'border-transparent hover:text-[#0B132B] dark:hover:text-white'
              }`}
            >
              Editorial
            </button>
            <button
              type="button"
              onClick={() => onNavigate(ViewRoute.DISCOVER)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                currentRoute === ViewRoute.DISCOVER
                  ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                  : 'border-transparent hover:text-[#0B132B] dark:hover:text-white'
              }`}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => onNavigate(ViewRoute.WAVE)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                currentRoute === ViewRoute.WAVE
                  ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                  : 'border-transparent hover:text-[#0B132B] dark:hover:text-white'
              }`}
            >
              Your Wave
            </button>
            <button
              type="button"
              onClick={() => onNavigate(ViewRoute.SHELF)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                currentRoute === ViewRoute.SHELF
                  ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                  : 'border-transparent hover:text-[#0B132B] dark:hover:text-white'
              }`}
            >
              Reading Shelf
            </button>
            {user && (
              <button
                type="button"
                onClick={() => onNavigate(ViewRoute.DASHBOARD)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  currentRoute === ViewRoute.DASHBOARD
                    ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                    : 'border-transparent hover:text-[#0B132B] dark:hover:text-white'
                }`}
              >
                Studio
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate(ViewRoute.ADMIN)}
                className={`hidden xl:inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  currentRoute === ViewRoute.ADMIN
                    ? 'border-[#EA580C] text-[#EA580C] font-semibold'
                    : 'border-transparent text-amber-700 dark:text-amber-400 hover:text-[#EA580C]'
                }`}
              >
                Moderation
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              title="Search stories, authors, tags (Press /)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-900/10 dark:border-slate-100/10 text-xs text-slate-600 dark:text-slate-300 hover:border-slate-900/25 dark:hover:border-slate-100/25 transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline-block font-mono text-[11px] opacity-60">/</kbd>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.NOTIFICATIONS)}
                  aria-label="Notifications"
                  className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EA580C]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.WRITE)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>

                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewRoute.PROFILE, { username: user.username })}
                    className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#2563EB]/40 transition-all"
                    title={`${user.name} (@${user.username})`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover bg-slate-800"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign out"
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.AUTH)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#0B132B] dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.WRITE)}
                  className="px-4 py-2 rounded-lg bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Start Writing
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (<= 15% viewport height cap) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#FBF9F5]/95 dark:bg-[#080D1A]/95 backdrop-blur-md border-t border-slate-900/10 dark:border-slate-100/10 px-2 flex items-center justify-around">
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.HOME)}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium whitespace-nowrap ${
            currentRoute === ViewRoute.HOME
              ? 'text-[#2563EB]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.DISCOVER)}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium whitespace-nowrap ${
            currentRoute === ViewRoute.DISCOVER
              ? 'text-[#2563EB]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span>Discover</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.WRITE)}
          className="flex flex-col items-center justify-center py-1 px-3 text-[11px] font-semibold text-[#EA580C] whitespace-nowrap"
        >
          <PenTool className="w-4 h-4 mb-0.5" />
          <span>Write</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.SHELF)}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium whitespace-nowrap ${
            currentRoute === ViewRoute.SHELF
              ? 'text-[#2563EB]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookMarked className="w-4 h-4 mb-0.5" />
          <span>Shelf</span>
        </button>
        <button
          type="button"
          onClick={() =>
            user
              ? onNavigate(ViewRoute.PROFILE, { username: user.username })
              : onNavigate(ViewRoute.AUTH)
          }
          className={`flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium whitespace-nowrap ${
            currentRoute === ViewRoute.PROFILE || currentRoute === ViewRoute.AUTH
              ? 'text-[#2563EB]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <UserIcon className="w-4 h-4 mb-0.5" />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>
    </>
  );
};
