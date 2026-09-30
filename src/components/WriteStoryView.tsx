import React, { useState, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Quote,
  List,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  Eye,
  Save,
  Send,
  X,
  Plus,
  Sparkles
} from 'lucide-react';
import { CategoryItem, StoryPost, UserProfile, ViewRoute } from '../types';
import { apiFetch } from '../api';
import { ResilientImage } from './StoryCard';

interface WriteStoryViewProps {
  currentUser: UserProfile | null;
  categories: CategoryItem[];
  editingPost?: StoryPost | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onStorySaved: (post: StoryPost) => void;
  onNotifyToast: (msg: string) => void;
}

const ARTWORK_PRESETS = [
  { id: 'silence', label: 'Quiet Study', url: '/api/artwork/silence' },
  { id: 'architecture', label: 'Monolith Light', url: '/api/artwork/architecture' },
  { id: 'systems', label: 'Horology & Systems', url: '/api/artwork/systems' },
  { id: 'science', label: 'Optics & Inquiry', url: '/api/artwork/science' },
  { id: 'compiler', label: 'Syntax & Logic', url: '/api/artwork/compiler' },
  { id: 'economics', label: 'Archival Ledger', url: '/api/artwork/economics' },
  { id: 'midnight', label: 'Nocturnal Walk', url: '/api/artwork/midnight' },
  { id: 'typography', label: 'Letterpress Grid', url: '/api/artwork/typography' }
];

export const WriteStoryView: React.FC<WriteStoryViewProps> = ({
  currentUser,
  categories,
  editingPost,
  onNavigate,
  onStorySaved,
  onNotifyToast
}) => {
  const [title, setTitle] = useState(editingPost?.title || '');
  const [subtitle, setSubtitle] = useState(editingPost?.subtitle || '');
  const [coverImage, setCoverImage] = useState(editingPost?.coverImage || '/api/artwork/silence');
  const [categoryId, setCategoryId] = useState(
    editingPost?.categoryId || categories[0]?.id || 'cat_culture'
  );
  const [tags, setTags] = useState<string[]>(
    editingPost?.tags.map((t) => t.name) || ['Digital Calm', 'Craft']
  );
  const [tagInput, setTagInput] = useState('');
  const [thoughtStarter, setThoughtStarter] = useState(editingPost?.thoughtStarter ?? true);
  const [content, setContent] = useState(
    editingPost?.content ||
      `Write with clarity and unhurried focus. Use the formatting bar above to insert section headings, pull quotes, code blocks, or illustrations.\n\n## The First Principle\n\nEvery enduring essay begins with an observation noticed closely enough that it reveals a larger structure.\n\n> "Ideas move when they are given room to breathe."`
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Live Word Count & Reading Time Calculation
  const { wordCount, readingTime } = useMemo(() => {
    const cleaned = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*_`~\[\]()!-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = cleaned ? cleaned.split(' ').filter(Boolean).length : 0;
    const min = Math.max(1, Math.ceil(words / 210));
    return { wordCount: words, readingTime: min };
  }, [content]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-semibold text-[#0B132B] dark:text-white">
          Sign in to open the Writing Studio.
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Create an account or sign in with a demo writer profile to draft, preview, and publish essays on INKWAVE.
        </p>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.AUTH)}
          className="px-6 py-3 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const insertFormat = (prefix: string, suffix = '', placeholder = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}\n${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const updated = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 20);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const cleaned = tagInput.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned) && tags.length < 6) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim() || title.trim().length < 3) {
      onNotifyToast('Please enter a story title (at least 3 characters).');
      return;
    }
    if (!content.trim() || content.trim().length < 15) {
      onNotifyToast('Please write your story body before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        coverImage,
        categoryId,
        tags,
        thoughtStarter,
        content,
        status
      };

      let res: { post: StoryPost };
      if (editingPost) {
        res = await apiFetch<{ post: StoryPost }>(`/api/posts/${editingPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch<{ post: StoryPost }>('/api/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      onStorySaved(res.post);
      if (status === 'draft') {
        onNotifyToast('Draft saved to your Creator Studio.');
        onNavigate(ViewRoute.DASHBOARD);
      } else {
        onNotifyToast('Story published to INKWAVE!');
        onNavigate(ViewRoute.STORY, { postId: res.post.id });
      }
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not save story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Studio Top Bar: Live Word Counter, Approx Read Time, Save Draft, Preview, Publish */}
      <div className="sticky top-16 z-30 py-3.5 px-4 rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-[#FBF9F5]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-[#0B132B] dark:text-white">
            {editingPost ? 'Editing Story' : 'Writing Studio'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{wordCount} words</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[#2563EB] dark:text-blue-400 font-medium">
            Approx. {readingTime} min read
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              previewMode
                ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400'
                : 'border-slate-900/15 dark:border-slate-100/15 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Back to Editor' : 'Preview'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-900/15 dark:border-slate-100/15 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B132B] dark:bg-[#2563EB] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{editingPost ? 'Update & Publish' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {previewMode ? (
        /* Distraction-Free Editorial Preview */
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/80 p-6 sm:p-12 space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#EA580C]">
            Editorial Preview · Approx. {readingTime} min read
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0B132B] dark:text-white leading-tight">
            {title || 'Untitled Essay'}
          </h1>
          {subtitle && (
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{subtitle}</p>
          )}
          <div className="rounded-xl overflow-hidden aspect-[16/9] bg-slate-900">
            <ResilientImage
              src={coverImage}
              alt={title || 'Cover preview'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-base sm:text-[17px] leading-[1.8] text-slate-800 dark:text-slate-200 pt-4">
            {content}
          </div>
        </div>
      ) : (
        /* Distraction-Free Manuscript Editor */
        <div className="space-y-8">
          {/* Cover Artwork Picker */}
          <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/70 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cover Artwork
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Or paste custom cover image URL..."
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 w-full sm:w-72"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ARTWORK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                    coverImage === preset.url
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-16 object-cover"
                  />
                  <div className="px-2.5 py-1.5 bg-[#0B132B] text-white text-[11px] font-medium truncate">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Subtitle Inputs */}
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your essay title..."
              className="w-full font-serif text-3xl sm:text-5xl font-semibold bg-transparent text-[#0B132B] dark:text-white placeholder:text-slate-400/70 focus:outline-none"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add a thoughtful subtitle or deck..."
              className="w-full text-lg sm:text-xl bg-transparent text-slate-600 dark:text-slate-300 placeholder:text-slate-400/70 focus:outline-none"
            />
          </div>

          {/* Rich Text Formatting Toolbar + Editor Canvas */}
          <div className="rounded-2xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-[#0F172A] overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-900/10 dark:border-slate-100/10 bg-slate-900/[0.02] dark:bg-slate-100/[0.02] flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormat('**', '**', 'bold text')}
                title="Bold"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('*', '*', 'italicized phrase')}
                title="Italic"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('\n## ', '\n', 'Section Heading')}
                title="Heading"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('\n> "', '"\n', 'Memorable pull quote from your essay')}
                title="Pull Quote"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('\n- ', '\n', 'Key observation')}
                title="Bullet List"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('[', '](https://inkwave.io)', 'reference link')}
                title="Insert Link"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormat('\n```typescript\n', '\n```\n', '// Write code example here')
                }
                title="Code Block"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormat(
                    '\n![Editorial figure caption](',
                    ')\n',
                    '/api/artwork/architecture'
                  )
                }
                title="Insert Image"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-100/10"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin your story..."
              className="w-full p-6 sm:p-8 bg-transparent text-base sm:text-[17px] text-[#0B132B] dark:text-slate-100 leading-[1.8] focus:outline-none resize-y"
            />
          </div>

          {/* Category, Tags, and Thought Starter Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/70 p-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} — {cat.description.slice(0, 42)}...
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2.5 pt-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thoughtStarter}
                  onChange={(e) => setThoughtStarter(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB]"
                />
                <span>Feature in “Thought Starters” discussion index</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Topic Tags (up to 6)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add a tag and press Enter..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm text-[#0B132B] dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-slate-900/10 dark:bg-slate-100/10 text-xs font-semibold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/5 dark:bg-slate-100/5"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((item) => item !== t))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
