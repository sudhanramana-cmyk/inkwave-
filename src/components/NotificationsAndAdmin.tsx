import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  UserPlus,
  Award,
  ShieldAlert,
  Trash2,
  Ban,
  CheckCircle,
  Copy,
  Check,
  X,
  Search
} from 'lucide-react';
import { NotificationItem, StoryPost, UserProfile, ViewRoute } from '../types';
import { apiFetch } from '../api';
import { ResilientImage } from './StoryCard';

// ==========================================
// 14. NOTIFICATIONS VIEW
// ==========================================
interface NotificationsViewProps {
  currentUser: UserProfile | null;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  notifications,
  onRefreshNotifications,
  onNavigate
}) => {
  const handleMarkRead = async (id?: string) => {
    try {
      await apiFetch('/api/notifications/read', {
        method: 'PUT',
        body: JSON.stringify({ id })
      });
      onRefreshNotifications();
    } catch {
      // ignore
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white">
          Notifications
        </h2>
        <p className="text-sm text-slate-500">Please sign in to view your activity notifications.</p>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.AUTH)}
          className="px-5 py-2.5 rounded-xl bg-[#0B132B] text-white text-xs font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-slate-100/10 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Salon Correspondence
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white mt-1">
            Notification Center
          </h1>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={() => handleMarkRead()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-900/15 dark:border-slate-100/15 text-xs font-semibold text-[#0B132B] dark:text-white hover:bg-slate-900/5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((ntf) => (
            <div
              key={ntf.id}
              onClick={() => {
                handleMarkRead(ntf.id);
                if (ntf.postId) {
                  onNavigate(ViewRoute.STORY, { postId: ntf.postId });
                } else if (ntf.actor) {
                  onNavigate(ViewRoute.PROFILE, { username: ntf.actor.username });
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                ntf.read
                  ? 'border-slate-900/10 dark:border-slate-100/10 bg-white/50 dark:bg-[#0F172A]/50'
                  : 'border-[#2563EB]/40 bg-white dark:bg-[#0F172A] shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {ntf.actor ? (
                  <ResilientImage
                    src={ntf.actor.avatar}
                    alt={ntf.actor.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-[#0B132B] dark:text-slate-100 font-medium leading-snug">
                    {ntf.message}
                  </p>
                  <div className="text-xs text-slate-500">
                    {new Date(ntf.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' · '}
                    <span className="capitalize">{ntf.type}</span>
                  </div>
                </div>
              </div>

              {!ntf.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 p-12 text-center space-y-2">
          <Bell className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white">
            No notifications.
          </p>
          <p className="text-xs text-slate-500">
            When readers react, reply to your comments, follow you, or your stories hit milestones, they’ll appear here.
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 22. ADMIN / MODERATION SYSTEM
// ==========================================
interface AdminViewProps {
  currentUser: UserProfile | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onNotifyToast: (msg: string) => void;
  onRefreshGlobalPosts: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onNavigate,
  onNotifyToast,
  onRefreshGlobalPosts
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      content: string;
      authorName: string;
      authorUsername: string;
      postTitle: string;
      createdAt: string;
    }>
  >([]);
  const [tab, setTab] = useState<'users' | 'posts' | 'comments'>('users');
  const [loading, setLoading] = useState(true);

  const loadAdminData = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<{
      users: UserProfile[];
      posts: StoryPost[];
      comments: Array<{
        id: string;
        content: string;
        authorName: string;
        authorUsername: string;
        postTitle: string;
        createdAt: string;
      }>;
    }>('/api/admin/overview')
      .then((res) => {
        setUsers(res.users);
        setPosts(res.posts);
        setComments(res.comments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white">
          Restricted Moderation Area
        </h2>
        <p className="text-sm text-slate-500">
          This console is strictly accessible to platform moderators.
        </p>
      </div>
    );
  }

  const handleToggleSuspend = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/suspend`, { method: 'PUT' });
      onNotifyToast('User account status updated.');
      loadAdminData();
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update user');
    }
  };

  const handleRemovePost = async (postId: string) => {
    try {
      await apiFetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      onNotifyToast('Story removed by moderation.');
      loadAdminData();
      onRefreshGlobalPosts();
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not remove post');
    }
  };

  const handleRemoveComment = async (commentId: string) => {
    try {
      await apiFetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      onNotifyToast('Comment removed by moderation.');
      loadAdminData();
      onRefreshGlobalPosts();
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not remove comment');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 dark:border-slate-100/10 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#EA580C]">
            Trust & Safety Governance
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white mt-1">
            Moderation Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review community accounts, published stories, and threaded comments.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/5 dark:bg-slate-100/5">
          {(
            [
              { id: 'users', label: `Users (${users.length})` },
              { id: 'posts', label: `Posts (${posts.length})` },
              { id: 'comments', label: `Comments (${comments.length})` }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      ) : (
        <>
          {tab === 'users' && (
            <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900/10 dark:border-slate-100/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Author</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Stories</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 dark:divide-slate-100/10 text-sm">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#0B132B] dark:text-white">{u.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          @{u.username} · {u.email}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs capitalize">{u.role}</td>
                      <td className="py-4 px-4 font-mono tabular-nums text-xs">{u.postsCount}</td>
                      <td className="py-4 px-4 text-xs">
                        {u.suspended ? (
                          <span className="text-rose-600 font-semibold">Suspended</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">Active</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              u.suspended
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                            }`}
                          >
                            {u.suspended ? 'Restore Account' : 'Suspend User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'posts' && (
            <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900/10 dark:border-slate-100/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Story Title</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 dark:divide-slate-100/10 text-sm">
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => onNavigate(ViewRoute.STORY, { postId: p.id })}
                          className="font-serif font-semibold text-[#0B132B] dark:text-white hover:underline text-left"
                        >
                          {p.title}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-xs">{p.author?.name}</td>
                      <td className="py-4 px-4 text-xs capitalize">{p.status}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePost(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs font-semibold"
                        >
                          Remove Post
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'comments' && (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      <strong>{c.authorName}</strong> (@{c.authorUsername}) on{' '}
                      <em>{c.postTitle}</em>
                    </div>
                    <p className="text-sm text-[#0B132B] dark:text-slate-200">“{c.content}”</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveComment(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-semibold shrink-0"
                  >
                    Remove Comment
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==========================================
// 23. SHARE MODAL & SEARCH MODAL & GUIDELINES
// ==========================================
export const ShareModal: React.FC<{
  post: StoryPost | null;
  onClose: () => void;
  onNotifyToast: (msg: string) => void;
}> = ({ post, onClose, onNotifyToast }) => {
  const [copied, setCopied] = useState(false);
  if (!post) return null;

  const shareUrl = `${window.location.origin}/?story=${post.slug || post.id}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    onNotifyToast('Story link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-900/15 dark:border-slate-100/15 bg-[#FBF9F5] dark:bg-[#0F172A] p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Share Dispatch
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white mt-1">
              {post.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Written by {post.author?.name} · {post.readingTime} min read on INKWAVE
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-300"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuickSearchModal: React.FC<{
  open: boolean;
  posts: StoryPost[];
  onClose: () => void;
  onSelectPost: (postId: string) => void;
}> = ({ open, posts, onClose, onSelectPost }) => {
  const [query, setQuery] = useState('');
  if (!open) return null;

  const q = query.toLowerCase().trim();
  const matches = q
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q) ||
          p.author?.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.name.toLowerCase().includes(q))
      )
    : posts.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="max-w-xl w-full rounded-2xl border border-slate-900/15 dark:border-slate-100/15 bg-[#FBF9F5] dark:bg-[#0F172A] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-900/10 dark:border-slate-100/10 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, authors, tags, or categories..."
            className="flex-1 bg-transparent text-sm text-[#0B132B] dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ESC
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-900/10 dark:divide-slate-100/10">
          {matches.length > 0 ? (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectPost(p.id);
                  onClose();
                }}
                className="w-full p-4 text-left hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors block"
              >
                <div className="text-xs text-[#2563EB] font-medium">
                  {p.category.name} · {p.readingTime} min read · {p.author?.name}
                </div>
                <div className="font-serif font-semibold text-sm text-[#0B132B] dark:text-white mt-0.5">
                  {p.title}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching stories found for “{query}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GuidelinesView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-slate-900/10 dark:border-slate-100/10 pb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
          Editorial Charter
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B132B] dark:text-white">
          About INKWAVE & Community Guidelines
        </h1>
        <p className="font-serif italic text-lg text-slate-600 dark:text-slate-300">
          “Ideas move. Stories stay.”
        </p>
      </div>

      <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
        <p>
          INKWAVE was founded on a simple premise: digital publishing does not have to choose between solitary newsletters and chaotic microblogging feeds. When typography, spatial layout, and threaded correspondence are designed with care, readers linger longer and arguments grow more nuanced.
        </p>

        <h2 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white pt-4">
          01. Principles of Threaded Discourse
        </h2>
        <p>
          Respond to the strongest version of an author’s thesis. Threaded replies on INKWAVE are designed like marginalia in a shared library folio—cite specifics, share counter-examples from lived or empirical experience, and keep critique focused on ideas rather than individuals.
        </p>

        <h2 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white pt-4">
          02. Ownership, Privacy & Terms
        </h2>
        <p>
          Authors retain full intellectual ownership of every draft and essay published on INKWAVE. Reader bookshelves, passwords (hashed with cryptographic scrypt salts), and session tokens are protected with strict authorization boundaries.
        </p>
      </div>
    </div>
  );
};
