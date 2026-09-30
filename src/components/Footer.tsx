import React from 'react';
import { ViewRoute } from '../types';

interface FooterProps {
  onNavigate: (route: ViewRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-900/10 dark:border-slate-100/10 bg-[#F5F2EB] dark:bg-[#060A14] py-16 pb-24 md:pb-16 mt-24 transition-colors">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900/10 dark:border-slate-100/10">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 36 36" className="w-7 h-7" fill="none">
                <rect x="2" y="2" width="32" height="32" rx="8" className="fill-[#0B132B] dark:fill-[#1E293B]" />
                <path d="M18 8V28" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
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
              <span className="font-serif text-xl font-semibold tracking-tight text-[#0B132B] dark:text-white">
                INKWAVE
              </span>
            </div>
            <p className="font-serif italic text-lg text-slate-700 dark:text-slate-300">
              “Ideas move. Stories stay.”
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              An independent social publishing salon built for unhurried essays, rigorous inquiry, and threaded correspondence.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.HOME)} className="hover:text-[#2563EB] transition-colors">
                  Editorial Front Page
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.DISCOVER)} className="hover:text-[#2563EB] transition-colors">
                  Discover & Categories
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.WAVE)} className="hover:text-[#2563EB] transition-colors">
                  Your Wave Feed
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.WRITE)} className="hover:text-[#2563EB] transition-colors">
                  Writing Studio
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.SHELF)} className="hover:text-[#2563EB] transition-colors">
                  My Reading Shelf
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Charter & Shortcuts
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <button type="button" onClick={() => onNavigate(ViewRoute.GUIDELINES)} className="hover:text-[#2563EB] transition-colors">
                  About · Community Guidelines · Privacy · Terms · Contact
                </button>
              </li>
              <li className="pt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                Keyboard: <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">N</kbd> New Story ·{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">/</kbd> Search ·{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">G</kbd> Home ·{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">S</kbd> Shelf
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} INKWAVE Publishing Collective. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => onNavigate(ViewRoute.GUIDELINES)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </button>
            <span>·</span>
            <button type="button" onClick={() => onNavigate(ViewRoute.GUIDELINES)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Community Guidelines
            </button>
            <span>·</span>
            <button type="button" onClick={() => onNavigate(ViewRoute.GUIDELINES)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy & Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
