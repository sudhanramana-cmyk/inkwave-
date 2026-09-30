import React, { useState, useEffect, useCallback } from 'react';
import {
  ViewRoute,
  UserProfile,
  StoryPost,
  CategoryItem,
  TagItem,
  NotificationItem
} from './types';
import { apiFetch, getStoredToken, setStoredToken } from './api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingView } from './components/LandingView';
import { DiscoverView } from './components/DiscoverView';
import { StoryReaderView } from './components/StoryReaderView';
import { WriteStoryView } from './components/WriteStoryView';
import { ProfileView } from './components/ProfileView';
import { ShelfView } from './components/ShelfView';
import { DashboardView } from './components/DashboardView';
import { AuthView } from './components/AuthView';
import {
  NotificationsView,
  AdminView,
  ShareModal,
  QuickSearchModal,
  GuidelinesView
} from './components/NotificationsAndAdmin';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>(ViewRoute.HOME);
  const [activePostId, setActivePostId] = useState<string>('post_silence');
  const [activeUsername, setActiveUsername] = useState<string>('elenavance');
  const [editingPost, setEditingPost] = useState<StoryPost | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inkwave_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [shareModalPost, setShareModalPost] = useState<StoryPost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Sync dark mode class on root documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      try {
        localStorage.setItem('inkwave_theme', 'dark');
      } catch {}
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem('inkwave_theme', 'light');
      } catch {}
    }
  }, [darkMode]);

  const fetchPostsAndMetadata = useCallback(async () => {
    try {
      const [postsRes, catRes] = await Promise.all([
        apiFetch<{ posts: StoryPost[] }>('/api/posts'),
        apiFetch<{ categories: CategoryItem[]; tags: TagItem[] }>('/api/categories')
      ]);
      setPosts(postsRes.posts);
      setCategories(catRes.categories);
      setTags(catRes.tags);
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const res = await apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
      setNotifications(res.notifications);
    } catch {
      // ignore if unauthenticated
    }
  }, []);

  // Initial session hydration + data load
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      const token = getStoredToken();
      if (token) {
        try {
          const meRes = await apiFetch<{ user: UserProfile }>('/api/auth/me');
          setUser(meRes.user);
        } catch {
          setStoredToken(null);
        }
      }

      await fetchPostsAndMetadata();
      await fetchNotifications();

      // Check URL query param ?story=...
      const params = new URLSearchParams(window.location.search);
      const storyParam = params.get('story');
      if (storyParam) {
        setActivePostId(storyParam);
        setCurrentRoute(ViewRoute.STORY);
      }

      setInitialLoading(false);
    };
    init();
  }, [fetchPostsAndMetadata, fetchNotifications]);

  const handleNavigate = useCallback(
    (route: ViewRoute, params?: { postId?: string; username?: string }) => {
      if (params?.postId) {
        setActivePostId(params.postId);
      }
      if (params?.username) {
        setActiveUsername(params.username);
      }
      if (route !== ViewRoute.WRITE) {
        setEditingPost(null);
      }
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  // Global Keyboard Shortcuts: N -> Write, / -> Search, G -> Home, S -> Shelf
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape') {
          setSearchModalOpen(false);
          setShareModalPost(null);
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/') {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNavigate(ViewRoute.WRITE);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        handleNavigate(ViewRoute.HOME);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleNavigate(ViewRoute.SHELF);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setShareModalPost(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setNotifications([]);
    showToast('Signed out of INKWAVE.');
    handleNavigate(ViewRoute.HOME);
    fetchPostsAndMetadata();
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      showToast('Please sign in to like stories.');
      handleNavigate(ViewRoute.AUTH);
      return;
    }
    try {
      const res = await apiFetch<{ liked: boolean; post: StoryPost }>(`/api/posts/${postId}/like`, {
        method: 'POST'
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
    } catch (err: any) {
      showToast(err.message || 'Could not like story');
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) {
      showToast('Please sign in to save stories to your Reading Shelf.');
      handleNavigate(ViewRoute.AUTH);
      return;
    }
    const target = posts.find((p) => p.id === postId);
    try {
      if (target?.myBookmarkShelf) {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${postId}/bookmark`, {
          method: 'DELETE'
        });
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
        showToast('Removed from Reading Shelf.');
      } else {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${postId}/bookmark`, {
          method: 'POST',
          body: JSON.stringify({ shelf: 'recent' })
        });
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
        showToast('Saved to My Reading Shelf.');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update bookmark');
    }
  };

  const handleToggleFollow = async (authorId: string, currentlyFollowing: boolean) => {
    if (!user) {
      showToast('Please sign in to follow authors.');
      handleNavigate(ViewRoute.AUTH);
      return;
    }
    try {
      const method = currentlyFollowing ? 'DELETE' : 'POST';
      await apiFetch(`/api/users/${authorId}/follow`, { method });
      await fetchPostsAndMetadata();
      showToast(currentlyFollowing ? 'Unfollowed author.' : 'Following author! Added to Your Wave.');
    } catch (err: any) {
      showToast(err.message || 'Could not update follow');
    }
  };

  const handleDeleteStory = async (postId: string) => {
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Story deleted.');
      handleNavigate(ViewRoute.DISCOVER);
    } catch (err: any) {
      showToast(err.message || 'Could not delete story.');
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        darkMode ? 'dark bg-[#080D1A] text-[#F8FAFC]' : 'bg-[#FBF9F5] text-[#0B132B]'
      }`}
    >
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        user={user}
        unreadNotifications={unreadNotificationsCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {initialLoading ? (
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-16 space-y-10 animate-pulse">
            <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ) : (
          <>
            {currentRoute === ViewRoute.HOME && (
              <LandingView
                posts={posts}
                categories={categories}
                onNavigate={handleNavigate}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onShare={(post) => setShareModalPost(post)}
              />
            )}

            {(currentRoute === ViewRoute.DISCOVER || currentRoute === ViewRoute.WAVE) && (
              <DiscoverView
                posts={posts}
                categories={categories}
                tags={tags}
                currentUser={user}
                isWaveFeed={currentRoute === ViewRoute.WAVE}
                onNavigate={handleNavigate}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onShare={(post) => setShareModalPost(post)}
                onToggleFollow={handleToggleFollow}
              />
            )}

            {currentRoute === ViewRoute.STORY && (
              <StoryReaderView
                postId={activePostId}
                currentUser={user}
                onNavigate={handleNavigate}
                onEditStory={(post) => {
                  setEditingPost(post);
                  setCurrentRoute(ViewRoute.WRITE);
                }}
                onDeleteStory={handleDeleteStory}
                onShare={(post) => setShareModalPost(post)}
                onNotifyToast={showToast}
                onPostUpdated={(updated) => {
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
              />
            )}

            {currentRoute === ViewRoute.WRITE && (
              <WriteStoryView
                currentUser={user}
                categories={categories}
                editingPost={editingPost}
                onNavigate={handleNavigate}
                onStorySaved={(savedPost) => {
                  fetchPostsAndMetadata();
                  setActivePostId(savedPost.id);
                }}
                onNotifyToast={showToast}
              />
            )}

            {currentRoute === ViewRoute.PROFILE && (
              <ProfileView
                username={activeUsername || user?.username || 'elenavance'}
                currentUser={user}
                onNavigate={handleNavigate}
                onUserUpdated={(updatedUser) => {
                  setUser(updatedUser);
                  setActiveUsername(updatedUser.username);
                  fetchPostsAndMetadata();
                }}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onShare={(post) => setShareModalPost(post)}
                onNotifyToast={showToast}
              />
            )}

            {currentRoute === ViewRoute.SHELF && (
              <ShelfView
                currentUser={user}
                onNavigate={handleNavigate}
                onNotifyToast={showToast}
                onPostUpdated={(updated) => {
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
              />
            )}

            {currentRoute === ViewRoute.DASHBOARD && (
              <DashboardView
                currentUser={user}
                onNavigate={handleNavigate}
                onEditStory={(post) => {
                  setEditingPost(post);
                  setCurrentRoute(ViewRoute.WRITE);
                }}
                onNotifyToast={showToast}
                onRefreshGlobalPosts={fetchPostsAndMetadata}
              />
            )}

            {currentRoute === ViewRoute.NOTIFICATIONS && (
              <NotificationsView
                currentUser={user}
                notifications={notifications}
                onRefreshNotifications={fetchNotifications}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === ViewRoute.ADMIN && (
              <AdminView
                currentUser={user}
                onNavigate={handleNavigate}
                onNotifyToast={showToast}
                onRefreshGlobalPosts={fetchPostsAndMetadata}
              />
            )}

            {currentRoute === ViewRoute.AUTH && (
              <AuthView
                onAuthenticated={(authedUser) => {
                  setUser(authedUser);
                  fetchPostsAndMetadata();
                  fetchNotifications();
                  handleNavigate(ViewRoute.HOME);
                }}
                onNotifyToast={showToast}
              />
            )}

            {currentRoute === ViewRoute.GUIDELINES && <GuidelinesView />}
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Share Story Modal */}
      <ShareModal
        post={shareModalPost}
        onClose={() => setShareModalPost(null)}
        onNotifyToast={showToast}
      />

      {/* Quick Global Search Modal (Shortcut: /) */}
      <QuickSearchModal
        open={searchModalOpen}
        posts={posts}
        onClose={() => setSearchModalOpen(false)}
        onSelectPost={(postId) => handleNavigate(ViewRoute.STORY, { postId })}
      />

      {/* Smooth Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm px-4 py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-medium shadow-xl border border-white/10">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
