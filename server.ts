import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  db,
  hashPassword,
  verifyPassword,
  calculateReadingStats,
  createId,
  slugify,
  UserRecord,
  ReactionType,
  ShelfType
} from './src/server/db';
import { generateCoverSvg, generateAvatarSvg } from './src/server/artwork';

interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function sanitizeText(input: unknown, maxLen = 20000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
    .slice(0, maxLen);
}

function getUserFromRequest(req: Request): UserRecord | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  const token = authHeader.slice(7).trim();
  if (!token) return undefined;

  const session = db.data.sessions.find((s) => s.token === token);
  if (!session) return undefined;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.data.sessions = db.data.sessions.filter((s) => s.token !== token);
    db.persist();
    return undefined;
  }

  const user = db.data.users.find((u) => u.id === session.userId);
  if (!user || user.suspended) return undefined;
  return user;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Moderator privileges required.' });
  }
  req.user = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // ==========================================
  // SVG ARTWORK & AVATAR ENDPOINTS
  // ==========================================
  app.get('/api/artwork/:theme', (req, res) => {
    const theme = (req.params.theme || 'silence').replace(/\.svg$/, '');
    const svg = generateCoverSvg(theme);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  });

  app.get('/api/avatar/:seed', (req, res) => {
    const seed = (req.params.seed || 'INKWAVE').replace(/\.svg$/, '');
    const svg = generateAvatarSvg(seed);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  });

  // ==========================================
  // AUTHENTICATION APIs
  // ==========================================
  app.post('/api/auth/register', (req, res) => {
    const name = sanitizeText(req.body.name, 80);
    const username = sanitizeText(req.body.username, 40).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const email = sanitizeText(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const avatar = sanitizeText(req.body.avatar, 500) || `/api/avatar/${encodeURIComponent(name || username)}.svg`;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Please provide your full name (at least 2 characters).' });
    }
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (db.data.users.some((u) => u.username.toLowerCase() === username)) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    if (db.data.users.some((u) => u.email.toLowerCase() === email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser: UserRecord = {
      id: createId('usr'),
      name,
      username,
      email,
      passwordHash: hashPassword(password),
      avatar,
      bio: 'Writer & reader on INKWAVE. Exploring ideas worth staying for.',
      joinedAt: new Date().toISOString(),
      role: 'user',
      suspended: false,
      featuredWriter: false,
      badges: ['Early Member'],
      readingStreak: 1,
      resetToken: null
    };

    db.data.users.push(newUser);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.data.sessions.push({ token, userId: newUser.id, expiresAt });

    db.data.notifications.unshift({
      id: createId('ntf'),
      userId: newUser.id,
      actorId: 'usr_elena',
      type: 'milestone',
      postId: 'post_silence',
      commentId: null,
      message: 'Welcome to INKWAVE! Start your wave by reading featured stories or publishing your first draft.',
      read: false,
      createdAt: new Date().toISOString()
    });

    db.persist();
    return res.status(201).json({
      token,
      user: db.sanitizeUser(newUser)
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const identifier = sanitizeText(req.body.identifier || req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body.rememberMe);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both your email/username and password.' });
    }

    const user = db.data.users.find(
      (u) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your username/email and password.' });
    }

    if (user.suspended) {
      return res.status(403).json({ error: 'This account has been suspended by platform moderation.' });
    }

    const durationDays = rememberMe ? 30 : 7;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    db.data.sessions.push({ token, userId: user.id, expiresAt });
    db.persist();

    return res.json({
      token,
      user: db.sanitizeUser(user)
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      db.data.sessions = db.data.sessions.filter((s) => s.token !== token);
      db.persist();
    }
    return res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: db.sanitizeUser(user) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const email = sanitizeText(req.body.email, 120).toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Please enter your registered email address.' });
    }
    const user = db.data.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }
    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    user.resetToken = resetCode;
    db.persist();

    return res.json({
      message: 'Password reset token generated. Use this verification code to set a new password.',
      resetToken: resetCode,
      email: user.email
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const email = sanitizeText(req.body.email, 120).toLowerCase();
    const token = sanitizeText(req.body.token, 32).toUpperCase();
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (!email || !token || newPassword.length < 6) {
      return res.status(400).json({ error: 'Provide email, valid reset token, and a new password (min 6 chars).' });
    }

    const user = db.data.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !user.resetToken || user.resetToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.resetToken = null;
    db.persist();

    return res.json({ message: 'Your password has been updated. You can now sign in.' });
  });

  // ==========================================
  // CATEGORIES & METADATA APIs
  // ==========================================
  app.get('/api/categories', (_req, res) => {
    const categoriesWithCount = db.data.categories.map((cat) => ({
      ...cat,
      count: db.data.posts.filter((p) => p.categoryId === cat.id && p.status === 'published').length
    }));
    const popularTags = db.data.tags.map((tag) => ({
      ...tag,
      count: db.data.post_tags.filter((pt) => pt.tagId === tag.id).length
    })).sort((a, b) => b.count - a.count);

    return res.json({ categories: categoriesWithCount, tags: popularTags });
  });

  // ==========================================
  // POSTS / STORIES APIs
  // ==========================================
  app.get('/api/posts', (req, res) => {
    const currentUser = getUserFromRequest(req);
    const categorySlug = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : '';
    const tagSlug = typeof req.query.tag === 'string' ? req.query.tag.toLowerCase() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';
    const section = typeof req.query.section === 'string' ? req.query.section : '';
    const feed = typeof req.query.feed === 'string' ? req.query.feed : '';
    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : '';

    let posts = db.data.posts.filter((p) => p.status === 'published');

    if (authorId) {
      posts = posts.filter((p) => p.authorId === authorId);
    }

    if (categorySlug && categorySlug !== 'all') {
      const cat = db.data.categories.find(
        (c) => c.slug.toLowerCase() === categorySlug || c.name.toLowerCase() === categorySlug
      );
      if (cat) {
        posts = posts.filter((p) => p.categoryId === cat.id);
      }
    }

    if (tagSlug) {
      const tag = db.data.tags.find((t) => t.slug.toLowerCase() === tagSlug || t.name.toLowerCase() === tagSlug);
      if (tag) {
        const postIds = new Set(db.data.post_tags.filter((pt) => pt.tagId === tag.id).map((pt) => pt.postId));
        posts = posts.filter((p) => postIds.has(p.id));
      }
    }

    if (search) {
      posts = posts.filter((p) => {
        const author = db.data.users.find((u) => u.id === p.authorId);
        const category = db.data.categories.find((c) => c.id === p.categoryId);
        const tagIds = db.data.post_tags.filter((pt) => pt.postId === p.id).map((pt) => pt.tagId);
        const postTags = db.data.tags.filter((t) => tagIds.includes(t.id));

        return (
          p.title.toLowerCase().includes(search) ||
          p.subtitle.toLowerCase().includes(search) ||
          p.content.toLowerCase().includes(search) ||
          (author && (author.name.toLowerCase().includes(search) || author.username.toLowerCase().includes(search))) ||
          (category && category.name.toLowerCase().includes(search)) ||
          postTags.some((t) => t.name.toLowerCase().includes(search))
        );
      });
    }

    let enriched = posts.map((p) => db.enrichPost(p, currentUser?.id));

    if (feed === 'following' && currentUser) {
      const followedIds = new Set(
        db.data.followers.filter((f) => f.followerId === currentUser.id).map((f) => f.followingId)
      );
      enriched.sort((a, b) => {
        const aFollowed = followedIds.has(a.authorId) ? 1 : 0;
        const bFollowed = followedIds.has(b.authorId) ? 1 : 0;
        if (aFollowed !== bFollowed) return bFollowed - aFollowed;
        return b.trendingScore - a.trendingScore;
      });
    } else if (section === 'trending') {
      enriched.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (section === 'fresh') {
      enriched.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
      );
    } else if (section === 'thought_starters') {
      enriched = enriched.filter((p) => p.thoughtStarter || p.commentsCount >= 1);
      enriched.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (section === 'deep') {
      enriched = enriched.filter((p) => p.readingTime >= 5);
      enriched.sort((a, b) => b.readingTime - a.readingTime);
    } else if (section === 'quick') {
      enriched = enriched.filter((p) => p.readingTime <= 4);
      enriched.sort((a, b) => a.readingTime - b.readingTime);
    } else {
      enriched.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    return res.json({ posts: enriched });
  });

  app.get('/api/posts/:id', (req, res) => {
    const currentUser = getUserFromRequest(req);
    const post = db.data.posts.find((p) => p.id === req.params.id || p.slug === req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Couldn't load this story. It may have been moved or deleted." });
    }

    if (post.status !== 'published' && (!currentUser || (currentUser.id !== post.authorId && currentUser.role !== 'admin'))) {
      return res.status(403).json({ error: 'This story is currently a private draft.' });
    }

    // Increment view count if published
    if (post.status === 'published') {
      post.views += 1;
      if (post.views === 100 || post.views === 500 || post.views === 1000 || post.views === 2500 || post.views === 3000) {
        db.data.notifications.unshift({
          id: createId('ntf'),
          userId: post.authorId,
          actorId: null,
          type: 'milestone',
          postId: post.id,
          commentId: null,
          message: `Your story "${post.title}" reached ${post.views.toLocaleString()} views.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      db.persist();
    }

    const enriched = db.enrichPost(post, currentUser?.id);

    // Related stories ("Continue Reading" & "Because you read...")
    const related = db.data.posts
      .filter((p) => p.id !== post.id && p.status === 'published')
      .map((p) => {
        const sameCat = p.categoryId === post.categoryId ? 2 : 0;
        const sameAuthor = p.authorId === post.authorId ? 1 : 0;
        return { post: p, score: sameCat + sameAuthor };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => db.enrichPost(item.post, currentUser?.id));

    return res.json({ post: enriched, related });
  });

  app.post('/api/posts', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const title = sanitizeText(req.body.title, 180);
    const subtitle = sanitizeText(req.body.subtitle, 300);
    const content = sanitizeText(req.body.content, 60000);
    const coverImage = sanitizeText(req.body.coverImage, 500) || '/api/artwork/silence';
    const categoryId = sanitizeText(req.body.categoryId, 60) || 'cat_culture';
    const status = req.body.status === 'draft' ? 'draft' : 'published';
    const thoughtStarter = Boolean(req.body.thoughtStarter);
    const rawTags: string[] = Array.isArray(req.body.tags) ? req.body.tags : [];

    if (!title || title.length < 3) {
      return res.status(400).json({ error: 'Please provide a story title (at least 3 characters).' });
    }
    if (!content || content.length < 15) {
      return res.status(400).json({ error: 'Please write some story content before saving.' });
    }

    const { wordCount, readingTime, excerpt } = calculateReadingStats(content);
    const now = new Date().toISOString();

    const newPost = {
      id: createId('post'),
      title,
      subtitle,
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
      coverImage,
      content,
      excerpt,
      categoryId,
      authorId: user.id,
      status: status as 'published' | 'draft',
      readingTime,
      wordCount,
      views: status === 'published' ? 1 : 0,
      featured: false,
      thoughtStarter,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null
    };

    db.data.posts.unshift(newPost);

    // Process tags
    rawTags.slice(0, 6).forEach((tagName) => {
      const cleanName = sanitizeText(tagName, 35);
      if (!cleanName) return;
      const slug = slugify(cleanName);
      let tag = db.data.tags.find((t) => t.slug === slug);
      if (!tag) {
        tag = { id: createId('tag'), name: cleanName, slug };
        db.data.tags.push(tag);
      }
      db.data.post_tags.push({ postId: newPost.id, tagId: tag.id });
    });

    db.persist();
    return res.status(201).json({ post: db.enrichPost(newPost, user.id) });
  });

  app.put('/api/posts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    if (post.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit another author’s story.' });
    }

    if (typeof req.body.title === 'string') {
      const title = sanitizeText(req.body.title, 180);
      if (title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters.' });
      post.title = title;
    }
    if (typeof req.body.subtitle === 'string') {
      post.subtitle = sanitizeText(req.body.subtitle, 300);
    }
    if (typeof req.body.content === 'string') {
      const content = sanitizeText(req.body.content, 60000);
      if (content.length < 15) return res.status(400).json({ error: 'Story content is too short.' });
      post.content = content;
      const stats = calculateReadingStats(content);
      post.wordCount = stats.wordCount;
      post.readingTime = stats.readingTime;
      post.excerpt = stats.excerpt;
    }
    if (typeof req.body.coverImage === 'string' && req.body.coverImage.trim()) {
      post.coverImage = sanitizeText(req.body.coverImage, 500);
    }
    if (typeof req.body.categoryId === 'string' && req.body.categoryId.trim()) {
      post.categoryId = sanitizeText(req.body.categoryId, 60);
    }
    if (req.body.status && ['published', 'draft', 'archived'].includes(req.body.status)) {
      const prevStatus = post.status;
      post.status = req.body.status;
      if (prevStatus !== 'published' && post.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date().toISOString();
      }
    }
    if (typeof req.body.thoughtStarter === 'boolean') {
      post.thoughtStarter = req.body.thoughtStarter;
    }

    if (Array.isArray(req.body.tags)) {
      db.data.post_tags = db.data.post_tags.filter((pt) => pt.postId !== post.id);
      req.body.tags.slice(0, 6).forEach((tagName: unknown) => {
        const cleanName = sanitizeText(tagName, 35);
        if (!cleanName) return;
        const slug = slugify(cleanName);
        let tag = db.data.tags.find((t) => t.slug === slug);
        if (!tag) {
          tag = { id: createId('tag'), name: cleanName, slug };
          db.data.tags.push(tag);
        }
        db.data.post_tags.push({ postId: post.id, tagId: tag.id });
      });
    }

    post.updatedAt = new Date().toISOString();
    db.persist();

    return res.json({ post: db.enrichPost(post, user.id) });
  });

  app.delete('/api/posts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const postIndex = db.data.posts.findIndex((p) => p.id === req.params.id);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    const post = db.data.posts[postIndex];
    if (post.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot delete another user’s story.' });
    }

    db.data.posts.splice(postIndex, 1);
    db.data.post_tags = db.data.post_tags.filter((pt) => pt.postId !== post.id);
    db.data.comments = db.data.comments.filter((c) => c.postId !== post.id);
    db.data.likes = db.data.likes.filter((l) => l.postId !== post.id);
    db.data.reactions = db.data.reactions.filter((r) => r.postId !== post.id);
    db.data.bookmarks = db.data.bookmarks.filter((b) => b.postId !== post.id);
    db.persist();

    return res.json({ success: true });
  });

  // Toggle Heart Like on Post
  app.post('/api/posts/:id/like', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    const existingIndex = db.data.likes.findIndex((l) => l.postId === post.id && l.userId === user.id);
    let liked = false;
    if (existingIndex >= 0) {
      db.data.likes.splice(existingIndex, 1);
    } else {
      liked = true;
      db.data.likes.push({
        id: createId('lk'),
        postId: post.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      });

      if (post.authorId !== user.id) {
        db.data.notifications.unshift({
          id: createId('ntf'),
          userId: post.authorId,
          actorId: user.id,
          type: 'like',
          postId: post.id,
          commentId: null,
          message: `${user.name} liked your story "${post.title}".`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    db.persist();
    return res.json({ liked, post: db.enrichPost(post, user.id) });
  });

  // ==========================================
  // REACTIONS APIs
  // ==========================================
  app.post('/api/posts/:id/reaction', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    const type = req.body.type as ReactionType;
    if (!['loved', 'insightful', 'interesting', 'thinking'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type.' });
    }

    const existing = db.data.reactions.find((r) => r.postId === post.id && r.userId === user.id);
    if (existing) {
      existing.type = type;
      existing.createdAt = new Date().toISOString();
    } else {
      db.data.reactions.push({
        id: createId('rx'),
        postId: post.id,
        userId: user.id,
        type,
        createdAt: new Date().toISOString()
      });

      if (post.authorId !== user.id) {
        const labels: Record<ReactionType, string> = {
          loved: 'Loved it',
          insightful: 'Insightful',
          interesting: 'Interesting',
          thinking: 'Made me think'
        };
        db.data.notifications.unshift({
          id: createId('ntf'),
          userId: post.authorId,
          actorId: user.id,
          type: 'like',
          postId: post.id,
          commentId: null,
          message: `${user.name} reacted "${labels[type]}" to "${post.title}".`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    db.persist();
    return res.json({ post: db.enrichPost(post, user.id) });
  });

  app.delete('/api/posts/:id/reaction', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    db.data.reactions = db.data.reactions.filter((r) => !(r.postId === post.id && r.userId === user.id));
    db.persist();
    return res.json({ post: db.enrichPost(post, user.id) });
  });

  // ==========================================
  // BOOKMARKS / READING SHELF APIs
  // ==========================================
  app.get('/api/bookmarks', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const userBookmarks = db.data.bookmarks
      .filter((b) => b.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = userBookmarks
      .map((b) => {
        const post = db.data.posts.find((p) => p.id === b.postId);
        if (!post) return null;
        return {
          bookmarkId: b.id,
          shelf: b.shelf,
          savedAt: b.createdAt,
          post: db.enrichPost(post, user.id)
        };
      })
      .filter(Boolean);

    return res.json({ bookmarks: items });
  });

  app.post('/api/posts/:id/bookmark', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    const shelf: ShelfType = ['recent', 'later', 'favorites'].includes(req.body.shelf)
      ? req.body.shelf
      : 'recent';

    const existing = db.data.bookmarks.find((b) => b.postId === post.id && b.userId === user.id);
    if (existing) {
      existing.shelf = shelf;
      existing.createdAt = new Date().toISOString();
    } else {
      db.data.bookmarks.push({
        id: createId('bm'),
        postId: post.id,
        userId: user.id,
        shelf,
        createdAt: new Date().toISOString()
      });
    }

    db.persist();
    return res.json({ post: db.enrichPost(post, user.id) });
  });

  app.delete('/api/posts/:id/bookmark', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    db.data.bookmarks = db.data.bookmarks.filter((b) => !(b.postId === post.id && b.userId === user.id));
    db.persist();
    return res.json({ post: db.enrichPost(post, user.id) });
  });

  // ==========================================
  // COMMENTS & THREADED DISCUSSIONS APIs
  // ==========================================
  app.get('/api/posts/:id/comments', (req, res) => {
    const currentUser = getUserFromRequest(req);
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'most_liked';
    const postComments = db.data.comments.filter((c) => c.postId === req.params.id);

    const participantIds = new Set(postComments.map((c) => c.authorId));

    const enrichComment = (c: (typeof postComments)[0]) => {
      const author = db.data.users.find((u) => u.id === c.authorId);
      const likes = db.data.comment_likes.filter((cl) => cl.commentId === c.id);
      const likedByMe = currentUser ? likes.some((cl) => cl.userId === currentUser.id) : false;
      return {
        ...c,
        author: author ? db.sanitizeUser(author) : null,
        likesCount: likes.length,
        likedByMe
      };
    };

    const enrichedAll = postComments.map(enrichComment);
    const topLevel = enrichedAll.filter((c) => !c.parentId);
    const repliesMap = new Map<string, typeof enrichedAll>();

    enrichedAll
      .filter((c) => c.parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((reply) => {
        const list = repliesMap.get(reply.parentId!) || [];
        list.push(reply);
        repliesMap.set(reply.parentId!, list);
      });

    if (sort === 'newest') {
      topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'oldest') {
      topLevel.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      topLevel.sort((a, b) => b.likesCount - a.likesCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const threaded = topLevel.map((parent) => ({
      ...parent,
      replies: repliesMap.get(parent.id) || []
    }));

    return res.json({
      comments: threaded,
      totalCount: postComments.length,
      participantsCount: participantIds.size
    });
  });

  app.post('/api/posts/:id/comments', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const post = db.data.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Story not found.' });

    const content = sanitizeText(req.body.content, 4000);
    const parentId = typeof req.body.parentId === 'string' && req.body.parentId ? req.body.parentId : null;

    if (!content || content.length < 2) {
      return res.status(400).json({ error: 'Please write a response before posting.' });
    }

    const now = new Date().toISOString();
    const newComment = {
      id: createId('cmt'),
      postId: post.id,
      authorId: user.id,
      parentId,
      content,
      createdAt: now,
      updatedAt: now
    };

    db.data.comments.push(newComment);

    if (parentId) {
      const parentComment = db.data.comments.find((c) => c.id === parentId);
      if (parentComment && parentComment.authorId !== user.id) {
        db.data.notifications.unshift({
          id: createId('ntf'),
          userId: parentComment.authorId,
          actorId: user.id,
          type: 'reply',
          postId: post.id,
          commentId: newComment.id,
          message: `${user.name} replied to your comment on "${post.title}".`,
          read: false,
          createdAt: now
        });
      }
    } else if (post.authorId !== user.id) {
      db.data.notifications.unshift({
        id: createId('ntf'),
        userId: post.authorId,
        actorId: user.id,
        type: 'comment',
        postId: post.id,
        commentId: newComment.id,
        message: `${user.name} joined the discussion on "${post.title}".`,
        read: false,
        createdAt: now
      });
    }

    db.persist();
    return res.status(201).json({
      comment: {
        ...newComment,
        author: db.sanitizeUser(user),
        likesCount: 0,
        likedByMe: false,
        replies: []
      }
    });
  });

  app.put('/api/comments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const comment = db.data.comments.find((c) => c.id === req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (comment.authorId !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments.' });
    }

    const content = sanitizeText(req.body.content, 4000);
    if (!content) return res.status(400).json({ error: 'Comment content cannot be empty.' });

    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    db.persist();

    return res.json({ comment });
  });

  app.delete('/api/comments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const comment = db.data.comments.find((c) => c.id === req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (comment.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot delete another user’s comment.' });
    }

    db.data.comments = db.data.comments.filter((c) => c.id !== comment.id && c.parentId !== comment.id);
    db.data.comment_likes = db.data.comment_likes.filter((cl) => cl.commentId !== comment.id);
    db.persist();

    return res.json({ success: true });
  });

  app.post('/api/comments/:id/like', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const comment = db.data.comments.find((c) => c.id === req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const existingIdx = db.data.comment_likes.findIndex(
      (cl) => cl.commentId === comment.id && cl.userId === user.id
    );
    if (existingIdx >= 0) {
      db.data.comment_likes.splice(existingIdx, 1);
    } else {
      db.data.comment_likes.push({
        id: createId('cl'),
        commentId: comment.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
    }
    db.persist();
    const likesCount = db.data.comment_likes.filter((cl) => cl.commentId === comment.id).length;
    return res.json({ likesCount, likedByMe: existingIdx === -1 });
  });

  // ==========================================
  // USERS & SOCIAL APIs
  // ==========================================
  app.get('/api/users/:username', (req, res) => {
    const currentUser = getUserFromRequest(req);
    const param = req.params.username.toLowerCase();
    const user = db.data.users.find(
      (u) => u.username.toLowerCase() === param || u.id.toLowerCase() === param
    );

    if (!user) {
      return res.status(404).json({ error: 'Author profile not found.' });
    }

    const isFollowing = currentUser
      ? db.data.followers.some((f) => f.followerId === currentUser.id && f.followingId === user.id)
      : false;

    const stories = db.data.posts
      .filter((p) => p.authorId === user.id && p.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .map((p) => db.enrichPost(p, currentUser?.id));

    const userReplies = db.data.comments
      .filter((c) => c.authorId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => {
        const post = db.data.posts.find((p) => p.id === c.postId);
        return {
          ...c,
          postTitle: post?.title || 'Story',
          postId: post?.id || c.postId
        };
      });

    const savedStories = db.data.bookmarks
      .filter((b) => b.userId === user.id)
      .map((b) => {
        const p = db.data.posts.find((post) => post.id === b.postId && post.status === 'published');
        return p ? db.enrichPost(p, currentUser?.id) : null;
      })
      .filter(Boolean);

    return res.json({
      profile: {
        ...db.sanitizeUser(user),
        isFollowing
      },
      stories,
      replies: userReplies,
      saved: savedStories
    });
  });

  app.put('/api/users/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const currentUser = req.user!;
    if (currentUser.id !== req.params.id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own profile.' });
    }

    const targetUser = db.data.users.find((u) => u.id === req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    if (typeof req.body.name === 'string') {
      const name = sanitizeText(req.body.name, 80);
      if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      targetUser.name = name;
    }

    if (typeof req.body.username === 'string') {
      const username = sanitizeText(req.body.username, 40).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      const conflict = db.data.users.some((u) => u.id !== targetUser.id && u.username.toLowerCase() === username);
      if (conflict) return res.status(409).json({ error: 'Username is already taken.' });
      targetUser.username = username;
    }

    if (typeof req.body.bio === 'string') {
      targetUser.bio = sanitizeText(req.body.bio, 400);
    }

    if (typeof req.body.avatar === 'string' && req.body.avatar.trim()) {
      targetUser.avatar = sanitizeText(req.body.avatar, 500);
    }

    db.persist();
    return res.json({ user: db.sanitizeUser(targetUser) });
  });

  app.post('/api/users/:id/follow', requireAuth, (req: AuthenticatedRequest, res) => {
    const currentUser = req.user!;
    const targetUser = db.data.users.find((u) => u.id === req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
    if (targetUser.id === currentUser.id) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const exists = db.data.followers.some(
      (f) => f.followerId === currentUser.id && f.followingId === targetUser.id
    );
    if (!exists) {
      db.data.followers.push({
        id: createId('fl'),
        followerId: currentUser.id,
        followingId: targetUser.id,
        createdAt: new Date().toISOString()
      });

      db.data.notifications.unshift({
        id: createId('ntf'),
        userId: targetUser.id,
        actorId: currentUser.id,
        type: 'follow',
        postId: null,
        commentId: null,
        message: `${currentUser.name} started following your wave.`,
        read: false,
        createdAt: new Date().toISOString()
      });
      db.persist();
    }

    return res.json({
      isFollowing: true,
      profile: db.sanitizeUser(targetUser)
    });
  });

  app.delete('/api/users/:id/follow', requireAuth, (req: AuthenticatedRequest, res) => {
    const currentUser = req.user!;
    const targetUser = db.data.users.find((u) => u.id === req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    db.data.followers = db.data.followers.filter(
      (f) => !(f.followerId === currentUser.id && f.followingId === targetUser.id)
    );
    db.persist();

    return res.json({
      isFollowing: false,
      profile: db.sanitizeUser(targetUser)
    });
  });

  // ==========================================
  // NOTIFICATIONS APIs
  // ==========================================
  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const items = db.data.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => {
        const actor = n.actorId ? db.data.users.find((u) => u.id === n.actorId) : null;
        return {
          ...n,
          actor: actor ? db.sanitizeUser(actor) : null
        };
      });

    return res.json({ notifications: items });
  });

  app.put('/api/notifications/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const notificationId = req.body.id;
    db.data.notifications.forEach((n) => {
      if (n.userId === user.id && (!notificationId || n.id === notificationId)) {
        n.read = true;
      }
    });
    db.persist();
    return res.json({ success: true });
  });

  // ==========================================
  // CREATOR DASHBOARD API
  // ==========================================
  app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const myPosts = db.data.posts
      .filter((p) => p.authorId === user.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const enrichedPosts = myPosts.map((p) => db.enrichPost(p, user.id));
    const publishedCount = myPosts.filter((p) => p.status === 'published').length;
    const draftsCount = myPosts.filter((p) => p.status === 'draft').length;
    const archivedCount = myPosts.filter((p) => p.status === 'archived').length;
    const totalViews = myPosts.reduce((sum, p) => sum + p.views, 0);
    const totalLikes = enrichedPosts.reduce((sum, p) => sum + p.likesCount + p.reactionsCount, 0);
    const totalComments = enrichedPosts.reduce((sum, p) => sum + p.commentsCount, 0);
    const followersCount = db.data.followers.filter((f) => f.followingId === user.id).length;

    const baseViews = Math.max(120, Math.round(totalViews / 7));
    const baseLikes = Math.max(8, Math.round(totalLikes / 7));
    const baseComments = Math.max(3, Math.round(totalComments / 7));

    const days = ['Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28', 'Sep 29', 'Sep 30'];
    const analytics = days.map((day, idx) => {
      const factor = 0.68 + idx * 0.11 + (idx % 2 === 0 ? 0.08 : -0.04);
      return {
        date: day,
        views: Math.round(baseViews * factor),
        likes: Math.round(baseLikes * factor),
        comments: Math.max(1, Math.round(baseComments * factor))
      };
    });

    return res.json({
      stats: {
        publishedCount,
        draftsCount,
        archivedCount,
        totalViews,
        totalLikes,
        totalComments,
        followersCount
      },
      analytics,
      stories: enrichedPosts
    });
  });

  // ==========================================
  // ADMIN / MODERATION APIs
  // ==========================================
  app.get('/api/admin/overview', requireAdmin, (req: AuthenticatedRequest, res) => {
    const users = db.data.users.map((u) => db.sanitizeUser(u));
    const posts = db.data.posts.map((p) => db.enrichPost(p, req.user!.id));
    const comments = db.data.comments.map((c) => {
      const author = db.data.users.find((u) => u.id === c.authorId);
      const post = db.data.posts.find((p) => p.id === c.postId);
      return {
        ...c,
        authorName: author?.name || 'Unknown',
        authorUsername: author?.username || 'unknown',
        postTitle: post?.title || 'Deleted Post'
      };
    });

    return res.json({ users, posts, comments });
  });

  app.put('/api/admin/users/:id/suspend', requireAdmin, (req: AuthenticatedRequest, res) => {
    const target = db.data.users.find((u) => u.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend an administrator account.' });
    }
    target.suspended = !target.suspended;
    db.persist();
    return res.json({ user: db.sanitizeUser(target) });
  });

  app.delete('/api/admin/posts/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const idx = db.data.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found.' });
    const post = db.data.posts[idx];
    db.data.posts.splice(idx, 1);
    db.data.comments = db.data.comments.filter((c) => c.postId !== post.id);
    db.persist();
    return res.json({ success: true });
  });

  app.delete('/api/admin/comments/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const comment = db.data.comments.find((c) => c.id === req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    db.data.comments = db.data.comments.filter((c) => c.id !== comment.id && c.parentId !== comment.id);
    db.persist();
    return res.json({ success: true });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC
  // ==========================================
  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`INKWAVE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start INKWAVE server:', err);
});
