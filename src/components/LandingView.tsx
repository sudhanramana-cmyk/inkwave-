import React, { useState } from 'react';
import {
  ArrowRight,
  PenTool,
  Compass,
  Heart,
  MessageSquare,
  Bookmark,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StoryPost, CategoryItem, ViewRoute } from '../types';
import { StoryCard, ResilientImage } from './StoryCard';

interface LandingViewProps {
  posts: StoryPost[];
  categories: CategoryItem[];
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onShare: (post: StoryPost) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  posts,
  categories,
  onNavigate,
  onToggleLike,
  onToggleBookmark,
  onShare
}) => {
  const [waveMode, setWaveMode] = useState<'resonance' | 'discourse' | 'synthesis'>('resonance');
  const [streamCategory, setStreamCategory] = useState<string>('all');

  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const trendingPosts = [...posts]
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 4);

  const streamPosts =
    streamCategory === 'all'
      ? posts
      : posts.filter((p) => p.category.slug === streamCategory);

  const floatingSnippets = posts.slice(0, 3);

  const scrollStream = (direction: 'left' | 'right') => {
    const container = document.getElementById('inkwave-idea-stream');
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -380 : 380,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-24">
      {/* 1. SPLIT-SCREEN EDITORIAL HERO & INTERACTIVE WAVE OF IDEAS */}
      <section className="relative pt-8 sm:pt-14 pb-12 border-b border-slate-900/10 dark:border-slate-100/10 overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Editorial Typography & Primary CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#EA580C]">
                <span>INKWAVE Editorial Salon</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 dark:text-slate-400 normal-case tracking-normal italic font-serif text-sm">
                  “Ideas move. Stories stay.”
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl font-semibold tracking-tight text-[#0B132B] dark:text-[#F8FAFC] leading-[1.08] editorial-balance">
                Your thoughts deserve a place to move.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Write. Publish. Discuss. Discover ideas worth staying for. An intentional publishing platform where long-form craft meets thoughtful threaded dialogue.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.WRITE)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-sm font-semibold hover:opacity-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Start Writing</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate(ViewRoute.DISCOVER)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 text-[#0B132B] dark:text-slate-100 text-sm font-semibold hover:border-[#2563EB] dark:hover:border-blue-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                  <span>Explore Stories</span>
                </button>
              </div>

              {/* Quantitative Rigor & Social Proof adjacent to Hero claim */}
              <div className="pt-6 border-t border-slate-900/10 dark:border-slate-100/10 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#0B132B] dark:text-white">
                    {posts.length} Essays
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Curated long-form archive
                  </p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#0B132B] dark:text-white">
                    6.4 min
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Average sustained read time
                  </p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#0B132B] dark:text-white">
                    100%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ad-free reading rooms
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive "Wave of Ideas" Visual + Floating Article Snippets */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-[#0B132B] text-white p-6 sm:p-8 overflow-hidden shadow-xl">
                {/* Interactive Wave Controls */}
                <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                  <div className="text-xs text-slate-300 font-medium">
                    Interactive Idea Harmonic
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-white/10">
                    {(['resonance', 'discourse', 'synthesis'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setWaveMode(mode)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                          waveMode === mode
                            ? 'bg-[#2563EB] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animated SVG Wave of Ideas */}
                <div className="relative h-[300px] sm:h-[330px] flex items-center justify-center">
                  <svg
                    viewBox="0 0 600 280"
                    className="w-full h-full overflow-visible"
                    fill="none"
                  >
                    <defs>
                      <linearGradient id="heroWaveBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="heroWaveCoral" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EA580C" stopOpacity="0.7" />
                        <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* Harmonic Paths that respond to selected waveMode */}
                    <path
                      d={
                        waveMode === 'resonance'
                          ? 'M 0 150 C 140 40, 260 250, 400 120 C 490 45, 550 180, 600 130'
                          : waveMode === 'discourse'
                          ? 'M 0 180 C 110 30, 220 260, 340 80 C 450 230, 520 50, 600 140'
                          : 'M 0 140 C 180 90, 280 190, 420 135 C 510 100, 560 160, 600 140'
                      }
                      stroke="url(#heroWaveBlue)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={
                        waveMode === 'resonance'
                          ? 'M 0 185 C 150 95, 290 260, 430 155 C 510 95, 560 205, 600 165'
                          : waveMode === 'discourse'
                          ? 'M 0 120 C 140 240, 260 40, 390 190 C 480 70, 540 210, 600 110'
                          : 'M 0 175 C 160 135, 310 215, 450 160 C 525 130, 570 180, 600 160'
                      }
                      stroke="url(#heroWaveCoral)"
                      strokeWidth="2.2"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 0 215 C 180 155, 320 245, 470 180 C 540 150, 580 190, 600 180"
                      stroke="rgba(248,250,252,0.18)"
                      strokeWidth="1.5"
                    />

                    {/* Interactive Pulse Nodes on the Wave */}
                    <circle cx="155" cy="115" r="5" fill="#3B82F6" />
                    <circle cx="395" cy="122" r="6" fill="#EA580C" />
                    <circle cx="495" cy="148" r="4" fill="#10B981" />
                  </svg>

                  {/* Floating Article Snippet Cards */}
                  {floatingSnippets[0] && (
                    <button
                      type="button"
                      onClick={() => onNavigate(ViewRoute.STORY, { postId: floatingSnippets[0].id })}
                      className="animate-float-slow absolute top-2 left-1 sm:left-4 max-w-[250px] text-left p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/35 transition-colors cursor-pointer"
                    >
                      <div className="text-[11px] text-blue-300 font-medium">
                        {floatingSnippets[0].category.name} · {floatingSnippets[0].readingTime} min read
                      </div>
                      <p className="font-serif text-sm font-medium text-white line-clamp-2 mt-1">
                        “{floatingSnippets[0].title}”
                      </p>
                      <div className="text-[11px] text-slate-300 mt-1.5">
                        by {floatingSnippets[0].author?.name}
                      </div>
                    </button>
                  )}

                  {floatingSnippets[1] && (
                    <button
                      type="button"
                      onClick={() => onNavigate(ViewRoute.STORY, { postId: floatingSnippets[1].id })}
                      className="animate-float-delayed absolute bottom-3 right-1 sm:right-4 max-w-[255px] text-left p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/35 transition-colors cursor-pointer"
                    >
                      <div className="text-[11px] text-amber-300 font-medium">
                        {floatingSnippets[1].category.name} · {floatingSnippets[1].readingTime} min read
                      </div>
                      <p className="font-serif text-sm font-medium text-white line-clamp-2 mt-1">
                        “{floatingSnippets[1].title}”
                      </p>
                      <div className="text-[11px] text-slate-300 mt-1.5">
                        by {floatingSnippets[1].author?.name}
                      </div>
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Click any floating card to enter the reading room</span>
                  <span className="font-mono tabular-nums text-blue-300">
                    {posts.reduce((acc, p) => acc + p.commentsCount, 0)} active responses
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL FEATURED STORY SECTION */}
      {featuredPost && (
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/90 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs tracking-wider uppercase font-semibold text-[#EA580C]">
                    <span>Featured Dispatch</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#2563EB] dark:text-blue-400">{featuredPost.category.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 normal-case">
                      {featuredPost.readingTime} min read
                    </span>
                  </div>

                  <h2
                    onClick={() => onNavigate(ViewRoute.STORY, { postId: featuredPost.id })}
                    className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#0B132B] dark:text-white leading-[1.12] cursor-pointer hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors editorial-balance"
                  >
                    {featuredPost.title}
                  </h2>

                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {featuredPost.subtitle}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-900/10 dark:border-slate-100/10 first-letter:text-3xl first-letter:font-serif first-letter:font-semibold first-letter:mr-1.5 first-letter:text-[#0B132B] dark:first-letter:text-white">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                  {featuredPost.author && (
                    <button
                      type="button"
                      onClick={() => onNavigate(ViewRoute.PROFILE, { username: featuredPost.author!.username })}
                      className="flex items-center gap-3 text-left group"
                    >
                      <ResilientImage
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#0B132B] dark:text-white group-hover:underline">
                          {featuredPost.author.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Founding Editor · {featuredPost.views.toLocaleString()} views
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigate(ViewRoute.STORY, { postId: featuredPost.id })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    <span>Read Full Essay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                onClick={() => onNavigate(ViewRoute.STORY, { postId: featuredPost.id })}
                className="lg:col-span-5 min-h-[280px] lg:min-h-full relative overflow-hidden cursor-pointer group bg-slate-950"
              >
                <ResilientImage
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                  <div className="text-xs text-white/90 font-mono tabular-nums">
                    {featuredPost.likesCount + featuredPost.reactionsCount} reactions · {featuredPost.commentsCount} threaded replies
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. "WHAT'S MOVING THROUGH INKWAVE?" TRENDING SECTION */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 dark:border-slate-100/10 pb-5">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white">
              What’s moving through INKWAVE?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Stories gaining momentum across reading rooms right now, ranked by sustained reading depth and discussion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(ViewRoute.DISCOVER)}
            className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Explore all trending stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingPosts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => onNavigate(ViewRoute.STORY, { postId: post.id })}
              className="group cursor-pointer rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/70 p-6 flex flex-col justify-between hover:border-[#2563EB]/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-slate-400 dark:text-slate-500">
                    0{index + 1}. {post.category.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#EA580C] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                    <span className="font-mono tabular-nums">{post.readingTime} min</span>
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {post.subtitle || post.excerpt}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-900/5 dark:border-slate-100/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {post.author?.name}
                </span>
                <span className="font-mono tabular-nums shrink-0">
                  {post.likesCount + post.reactionsCount} likes · {post.commentsCount} replies
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HORIZONTAL "IDEA STREAM" SECTION */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white">
              The Idea Stream
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              A flowing current of essays, field notes, and technical monographs across disciplines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollStream('left')}
              aria-label="Scroll Idea Stream left"
              className="p-2 rounded-lg border border-slate-900/10 dark:border-slate-100/10 hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollStream('right')}
              aria-label="Scroll Idea Stream right"
              className="p-2 rounded-lg border border-slate-900/10 dark:border-slate-100/10 hover:bg-slate-900/5 dark:hover:bg-slate-100/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Category Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setStreamCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              streamCategory === 'all'
                ? 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                : 'bg-slate-900/5 dark:bg-slate-100/5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Currents
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setStreamCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                streamCategory === cat.slug
                  ? 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                  : 'bg-slate-900/5 dark:bg-slate-100/5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Flowing Horizontal Cards */}
        <div
          id="inkwave-idea-stream"
          className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-1 snap-x"
        >
          {streamPosts.length > 0 ? (
            streamPosts.map((post) => (
              <StoryCard
                key={post.id}
                post={post}
                variant="stream"
                onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                onOpenProfile={(username) => onNavigate(ViewRoute.PROFILE, { username })}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onShare={onShare}
              />
            ))
          ) : (
            <div className="w-full py-12 text-center rounded-2xl border border-dashed border-slate-900/15 dark:border-slate-100/15 text-sm text-slate-500">
              No stories published in this category yet. Be the first to start a wave here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
