import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Edit3,
  Trash2,
  CornerDownRight,
  Check,
  Sparkles,
  BookOpen,
  Send
} from 'lucide-react';
import {
  StoryPost,
  CommentItem,
  UserProfile,
  ReactionType,
  ShelfType,
  ViewRoute
} from '../types';
import { apiFetch } from '../api';
import { ResilientImage, StoryCard } from './StoryCard';

interface StoryReaderViewProps {
  postId: string;
  currentUser: UserProfile | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onEditStory: (post: StoryPost) => void;
  onDeleteStory: (postId: string) => void;
  onShare: (post: StoryPost) => void;
  onNotifyToast: (msg: string) => void;
  onPostUpdated: (post: StoryPost) => void;
}

interface HeadingItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export const StoryReaderView: React.FC<StoryReaderViewProps> = ({
  postId,
  currentUser,
  onNavigate,
  onEditStory,
  onDeleteStory,
  onShare,
  onNotifyToast,
  onPostUpdated
}) => {
  const [post, setPost] = useState<StoryPost | null>(null);
  const [related, setRelated] = useState<StoryPost[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [commentSort, setCommentSort] = useState<'most_liked' | 'newest' | 'oldest'>('most_liked');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Comment & Reply states
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Micro-animation states
  const [likeBurst, setLikeBurst] = useState(false);
  const [activeReactionAnim, setActiveReactionAnim] = useState<ReactionType | null>(null);
  const [shelfMenuOpen, setShelfMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([
      apiFetch<{ post: StoryPost; related: StoryPost[] }>(`/api/posts/${postId}`),
      apiFetch<{ comments: CommentItem[]; totalCount: number; participantsCount: number }>(
        `/api/posts/${postId}/comments?sort=${commentSort}`
      )
    ])
      .then(([postRes, commentsRes]) => {
        if (!active) return;
        setPost(postRes.post);
        setRelated(postRes.related);
        setComments(commentsRes.comments);
        setParticipantsCount(commentsRes.participantsCount);
        onPostUpdated(postRes.post);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Couldn't load this story.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  // Reload comments when sort changes
  useEffect(() => {
    if (!post) return;
    apiFetch<{ comments: CommentItem[]; totalCount: number; participantsCount: number }>(
      `/api/posts/${post.id}/comments?sort=${commentSort}`
    )
      .then((res) => {
        setComments(res.comments);
        setParticipantsCount(res.participantsCount);
      })
      .catch(() => {});
  }, [commentSort, post?.id]);

  // Reading progress listener
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      setScrollProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  // Extract headings for Floating Table of Contents
  const headings = useMemo<HeadingItem[]>(() => {
    if (!post) return [];
    const lines = post.content.split('\n');
    const extracted: HeadingItem[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4).trim();
        extracted.push({ id: `sec-${idx}`, text, level: 3 });
      } else if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3).trim();
        extracted.push({ id: `sec-${idx}`, text, level: 2 });
      }
    });
    return extracted;
  }, [post]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      onNotifyToast('Please sign in to like stories.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post) return;
    setLikeBurst(true);
    setTimeout(() => setLikeBurst(false), 380);
    try {
      const res = await apiFetch<{ liked: boolean; post: StoryPost }>(`/api/posts/${post.id}/like`, {
        method: 'POST'
      });
      setPost(res.post);
      onPostUpdated(res.post);
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update like');
    }
  };

  const handleSelectReaction = async (type: ReactionType) => {
    if (!currentUser) {
      onNotifyToast('Please sign in to react to stories.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post) return;
    setActiveReactionAnim(type);
    setTimeout(() => setActiveReactionAnim(null), 380);

    try {
      if (post.myReaction === type) {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${post.id}/reaction`, {
          method: 'DELETE'
        });
        setPost(res.post);
        onPostUpdated(res.post);
      } else {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${post.id}/reaction`, {
          method: 'POST',
          body: JSON.stringify({ type })
        });
        setPost(res.post);
        onPostUpdated(res.post);
      }
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not save reaction');
    }
  };

  const handleSaveToShelf = async (shelf: ShelfType | null) => {
    if (!currentUser) {
      onNotifyToast('Please sign in to save stories to your Reading Shelf.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post) return;
    setShelfMenuOpen(false);
    try {
      if (shelf === null) {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${post.id}/bookmark`, {
          method: 'DELETE'
        });
        setPost(res.post);
        onPostUpdated(res.post);
        onNotifyToast('Removed from your Reading Shelf.');
      } else {
        const res = await apiFetch<{ post: StoryPost }>(`/api/posts/${post.id}/bookmark`, {
          method: 'POST',
          body: JSON.stringify({ shelf })
        });
        setPost(res.post);
        onPostUpdated(res.post);
        const shelfLabels: Record<ShelfType, string> = {
          recent: 'Recently Saved',
          later: 'Reading Later',
          favorites: 'Favorites'
        };
        onNotifyToast(`Saved to "${shelfLabels[shelf]}" on your shelf.`);
      }
    } catch (err: any) {
      onNotifyToast(err.message || 'Failed to update shelf');
    }
  };

  const handleToggleFollowAuthor = async () => {
    if (!currentUser) {
      onNotifyToast('Please sign in to follow authors.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post || !post.author) return;
    try {
      const method = post.isFollowingAuthor ? 'DELETE' : 'POST';
      await apiFetch(`/api/users/${post.author.id}/follow`, { method });
      const updated = {
        ...post,
        isFollowingAuthor: !post.isFollowingAuthor,
        author: {
          ...post.author,
          followersCount: post.author.followersCount + (post.isFollowingAuthor ? -1 : 1)
        }
      };
      setPost(updated);
      onPostUpdated(updated);
      onNotifyToast(
        updated.isFollowingAuthor
          ? `Following ${post.author.name}. Their stories will appear in Your Wave.`
          : `Unfollowed ${post.author.name}.`
      );
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update follow status');
    }
  };

  const handlePostComment = async (parentId: string | null = null) => {
    if (!currentUser) {
      onNotifyToast('Please sign in to join the discussion.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post) return;
    const text = parentId ? replyText.trim() : newCommentText.trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      await apiFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text, parentId })
      });
      const refreshed = await apiFetch<{
        comments: CommentItem[];
        totalCount: number;
        participantsCount: number;
      }>(`/api/posts/${post.id}/comments?sort=${commentSort}`);
      setComments(refreshed.comments);
      setParticipantsCount(refreshed.participantsCount);

      const updatedPost = { ...post, commentsCount: refreshed.totalCount };
      setPost(updatedPost);
      onPostUpdated(updatedPost);

      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
        onNotifyToast('Reply added to thread.');
      } else {
        setNewCommentText('');
        onNotifyToast('Your response has been published.');
      }
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !post) return;
    try {
      await apiFetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editingCommentText })
      });
      const refreshed = await apiFetch<{
        comments: CommentItem[];
        totalCount: number;
        participantsCount: number;
      }>(`/api/posts/${post.id}/comments?sort=${commentSort}`);
      setComments(refreshed.comments);
      setEditingCommentId(null);
      onNotifyToast('Comment updated.');
    } catch (err: any) {
      onNotifyToast(err.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      const refreshed = await apiFetch<{
        comments: CommentItem[];
        totalCount: number;
        participantsCount: number;
      }>(`/api/posts/${post.id}/comments?sort=${commentSort}`);
      setComments(refreshed.comments);
      setParticipantsCount(refreshed.participantsCount);
      const updatedPost = { ...post, commentsCount: refreshed.totalCount };
      setPost(updatedPost);
      onPostUpdated(updatedPost);
      onNotifyToast('Comment deleted.');
    } catch (err: any) {
      onNotifyToast(err.message || 'Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      onNotifyToast('Please sign in to like responses.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!post) return;
    try {
      await apiFetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      const refreshed = await apiFetch<{
        comments: CommentItem[];
        totalCount: number;
        participantsCount: number;
      }>(`/api/posts/${post.id}/comments?sort=${commentSort}`);
      setComments(refreshed.comments);
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not like comment');
    }
  };

  // Format rich story content into semantic editorial blocks
  const renderEditorialContent = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let firstParagraphRendered = false;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // Code Block
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <div
            key={`code-${i}`}
            className="my-8 rounded-xl overflow-hidden border border-slate-900/15 dark:border-slate-100/15 bg-[#0B132B] text-slate-100"
          >
            {lang && (
              <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-[11px] font-mono text-slate-400">
                {lang}
              </div>
            )}
            <pre className="p-5 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4).trim();
        elements.push(
          <h3
            id={`sec-${i}`}
            key={`h3-${i}`}
            className="font-serif text-xl sm:text-2xl font-semibold text-[#0B132B] dark:text-white mt-10 mb-4 scroll-mt-24"
          >
            {text}
          </h3>
        );
        i++;
        continue;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3).trim();
        elements.push(
          <h2
            id={`sec-${i}`}
            key={`h2-${i}`}
            className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white mt-12 mb-4 pt-4 border-t border-slate-900/10 dark:border-slate-100/10 scroll-mt-24"
          >
            {text}
          </h2>
        );
        i++;
        continue;
      }

      // Pull Quote
      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.slice(2).replace(/^"|"$/g, '').trim();
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-10 pl-6 sm:pl-8 border-l-2 border-[#EA580C] font-serif italic text-xl sm:text-2xl text-[#0B132B] dark:text-slate-100 leading-relaxed"
          >
            “{quoteText}”
          </blockquote>
        );
        i++;
        continue;
      }

      // Unordered or Numbered List
      if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
        const listItems: string[] = [];
        const isOrdered = /^\d+\.\s/.test(trimmed);
        while (
          i < lines.length &&
          (lines[i].trim().startsWith('- ') || /^\d+\.\s/.test(lines[i].trim()))
        ) {
          listItems.push(lines[i].trim().replace(/^(-|\d+\.)\s+/, ''));
          i++;
        }
        const ListTag = isOrdered ? 'ol' : 'ul';
        elements.push(
          <ListTag
            key={`list-${i}`}
            className={`my-6 space-y-2.5 pl-6 ${
              isOrdered ? 'list-decimal' : 'list-disc'
            } text-base sm:text-[17px] text-slate-800 dark:text-slate-200 leading-relaxed`}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-1">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ListTag>
        );
        continue;
      }

      // Embedded Markdown Image ![alt](url)
      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        elements.push(
          <figure key={`img-${i}`} className="my-8 space-y-2">
            <div className="rounded-xl overflow-hidden border border-slate-900/10 dark:border-slate-100/10">
              <ResilientImage
                src={imgMatch[2]}
                alt={imgMatch[1] || 'Story illustration'}
                className="w-full max-h-[460px] object-cover"
              />
            </div>
            {imgMatch[1] && (
              <figcaption className="text-xs font-serif italic text-slate-500 text-center">
                {imgMatch[1]}
              </figcaption>
            )}
          </figure>
        );
        i++;
        continue;
      }

      // Standard Paragraph (with Drop Cap on first paragraph)
      const isFirst = !firstParagraphRendered;
      firstParagraphRendered = true;
      elements.push(
        <p
          key={`p-${i}`}
          className={`my-5 text-base sm:text-[17px] text-slate-800 dark:text-slate-200 leading-[1.82] ${
            isFirst
              ? 'first-letter:text-5xl first-letter:font-serif first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none first-letter:text-[#0B132B] dark:first-letter:text-white'
              : ''
          }`}
        >
          {renderInlineFormatting(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-[#0B132B] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic font-serif">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10 font-mono text-[14px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-300 dark:bg-slate-800 rounded" />
        <div className="h-12 w-full bg-slate-300 dark:bg-slate-800 rounded-lg" />
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="aspect-[16/9] w-full bg-slate-300 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white">
          Couldn’t load this story.
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {error || 'The requested essay may have been unpublished or removed.'}
        </p>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.DISCOVER)}
          className="px-5 py-2.5 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  const canModifyPost =
    currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');

  const reactionDefinitions: Array<{
    type: ReactionType;
    emoji: string;
    label: string;
  }> = [
    { type: 'loved', emoji: '❤️', label: 'Loved it' },
    { type: 'insightful', emoji: '💡', label: 'Insightful' },
    { type: 'interesting', emoji: '🔥', label: 'Interesting' },
    { type: 'thinking', emoji: '🤔', label: 'Made me think' }
  ];

  return (
    <div className="relative">
      {/* Top SVG Reading Progress Bar (Zero inline styles!) */}
      <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-transparent pointer-events-none">
        <svg className="w-full h-1 block" preserveAspectRatio="none" viewBox="0 0 100 1">
          <rect x="0" y="0" width={scrollProgress} height="1" fill="#2563EB" />
        </svg>
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10">
        {/* Top Back & Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-900/10 dark:border-slate-100/10">
          <button
            type="button"
            onClick={() => onNavigate(ViewRoute.DISCOVER)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#0B132B] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover</span>
          </button>

          {/* "Currently reading" indicator + Reading time + Freshness */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Currently reading · {scrollProgress}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{post.readingTime} min read</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{post.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Asymmetric Editorial Reading Canvas (Main Column + Floating TOC / Sticky Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-10">
          {/* Left Sticky Rail: Article Actions & Table of Contents */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-28 space-y-8">
              {/* Sticky Article Actions */}
              <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/80 p-5 space-y-4">
                <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Article Actions
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      post.likedByMe
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border-slate-900/10 dark:border-slate-100/10 text-slate-700 dark:text-slate-200 hover:border-slate-900/25'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''} ${
                        likeBurst ? 'animate-heart-burst' : ''
                      }`}
                    />
                    <span className="font-mono tabular-nums">{post.likesCount}</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShelfMenuOpen(!shelfMenuOpen)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        post.myBookmarkShelf
                          ? 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400'
                          : 'border-slate-900/10 dark:border-slate-100/10 text-slate-700 dark:text-slate-200 hover:border-slate-900/25'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${post.myBookmarkShelf ? 'fill-current' : ''}`} />
                      <span>{post.myBookmarkShelf ? 'Saved' : 'Save'}</span>
                    </button>

                    {shelfMenuOpen && (
                      <div className="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-[#0F172A] shadow-xl p-2 space-y-1 text-xs">
                        <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                          Save to Reading Shelf
                        </div>
                        {(['recent', 'later', 'favorites'] as ShelfType[]).map((shelfKey) => (
                          <button
                            key={shelfKey}
                            type="button"
                            onClick={() => handleSaveToShelf(shelfKey)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-900/5 dark:hover:bg-slate-100/5 ${
                              post.myBookmarkShelf === shelfKey
                                ? 'text-[#2563EB] font-semibold'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className="capitalize">
                              {shelfKey === 'recent'
                                ? 'Recently saved'
                                : shelfKey === 'later'
                                ? 'Reading later'
                                : 'Favorites'}
                            </span>
                            {post.myBookmarkShelf === shelfKey && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                        {post.myBookmarkShelf && (
                          <button
                            type="button"
                            onClick={() => handleSaveToShelf(null)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
                          >
                            Remove from Shelf
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <a
                    href="#discussion-thread"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-slate-100/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-900/25 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-mono tabular-nums">{post.commentsCount}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onShare(post)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-slate-100/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-900/25 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Author / Admin Edit & Delete Controls */}
                {canModifyPost && (
                  <div className="pt-3 border-t border-slate-900/10 dark:border-slate-100/10 space-y-2">
                    <button
                      type="button"
                      onClick={() => onEditStory(post)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900/5 dark:bg-slate-100/5 hover:bg-slate-900/10 text-xs font-medium text-[#0B132B] dark:text-slate-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Story</span>
                    </button>
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Story</span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-2 text-center">
                        <p className="text-[11px] text-rose-600 dark:text-rose-300 font-medium">
                          Permanently delete this story?
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onDeleteStory(post.id)}
                            className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-semibold"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Table of Contents for long articles */}
              {headings.length > 0 && (
                <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/80 p-5 space-y-3">
                  <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                    Table of Contents
                  </div>
                  <nav className="space-y-2 text-xs">
                    {headings.map((h, idx) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`block text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors leading-snug ${
                          h.level === 3 ? 'pl-4 text-[11px]' : 'font-medium'
                        }`}
                      >
                        <span className="font-mono text-slate-400 mr-1.5">0{idx + 1}.</span>
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </aside>

          {/* Main Reading Column (65-75ch Optimal Measure) */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <article className="max-w-[720px] mx-auto space-y-8">
              {/* Unboxed Metadata Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider">
                    {post.category.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Published{' '}
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{post.readingTime} min read</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.freshness}</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0B132B] dark:text-white leading-[1.12] editorial-balance">
                  {post.title}
                </h1>

                {post.subtitle && (
                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                    {post.subtitle}
                  </p>
                )}

                {/* Author Byline & Follow Action */}
                {post.author && (
                  <div className="pt-4 pb-2 flex items-center justify-between gap-4 border-y border-slate-900/10 dark:border-slate-100/10">
                    <button
                      type="button"
                      onClick={() => onNavigate(ViewRoute.PROFILE, { username: post.author!.username })}
                      className="flex items-center gap-3.5 text-left group"
                    >
                      <ResilientImage
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0B132B] dark:text-white group-hover:underline">
                            {post.author.name}
                          </span>
                          {post.author.featuredWriter && (
                            <span className="text-[11px] font-medium text-[#EA580C]">
                              · Featured Writer
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          @{post.author.username} · {post.author.followersCount} followers
                        </div>
                      </div>
                    </button>

                    {(!currentUser || currentUser.id !== post.author.id) && (
                      <button
                        type="button"
                        onClick={handleToggleFollowAuthor}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          post.isFollowingAuthor
                            ? 'border border-slate-900/20 dark:border-slate-100/20 text-slate-700 dark:text-slate-200'
                            : 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                        }`}
                      >
                        {post.isFollowingAuthor ? 'Following' : 'Follow Author'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Artwork */}
              <div className="rounded-2xl overflow-hidden border border-slate-900/10 dark:border-slate-100/10 bg-slate-950">
                <ResilientImage
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>

              {/* Main Story Body */}
              <div className="pt-2">{renderEditorialContent(post.content)}</div>

              {/* Unboxed Topic Tags Footer */}
              {post.tags.length > 0 && (
                <div className="pt-6 border-t border-slate-900/10 dark:border-slate-100/10 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Filed under:</span>
                  {post.tags.map((t, i) => (
                    <React.Fragment key={t.id}>
                      {i > 0 && <span aria-hidden="true">·</span>}
                      <span>#{t.name}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* 9. REACTION SYSTEM */}
              <section className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/90 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#0B132B] dark:text-white">
                      How did this story resonate with you?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select a reaction to signal the essay’s impact to the community.
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-slate-500">
                    {post.reactionsCount + post.likesCount} total reactions
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reactionDefinitions.map((rx) => {
                    const isSelected = post.myReaction === rx.type;
                    const count = post.reactionCounts[rx.type] || 0;
                    const isAnimating = activeReactionAnim === rx.type;
                    return (
                      <button
                        key={rx.type}
                        type="button"
                        onClick={() => handleSelectReaction(rx.type)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB]/10 dark:bg-blue-500/20 text-[#0B132B] dark:text-white font-semibold'
                            : 'border-slate-900/10 dark:border-slate-100/10 hover:border-slate-900/25 text-slate-700 dark:text-slate-300'
                        } ${isAnimating ? 'animate-heart-burst' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{rx.emoji}</span>
                          <span className="text-xs truncate">{rx.label}</span>
                        </div>
                        <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 ml-2">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 8. THREADED DISCUSSION SYSTEM */}
              <section
                id="discussion-thread"
                className="pt-10 border-t border-slate-900/10 dark:border-slate-100/10 space-y-8 scroll-mt-20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white">
                      Threaded Correspondence
                    </h3>
                    <p className="text-xs font-medium text-[#EA580C] mt-1">
                      {participantsCount === 1
                        ? '1 person is discussing this story'
                        : `${Math.max(participantsCount, comments.length > 0 ? 2 : 0)} people are discussing this`}
                    </p>
                  </div>

                  {/* Comment Sorting Controls */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/5 dark:bg-slate-100/5">
                    {(
                      [
                        { id: 'most_liked', label: 'Most liked' },
                        { id: 'newest', label: 'Newest' },
                        { id: 'oldest', label: 'Oldest' }
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCommentSort(s.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                          commentSort === s.id
                            ? 'bg-white dark:bg-[#1E293B] text-[#0B132B] dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top-Level Comment Composer */}
                <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-5 space-y-4">
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={
                      currentUser
                        ? `Add your perspective to the conversation, ${currentUser.name}...`
                        : 'Sign in to contribute to this threaded discussion...'
                    }
                    className="w-full bg-transparent text-sm text-[#0B132B] dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900/10 dark:border-slate-100/10">
                    <span className="text-xs text-slate-400">
                      Thoughtful, substantive replies elevate the salon.
                    </span>
                    <button
                      type="button"
                      disabled={submittingComment || !newCommentText.trim()}
                      onClick={() => handlePostComment(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Response</span>
                    </button>
                  </div>
                </div>

                {/* Threaded Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-6">
                    {comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/60 dark:bg-[#0F172A]/60 p-5 sm:p-6 space-y-4"
                      >
                        {/* Parent Comment */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            {cmt.author && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigate(ViewRoute.PROFILE, { username: cmt.author!.username })
                                }
                                className="flex items-center gap-2.5 text-left group"
                              >
                                <ResilientImage
                                  src={cmt.author.avatar}
                                  alt={cmt.author.name}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                                <span className="text-xs font-semibold text-[#0B132B] dark:text-white group-hover:underline">
                                  {cmt.author.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  ·{' '}
                                  {new Date(cmt.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </button>
                            )}

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <button
                                type="button"
                                onClick={() => handleLikeComment(cmt.id)}
                                className={`flex items-center gap-1 font-mono tabular-nums ${
                                  cmt.likedByMe
                                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                    : 'hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${cmt.likedByMe ? 'fill-current' : ''}`} />
                                <span>{cmt.likesCount}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(replyingToId === cmt.id ? null : cmt.id);
                                  setReplyText('');
                                }}
                                className="hover:text-[#2563EB] font-medium"
                              >
                                Reply
                              </button>

                              {currentUser && currentUser.id === cmt.authorId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(cmt.id);
                                    setEditingCommentText(cmt.content);
                                  }}
                                  className="hover:text-slate-900 dark:hover:text-white"
                                >
                                  Edit
                                </button>
                              )}

                              {currentUser &&
                                (currentUser.id === cmt.authorId || currentUser.role === 'admin') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(cmt.id)}
                                    className="text-rose-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                            </div>
                          </div>

                          {editingCommentId === cmt.id ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={2}
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditComment(cmt.id)}
                                  className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1 rounded-lg text-xs text-slate-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-9">
                              “{cmt.content}”
                            </p>
                          )}
                        </div>

                        {/* Inline Reply Box */}
                        {replyingToId === cmt.id && (
                          <div className="pl-9 pt-2 space-y-2">
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${cmt.author?.name || 'comment'}...`}
                              className="w-full p-3 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-[#2563EB]"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePostComment(cmt.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
                              >
                                Post Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs text-slate-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Threaded Child Replies (↳ USER B) */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="pl-6 sm:pl-10 pt-2 space-y-3 border-l-2 border-slate-900/10 dark:border-slate-100/10 ml-4">
                            {cmt.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="p-3.5 rounded-xl bg-slate-900/[0.03] dark:bg-slate-100/[0.03] space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[#2563EB] font-mono">↳</span>
                                    {reply.author && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onNavigate(ViewRoute.PROFILE, {
                                            username: reply.author!.username
                                          })
                                        }
                                        className="font-semibold text-[#0B132B] dark:text-white hover:underline"
                                      >
                                        {reply.author.name}
                                      </button>
                                    )}
                                    <span className="text-slate-400">
                                      ·{' '}
                                      {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                    <button
                                      type="button"
                                      onClick={() => handleLikeComment(reply.id)}
                                      className={`flex items-center gap-1 font-mono tabular-nums ${
                                        reply.likedByMe ? 'text-rose-600 font-semibold' : ''
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${reply.likedByMe ? 'fill-current' : ''}`}
                                      />
                                      <span>{reply.likesCount}</span>
                                    </button>
                                    {currentUser &&
                                      (currentUser.id === reply.authorId ||
                                        currentUser.role === 'admin') && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="text-rose-600 hover:underline"
                                        >
                                          Delete
                                        </button>
                                      )}
                                  </div>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                                  “{reply.content}”
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No responses yet. Start the threaded discussion above.
                  </div>
                )}
              </section>

              {/* 11. "CONTINUE READING" RELATED STORIES */}
              {related.length > 0 && (
                <section className="pt-12 border-t border-slate-900/10 dark:border-slate-100/10 space-y-6">
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase text-[#2563EB] dark:text-blue-400">
                      Continue Reading
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white mt-1">
                      Related Dispatches on INKWAVE
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {related.map((relPost) => (
                      <StoryCard
                        key={relPost.id}
                        post={relPost}
                        variant="compact"
                        onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                        onOpenProfile={(username) => onNavigate(ViewRoute.PROFILE, { username })}
                        onToggleLike={() => {}}
                        onToggleBookmark={() => {}}
                        onShare={onShare}
                      />
                    ))}
                  </div>
                </section>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};
