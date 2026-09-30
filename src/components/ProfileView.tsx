import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Edit2,
  Flame,
  UserPlus,
  UserCheck,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { StoryPost, UserProfile, ViewRoute } from '../types';
import { apiFetch } from '../api';
import { StoryCard, ResilientImage } from './StoryCard';

interface ProfileViewProps {
  username: string;
  currentUser: UserProfile | null;
  onNavigate: (route: ViewRoute, params?: { postId?: string; username?: string }) => void;
  onUserUpdated: (user: UserProfile) => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onShare: (post: StoryPost) => void;
  onNotifyToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  currentUser,
  onNavigate,
  onUserUpdated,
  onToggleLike,
  onToggleBookmark,
  onShare,
  onNotifyToast
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [replies, setReplies] = useState<
    Array<{ id: string; postId: string; postTitle: string; content: string; createdAt: string }>
  >([]);
  const [saved, setSaved] = useState<StoryPost[]>([]);
  const [activeTab, setActiveTab] = useState<'stories' | 'replies' | 'saved' | 'about'>('stories');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit profile form states
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<{
      profile: UserProfile;
      stories: StoryPost[];
      replies: Array<{ id: string; postId: string; postTitle: string; content: string; createdAt: string }>;
      saved: StoryPost[];
    }>(`/api/users/${encodeURIComponent(username)}`)
      .then((res) => {
        if (!mounted) return;
        setProfile(res.profile);
        setStories(res.stories);
        setReplies(res.replies);
        setSaved(res.saved);
        setEditName(res.profile.name);
        setEditUsername(res.profile.username);
        setEditBio(res.profile.bio);
        setEditAvatar(res.profile.avatar);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      onNotifyToast('Please sign in to follow authors.');
      onNavigate(ViewRoute.AUTH);
      return;
    }
    if (!profile) return;
    try {
      const method = profile.isFollowing ? 'DELETE' : 'POST';
      const res = await apiFetch<{ isFollowing: boolean; profile: UserProfile }>(
        `/api/users/${profile.id}/follow`,
        { method }
      );
      setProfile({ ...res.profile, isFollowing: res.isFollowing });
      onNotifyToast(
        res.isFollowing ? `Now following ${profile.name}.` : `Unfollowed ${profile.name}.`
      );
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update follow status.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ user: UserProfile }>(`/api/users/${profile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          bio: editBio,
          avatar: editAvatar
        })
      });
      setProfile({ ...res.user, isFollowing: profile.isFollowing });
      onUserUpdated(res.user);
      setEditing(false);
      onNotifyToast('Profile updated.');
    } catch (err: any) {
      onNotifyToast(err.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-[#0B132B] dark:text-white">
          Profile not found.
        </h2>
        <button
          type="button"
          onClick={() => onNavigate(ViewRoute.HOME)}
          className="px-5 py-2.5 rounded-xl bg-[#0B132B] text-white text-xs font-semibold"
        >
          Back Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Visually Unique Editorial Profile Header */}
      <section className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/80 dark:bg-[#0F172A]/90 overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#0B132B] via-[#1E293B] to-[#2563EB] relative">
          <svg
            viewBox="0 0 1200 160"
            className="w-full h-full opacity-35"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0 110 C 320 20, 680 150, 1200 50"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <path
              d="M 0 135 C 400 50, 750 160, 1200 85"
              stroke="#EA580C"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="px-6 sm:px-10 pb-8 -mt-12 relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-[#FBF9F5] dark:border-[#0F172A] bg-slate-900 shadow-md shrink-0">
                <ResilientImage
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B132B] dark:text-white">
                    {profile.name}
                  </h1>
                  {profile.featuredWriter && (
                    <span className="text-xs font-medium text-[#EA580C]">· Featured Writer</span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-900/15 dark:border-slate-100/15 text-xs font-semibold text-[#0B132B] dark:text-white hover:bg-slate-900/5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{editing ? 'Close Editor' : 'Edit Profile'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    profile.isFollowing
                      ? 'border border-slate-900/20 dark:border-slate-100/20 text-[#0B132B] dark:text-white'
                      : 'bg-[#0B132B] dark:bg-[#2563EB] text-white'
                  }`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Edit Profile Drawer */}
          {editing && isOwnProfile && (
            <form
              onSubmit={handleSaveProfile}
              className="p-5 rounded-xl border border-slate-900/10 dark:border-slate-100/10 bg-slate-900/[0.02] dark:bg-slate-100/[0.02] space-y-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                Edit Author Identity
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="/api/avatar/Your-Name.svg"
                    className="w-full px-3 py-2 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Editorial Bio</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-900/15 dark:border-slate-100/15 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
            {profile.bio}
          </p>

          {/* Unboxed Profile Metrics Row */}
          <div className="pt-4 border-t border-slate-900/10 dark:border-slate-100/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <strong className="font-mono tabular-nums text-sm text-[#0B132B] dark:text-white">
                {profile.postsCount}
              </strong>{' '}
              Stories
            </div>
            <div>
              <strong className="font-mono tabular-nums text-sm text-[#0B132B] dark:text-white">
                {profile.followersCount}
              </strong>{' '}
              Followers
            </div>
            <div>
              <strong className="font-mono tabular-nums text-sm text-[#0B132B] dark:text-white">
                {profile.followingCount}
              </strong>{' '}
              Following
            </div>
            <div>
              <strong className="font-mono tabular-nums text-sm text-[#0B132B] dark:text-white">
                {profile.totalLikes}
              </strong>{' '}
              Total Likes & Reactions
            </div>
            <div className="inline-flex items-center gap-1 text-[#EA580C] font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{profile.readingStreak}-day reading streak</span>
            </div>
            <div className="inline-flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Joined{' '}
                {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Navigation Tabs: Stories | Replies | Saved | About */}
      <div className="border-b border-slate-900/10 dark:border-slate-100/10 flex items-center gap-6">
        {(
          [
            { id: 'stories', label: `Stories (${stories.length})` },
            { id: 'replies', label: `Replies (${replies.length})` },
            { id: 'saved', label: `Saved (${saved.length})` },
            { id: 'about', label: 'About' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#2563EB] text-[#0B132B] dark:text-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.length > 0 ? (
            stories.map((st) => (
              <StoryCard
                key={st.id}
                post={st}
                onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                onOpenProfile={(u) => onNavigate(ViewRoute.PROFILE, { username: u })}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onShare={onShare}
              />
            ))
          ) : (
            <div className="col-span-2 py-12 text-center text-sm text-slate-500">
              No stories published yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'replies' && (
        <div className="space-y-4">
          {replies.length > 0 ? (
            replies.map((rep) => (
              <div
                key={rep.id}
                onClick={() => onNavigate(ViewRoute.STORY, { postId: rep.postId })}
                className="p-5 rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/70 cursor-pointer hover:border-[#2563EB]/40 transition-colors space-y-2"
              >
                <div className="text-xs text-slate-500">
                  Response on <strong className="text-[#0B132B] dark:text-white">{rep.postTitle}</strong> ·{' '}
                  {new Date(rep.createdAt).toLocaleDateString()}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  “{rep.content}”
                </p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              No threaded responses posted yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {saved.length > 0 ? (
            saved.map((st) => (
              <StoryCard
                key={st.id}
                post={st}
                onOpenStory={(id) => onNavigate(ViewRoute.STORY, { postId: id })}
                onOpenProfile={(u) => onNavigate(ViewRoute.PROFILE, { username: u })}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onShare={onShare}
              />
            ))
          ) : (
            <div className="col-span-2 py-12 text-center text-sm text-slate-500">
              No saved stories yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="rounded-2xl border border-slate-900/10 dark:border-slate-100/10 bg-white/70 dark:bg-[#0F172A]/70 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-semibold text-[#0B132B] dark:text-white">
              About {profile.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {profile.bio}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-900/10 dark:border-slate-100/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="text-slate-400 uppercase tracking-wider font-semibold">
                Editorial Distinctions
              </div>
              <div className="mt-2 text-slate-700 dark:text-slate-200 font-medium">
                {profile.badges.join(' · ') || 'INKWAVE Contributor'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase tracking-wider font-semibold">
                Member Since
              </div>
              <div className="mt-2 text-slate-700 dark:text-slate-200 font-medium">
                {new Date(profile.joinedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div className="text-slate-400 uppercase tracking-wider font-semibold">
                Reading Habit
              </div>
              <div className="mt-2 text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                {profile.readingStreak} consecutive days active
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
