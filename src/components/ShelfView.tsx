import React, { useState, useEffect } from 'react';
import { BookMarked, Trash2, ArrowRight } from 'lucide-react';
import { BookmarkEntry, ShelfType, StoryPost, UserProfile, ViewRoute } from '../types';
import { apiFetch } from '../api';
import { ResilientImage } from './StoryCard';

interface ShelfViewProps {
  currentUser: UserProfile | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onNotifyToast: (msg: string) => void;
  onPostUpdated: (post: StoryPost) => void;
}

export const ShelfView: React.FC<ShelfViewProps> = ({
  currentUser,
  onNavigate,
  onNotifyToast,
  onPostUpdated
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [activeShelf, setActiveShelf] = useState<'all' | ShelfType>('all');
  const [loading, setLoading] = useState(true);

  const loadShelf = () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<{ bookmarks: BookmarkEntry[] }>('/api/bookmarks')
      .then((res) => {
        setBookmarks(res.bookmarks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadShelf();
  }, [currentUser]);

  const handleMoveShelf = async (postId: string, shelf: ShelfType) => {
    try {
      const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        body: JSON.stringify({ shelf })
      });
      onPostUpdated(res.post);
      setBookmarks((prev) =>
        prev.map((b) => (b.post.id === postId ? { ...b, shelf, post: res.post } : b))
      );
      onNotifyToast(`Moved story to ${shelf === 'later' ? 'Reading later' : shelf === 'favorites' ? 'Favorites' : 'Recently saved'}.`);
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update shelf.');
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${postId}/bookmark`, {
        method: 'DELETE'
      });
      onPostUpdated(res.post);
      setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
      onNotifyToast('Removed from Reading Shelf.');
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not remove bookmark.');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white">
          My Reading Shelf
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in to curate your personal reading shelf across Recently Saved, Reading Later, and Favorites.
        </p>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.AUTH)}
          className="px-6 py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const filtered =
    activeShelf === 'all' ? bookmarks : bookmarks.filter((b) => b.shelf === activeShelf);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="border-b border-slate-900/10 dark:border-slate-100/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Personal Library
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B132B] dark:text-white mt-1">
            My Reading Shelf
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Essays and monographs you’ve set aside for quiet reading and reference.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/5 dark:bg-slate-100/5">
          {(
            [
              { id: 'all', label: `All (${bookmarks.length})` },
              { id: 'recent', label: 'Recently saved' },
              { id: 'later', label: 'Reading later' },
              { id: 'favorites', label: 'Favorites' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveShelf(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeShelf === tab.id
                  ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <div
              key={entry.bookmarkId}
              className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div
                onClick={() => onNavigate(ViewRoute.STORY, { postId: entry.post.id })}
                className="flex items-start gap-4 cursor-pointer group flex-1 min-w-0"
              >
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                  <ResilientImage
                    src={entry.post.coverImage}
                    alt={entry.post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#2563EB] dark:text-blue-400">
                      {entry.post.category.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{entry.post.readingTime} min read</span>
                    <span aria-hidden="true">·</span>
                    <span>by {entry.post.author?.name}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white group-hover:text-[#2563EB] transition-colors truncate">
                    {entry.post.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {entry.post.subtitle || entry.post.excerpt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-900/10">
                <select
                  value={entry.shelf}
                  onChange={(e) => handleMoveShelf(entry.post.id, e.target.value as ShelfType)}
                  className="px-3 py-1.5 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="recent">Recently saved</option>
                  <option value="later">Reading later</option>
                  <option value="favorites">Favorites</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveBookmark(entry.post.id)}
                  title="Remove from Reading Shelf"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/60 dark:bg-[#0F172A]/60 p-12 text-center space-y-3">
          <BookMarked className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white">
            No saved stories.
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Bookmark any story while reading or exploring to organize it into Recently Saved, Reading Later, or Favorites.
          </p>
          <button
            type="button"
            onClick={() => onNavigate(ViewRoute.DISCOVER)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
          >
            <span>Explore Stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
