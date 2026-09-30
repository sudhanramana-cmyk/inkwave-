export enum ViewRoute {
  HOME = 'home',
  DISCOVER = 'discover',
  WAVE = 'wave',
  WRITE = 'write',
  STORY = 'story',
  SHELF = 'shelf',
  PROFILE = 'profile',
  DASHBOARD = 'dashboard',
  NOTIFICATIONS = 'notifications',
  ADMIN = 'admin',
  AUTH = 'auth',
  GUIDELINES = 'guidelines'
}

export type ReactionType = 'loved' | 'insightful' | 'interesting' | 'thinking';
export type ShelfType = 'recent' | 'later' | 'favorites';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  role: 'user' | 'admin';
  suspended: boolean;
  featuredWriter: boolean;
  badges: string[];
  readingStreak: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  totalLikes: number;
  isFollowing?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  count?: number;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface StoryPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  coverImage: string;
  content: string;
  excerpt: string;
  categoryId: string;
  authorId: string;
  status: 'published' | 'draft' | 'archived';
  readingTime: number;
  wordCount: number;
  views: number;
  featured: boolean;
  thoughtStarter: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  author: UserProfile | null;
  category: CategoryItem;
  tags: TagItem[];
  likesCount: number;
  reactionsCount: number;
  reactionCounts: Record<ReactionType, number>;
  commentsCount: number;
  bookmarksCount: number;
  likedByMe: boolean;
  myReaction: ReactionType | null;
  myBookmarkShelf: ShelfType | null;
  isFollowingAuthor: boolean;
  trendingScore: number;
  freshness: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: UserProfile | null;
  likesCount: number;
  likedByMe: boolean;
  replies?: CommentItem[];
  postTitle?: string;
}

export interface BookmarkEntry {
  bookmarkId: string;
  shelf: ShelfType;
  savedAt: string;
  post: StoryPost;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string | null;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'milestone';
  postId: string | null;
  commentId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  actor: UserProfile | null;
}

export interface DashboardData {
  stats: {
    publishedCount: number;
    draftsCount: number;
    archivedCount: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    followersCount: number;
  };
  analytics: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
  }>;
  stories: StoryPost[];
}
