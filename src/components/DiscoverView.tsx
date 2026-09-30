import React, { useState, useMemo } from 'react';
import { Search, X, ArrowUpRight, UserPlus, UserCheck, Compass } from 'lucide-react';
import { StoryPost, CategoryItem, TagItem, UserProfile, ViewRoute } from '../types';
import { StoryCard, ResilientImage } from './StoryCard';

interface DiscoverViewProps {
  posts: StoryPost[];
  categories: CategoryItem[];
  tags: TagItem[];
  currentUser: UserProfile | null;
  initialSearch?: string;
  isWaveFeed?: boolean;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onShare: (post: StoryPost) => void;
  onToggleFollow: (authorId: string, currentlyFollowing: boolean) => void;
}

type DiscoverSection = 'trending' | 'fresh' | 'thought_starters' | 'deep' | 'quick';

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  posts,
  categories,
  tags,
  currentUser,
  initialSearch = '',
  isWaveFeed = false,
  onNavigate,
  onToggleLike,
  onToggleBookmark,
  onShare,
  onToggleFollow
}) => {
  const [activeSection, setActiveSection] = useState<DiscoverSection>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  const sections: Array<{ id: DiscoverSection; label: string; description: string }> = [
    { id: 'trending', label: 'Trending Now', description: 'High-velocity stories across reading rooms' },
    { id: 'fresh', label: 'Freshly Written', description: 'Newest dispatches from the community' },
    { id: 'thought_starters', label: 'Thought Starters', description: 'Essays sparking threaded debate' },
    { id: 'deep', label: 'Deep Reads', description: 'Long-form monographs (5+ min read)' },
    { id: 'quick', label: 'Quick Reads', description: 'Concise field notes (under 4 min)' }
  ];

  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.category.slug.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category.name.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedTag) {
      list = list.filter((p) => p.tags.some((t) => t.slug === selectedTag || t.name === selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.author &&
            (p.author.name.toLowerCase().includes(q) ||
              p.author.username.toLowerCase().includes(q))) ||
          p.category.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    if (isWaveFeed && currentUser) {
      list.sort((a, b) => {
        const aFollow = a.isFollowingAuthor ? 1 : 0;
        const bFollow = b.isFollowingAuthor ? 1 : 0;
        if (aFollow !== bFollow) return bFollow - aFollow;
        return b.trendingScore - a.trendingScore;
      });
      return list;
    }

    if (activeSection === 'trending') {
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (activeSection === 'fresh') {
      list.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
    } else if (activeSection === 'thought_starters') {
      list = list.filter((p) => p.thoughtStarter || p.commentsCount >= 1);
      list.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (activeSection === 'deep') {
      list = list.filter((p) => p.readingTime >= 5);
      list.sort((a, b) => b.readingTime - a.readingTime);
    } else if (activeSection === 'quick') {
      list = list.filter((p) => p.readingTime <= 4);
      list.sort((a, b) => a.readingTime - b.readingTime);
    }

    return list;
  }, [posts, selectedCategory, selectedTag, searchQuery, activeSection, isWaveFeed, currentUser]);

  // Unique authors for "Voices to Follow"
  const featuredAuthors = useMemo(() => {
    const map = new Map<string, { author: UserProfile; isFollowing: boolean }>();
    posts.forEach((p) => {
      if (p.author && (!currentUser || p.author.id !== currentUser.id)) {
        if (!map.has(p.author.id)) {
          map.set(p.author.id, { author: p.author, isFollowing: p.isFollowingAuthor });
        }
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [posts, currentUser]);

  // Most active discussions
  const activeDiscussions = useMemo(() => {
    return [...posts].sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 3);
  }, [posts]);

  // Recommended ("Because you read...")
  const recommendedStories = useMemo(() => {
    return [...posts].sort((a, b) => b.views - a.views).slice(0, 2);
  }, [posts]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Header & Search Bar */}
      <div className="border-b border-slate-900/10 dark:border-slate-100/10 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-wider uppercase text-[#2563EB] dark:text-blue-400">
            {isWaveFeed ? 'Personalized Current' : 'Editorial Index & Discovery'}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B132B] dark:text-white">
            {isWaveFeed ? 'Your Wave' : 'Discover Stories'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            {isWaveFeed
              ? 'Prioritizing essays and dispatches from writers you follow, paired with tailored recommendations.'
              : 'Explore trending dispatches, deep monographs, thought starters, and quick notes across ten disciplines.'}
          </p>
        </div>

        {/* Live Search Input */}
        <div className="w-full lg:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, content, author, tag, or category..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-[#0F172A] text-sm text-[#0B132B] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Discovery Section Tabs */}
      {!isWaveFeed && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-[#0B132B] dark:bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white/70 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-900/10 dark:border-slate-100/10 hover:border-slate-900/25'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      )}

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setSelectedTag('');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            selectedCategory === 'all' && !selectedTag
              ? 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-slate-100/5'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-slate-100/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Content Grid + Smart Editorial Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left 8 Columns: Story Feed */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTag && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-500/10 text-xs text-[#2563EB] dark:text-blue-300">
              <span>
                Filtering by topic tag: <strong>#{selectedTag}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="underline font-medium"
              >
                Clear tag
              </button>
            </div>
          )}

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <StoryCard
                  key={post.id}
                  post={post}
                  onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                  onOpenProfile={(username) => onNavigate(ViewRoute.PROFILE, { username })}
                  onToggleLike={onToggleLike}
                  onToggleBookmark={onToggleBookmark}
                  onShare={onShare}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/60 dark:bg-[#0F172A]/60 p-12 text-center space-y-3">
              <p className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white">
                No stories match your current filter.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try clearing your search query or switching to another category or reading length.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTag('');
                  setSearchQuery('');
                  setActiveSection('trending');
                }}
                className="px-4 py-2 rounded-lg bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-medium"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* "Because you read..." Section */}
          {recommendedStories.length > 0 && (
            <div className="pt-10 border-t border-slate-900/10 dark:border-slate-100/10 space-y-4">
              <div className="text-xs font-semibold tracking-wider uppercase text-[#EA580C]">
                Because you read long-form essays on INKWAVE
              </div>
              <div className="space-y-2">
                {recommendedStories.map((rec) => (
                  <StoryCard
                    key={`rec-${rec.id}`}
                    post={rec}
                    variant="compact"
                    onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                    onOpenProfile={(username) => onNavigate(ViewRoute.PROFILE, { username })}
                    onToggleLike={onToggleLike}
                    onToggleBookmark={onToggleBookmark}
                    onShare={onShare}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Smart Features Sidebar */}
        <aside className="lg:col-span-4 space-y-10">
          {/* Popular Topics (Interactive Filter Buttons) */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white border-b border-slate-900/10 dark:border-slate-100/10 pb-2.5">
              Popular Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag.slug ? '' : tag.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedTag === tag.slug
                      ? 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                      : 'bg-slate-900/5 dark:bg-slate-100/5 text-slate-700 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Most Active Discussions */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white border-b border-slate-900/10 dark:border-slate-100/10 pb-2.5">
              Most Active Discussions
            </h3>
            <div className="divide-y divide-slate-900/10 dark:divide-slate-100/10">
              {activeDiscussions.map((disc) => (
                <div
                  key={disc.id}
                  onClick={() => onNavigate(ViewRoute.STORY, { postId: disc.id })}
                  className="py-3.5 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                >
                  <h4 className="font-serif text-sm font-semibold text-[#0B132B] dark:text-slate-100 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                    {disc.title}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {disc.commentsCount} responses · {disc.author?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voices to Follow */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white border-b border-slate-900/10 dark:border-slate-100/10 pb-2.5">
              Featured Voices
            </h3>
            <div className="space-y-4">
              {featuredAuthors.map(({ author, isFollowing }) => (
                <div key={author.id} className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewRoute.PROFILE, { username: author.username })}
                    className="flex items-start gap-3 text-left group min-w-0"
                  >
                    <ResilientImage
                      src={author.avatar}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0B132B] dark:text-white group-hover:underline truncate">
                        {author.name}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {author.bio}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFollow(author.id, isFollowing)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isFollowing
                        ? 'border border-slate-900/15 dark:border-slate-100/15 text-slate-700 dark:text-slate-300'
                        : 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
