import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Edit3,
  Trash2,
  Eye,
  Archive,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { DashboardData, StoryPost, UserProfile, ViewRoute } from '../types';
import { apiFetch } from '../api';

interface DashboardViewProps {
  currentUser: UserProfile | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onEditStory: (post: StoryPost) => void;
  onNotifyToast: (msg: string) => void;
  onRefreshGlobalPosts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onEditStory,
  onNotifyToast,
  onRefreshGlobalPosts
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'views' | 'likes' | 'comments'>('views');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const fetchDashboard = () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<DashboardData>('/api/dashboard')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [currentUser]);

  const handleChangeStatus = async (
    post: StoryPost,
    newStatus: 'published' | 'draft' | 'archived'
  ) => {
    try {
      await apiFetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      onNotifyToast(`Story status changed to ${newStatus}.`);
      fetchDashboard();
      onRefreshGlobalPosts();
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update story status.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      onNotifyToast('Story deleted.');
      fetchDashboard();
      onRefreshGlobalPosts();
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not delete story.');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white">
          Creator Studio & Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in to manage your published stories, drafts, readership analytics, and audience growth.
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

  if (loading || !data) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-8 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const { stats, analytics, stories } = data;
  const filteredStories =
    statusFilter === 'all' ? stories : stories.filter((s) => s.status === statusFilter);

  const values = analytics.map((a) => a[chartMetric]);
  const maxVal = Math.max(...values, 10);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 dark:border-slate-100/10 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Creator Studio
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B132B] dark:text-white mt-1">
            Editorial & Audience Telemetry
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Monitor readership across your essays, manage drafts, and track threaded engagement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.WRITE)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Write New Story</span>
        </button>
      </div>

      {/* 6 Core Creator Metrics (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Stories Published</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white mt-2">
            {stats.publishedCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Drafts</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#EA580C] mt-2">
            {stats.draftsCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Views</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white mt-2">
            {stats.totalViews.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Likes & Reactions</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white mt-2">
            {stats.totalLikes.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Comments</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white mt-2">
            {stats.totalComments.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Followers</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#2563EB] dark:text-blue-400 mt-2">
            {stats.followersCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Interactive Analytics Visualization: Views / Likes / Comments Over Time */}
      <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white">
              Readership Cadence Over Time
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              7-day rolling performance across all published essays
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/5 dark:bg-slate-100/5">
            {(
              [
                { id: 'views', label: 'Views over time' },
                { id: 'likes', label: 'Likes over time' },
                { id: 'comments', label: 'Comments over time' }
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMetric(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  chartMetric === m.id
                    ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pure SVG Chart (Zero inline styles) */}
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 220" className="w-full h-56 overflow-visible">
            {/* Horizontal grid lines */}
            {[40, 90, 140, 180].map((y) => (
              <line
                key={y}
                x1="40"
                y1={y}
                x2="720"
                y2={y}
                stroke="currentColor"
                className="text-slate-900/10 dark:text-slate-100/10"
                strokeDasharray="4 4"
              />
            ))}

            {analytics.map((point, index) => {
              const val = point[chartMetric];
              const barHeight = Math.max(12, Math.round((val / maxVal) * 135));
              const x = 75 + index * 95;
              const y = 180 - barHeight;
              const fillColor =
                chartMetric === 'views'
                  ? '#2563EB'
                  : chartMetric === 'likes'
                  ? '#EA580C'
                  : '#10B981';

              return (
                <g key={point.date}>
                  <rect
                    x={x}
                    y={y}
                    width="44"
                    height={barHeight}
                    rx="6"
                    fill={fillColor}
                    fillOpacity="0.88"
                  />
                  <text
                    x={x + 22}
                    y={y - 8}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-200 font-mono text-[11px] font-medium"
                  >
                    {val}
                  </text>
                  <text
                    x={x + 22}
                    y={202}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 font-mono text-[11px]"
                  >
                    {point.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Recent Stories Table */}
      <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/90 overflow-hidden">
        <div className="p-6 border-b border-slate-900/10 dark:border-slate-100/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white">
            Your Manuscripts & Publications
          </h2>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/5 dark:bg-slate-100/5">
            {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredStories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/10 dark:border-slate-100/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Story</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Views</th>
                  <th className="py-3.5 px-4 text-right">Likes</th>
                  <th className="py-3.5 px-4 text-right">Comments</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/10 dark:divide-slate-100/10 text-sm">
                {filteredStories.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-900/[0.02] dark:hover:bg-slate-100/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6 max-w-md">
                      <button
                        type="button"
                        onClick={() => onNavigate(ViewRoute.STORY, { postId: st.id })}
                        className="font-serif font-semibold text-[#0B132B] dark:text-white hover:text-[#2563EB] text-left block truncate max-w-sm"
                      >
                        {st.title}
                      </button>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {st.category.name} · {st.readingTime} min read · Updated{' '}
                        {new Date(st.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium capitalize">
                      {st.status === 'published' && (
                        <span className="text-emerald-700 dark:text-emerald-400">Published</span>
                      )}
                      {st.status === 'draft' && (
                        <span className="text-[#EA580C]">Draft</span>
                      )}
                      {st.status === 'archived' && (
                        <span className="text-slate-500">Archived</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-xs">
                      {st.views.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-xs">
                      {st.likesCount + st.reactionsCount}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-xs">
                      {st.commentsCount}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditStory(st)}
                          title="Edit Story"
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {st.status !== 'published' ? (
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(st, 'published')}
                            title="Publish Now"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(st, 'archived')}
                            title="Archive Story"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(st.id)}
                          title="Delete Story"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-slate-500">
            No stories found in this status view.
          </div>
        )}
      </div>
    </div>
  );
};
