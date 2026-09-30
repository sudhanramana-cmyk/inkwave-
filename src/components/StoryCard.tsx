import React, { useState } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, ArrowUpRight } from 'lucide-react';
import { StoryPost } from '../types';

interface StoryCardProps {
  post: StoryPost;
  onOpenStory: (postId: string) => void;
  onOpenProfile: (username: string) => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onShare: (post: StoryPost) => void;
  variant?: 'default' | 'compact' | 'stream';
}

export const ResilientImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-[#0B132B] via-[#1E293B] to-[#2563EB] flex items-center justify-center p-6 text-center ${className}`}
      >
        <span className="font-serif italic text-white/80 text-sm line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const StoryCard: React.FC<StoryCardProps> = ({
  post,
  onOpenStory,
  onOpenProfile,
  onToggleLike,
  onToggleBookmark,
  onShare,
  variant = 'default'
}) => {
  const [bursting, setBursting] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBursting(true);
    onToggleLike(post.id);
    setTimeout(() => setBursting(false), 380);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(post.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(post);
  };

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  if (variant === 'compact') {
    return (
      <article
        onClick={() => onOpenStory(post.id)}
        className="group cursor-pointer py-5 border-b border-slate-900/10 dark:border-slate-100/10 flex items-start justify-between gap-5 transition-colors"
      >
        <div className="space-y-2 min-w-0 flex-1">
          {/* Unboxed static metadata with typographic separators */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-[#2563EB] dark:text-blue-400">{post.category.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{post.readingTime} min read</span>
            <span aria-hidden="true">·</span>
            <span>{post.freshness}</span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#0B132B] dark:text-slate-100 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors leading-snug">
            {post.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {post.subtitle || post.excerpt}
          </p>

          <div className="pt-1 flex items-center justify-between gap-4">
            {post.author && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile(post.author!.username);
                }}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:underline"
              >
                <ResilientImage
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-medium">{post.author.name}</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400">{formattedDate}</span>
              </button>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <button
                type="button"
                onClick={handleLikeClick}
                className={`flex items-center gap-1 transition-colors ${
                  post.likedByMe ? 'text-rose-600 dark:text-rose-400 font-medium' : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-current' : ''} ${
                    bursting ? 'animate-heart-burst' : ''
                  }`}
                />
                <span>{post.likesCount + post.reactionsCount}</span>
              </button>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{post.commentsCount}</span>
              </span>
              <button
                type="button"
                onClick={handleBookmarkClick}
                className={`transition-colors ${
                  post.myBookmarkShelf ? 'text-[#2563EB] dark:text-blue-400' : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Save to Reading Shelf"
              >
                <Bookmark className={`w-3.5 h-3.5 ${post.myBookmarkShelf ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-900">
          <ResilientImage
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onOpenStory(post.id)}
      className={`group cursor-pointer rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/80 hover:border-slate-900/25 dark:hover:border-slate-100/25 transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        variant === 'stream' ? 'min-w-[310px] sm:min-w-[350px] max-w-[360px] shrink-0' : ''
      }`}
    >
      <div>
        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-900 relative">
          <ResilientImage
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {/* Unboxed metadata row */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-[#2563EB] dark:text-blue-400">{post.category.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{post.readingTime} min read</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
            </div>
            {post.trendingScore > 120 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#EA580C] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                Trending
              </span>
            )}
          </div>

          <h3 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-slate-100 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors leading-snug">
            {post.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {post.subtitle || post.excerpt}
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-900/5 dark:border-slate-100/5 flex items-center justify-between gap-3">
        {post.author ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile(post.author!.username);
            }}
            className="flex items-center gap-2 text-left group/author min-w-0"
          >
            <ResilientImage
              src={post.author.avatar}
              alt={post.author.name}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover/author:underline truncate">
              {post.author.name}
            </span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
          <button
            type="button"
            onClick={handleLikeClick}
            className={`flex items-center gap-1 transition-colors ${
              post.likedByMe ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Like story"
          >
            <Heart
              className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-current' : ''} ${
                bursting ? 'animate-heart-burst' : ''
              }`}
            />
            <span>{post.likesCount + post.reactionsCount}</span>
          </button>

          <span className="flex items-center gap-1" title="Discussion responses">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentsCount}</span>
          </span>

          <button
            type="button"
            onClick={handleBookmarkClick}
            className={`transition-colors ${
              post.myBookmarkShelf ? 'text-[#2563EB] dark:text-blue-400' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
            title={post.myBookmarkShelf ? `Saved in ${post.myBookmarkShelf}` : 'Save to Shelf'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${post.myBookmarkShelf ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Share story"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
