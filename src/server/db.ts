import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  role: 'user' | 'admin';
  suspended: boolean;
  featuredWriter: boolean;
  badges: string[];
  readingStreak: number;
  resetToken: string | null;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface TagRecord {
  id: string;
  name: string;
  slug: string;
}

export interface PostRecord {
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
}

export interface PostTagRecord {
  postId: string;
  tagId: string;
}

export interface CommentRecord {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null; // null = top-level comment, string = reply to comment/reply
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentLikeRecord {
  id: string;
  commentId: string;
  userId: string;
  createdAt: string;
}

export interface LikeRecord {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export type ReactionType = 'loved' | 'insightful' | 'interesting' | 'thinking';

export interface ReactionRecord {
  id: string;
  postId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export type ShelfType = 'recent' | 'later' | 'favorites';

export interface BookmarkRecord {
  id: string;
  postId: string;
  userId: string;
  shelf: ShelfType;
  createdAt: string;
}

export interface FollowerRecord {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  actorId: string | null;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'milestone';
  postId: string | null;
  commentId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
  posts: PostRecord[];
  post_tags: PostTagRecord[];
  comments: CommentRecord[];
  comment_likes: CommentLikeRecord[];
  likes: LikeRecord[];
  reactions: ReactionRecord[];
  bookmarks: BookmarkRecord[];
  followers: FollowerRecord[];
  notifications: NotificationRecord[];
  sessions: SessionRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'inkwave-db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function calculateReadingStats(content: string): { wordCount: number; readingTime: number; excerpt: string } {
  const plainText = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plainText ? plainText.split(' ').filter(Boolean) : [];
  const wordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 210));
  const excerpt = plainText.slice(0, 220) + (plainText.length > 220 ? '…' : '');
  return { wordCount, readingTime, excerpt };
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function createInitialSeedData(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Password123!');

  const users: UserRecord[] = [
    {
      id: 'usr_elena',
      name: 'Elena Vance',
      username: 'elenavance',
      email: 'elena@inkwave.io',
      passwordHash: defaultPasswordHash,
      avatar: '/api/avatar/Elena-Vance.svg',
      bio: 'Essayist & systems thinker exploring digital calm, media ecology, and human-scale software. Founding editor at INKWAVE.',
      joinedAt: '2025-11-14T09:00:00.000Z',
      role: 'admin',
      suspended: false,
      featuredWriter: true,
      badges: ['Founding Editor', 'Featured Writer', 'Top Voice in Culture'],
      readingStreak: 19,
      resetToken: null
    },
    {
      id: 'usr_arjun',
      name: 'Arjun Mehta',
      username: 'arjunmehta',
      email: 'arjun@inkwave.io',
      passwordHash: defaultPasswordHash,
      avatar: '/api/avatar/Arjun-Mehta.svg',
      bio: 'Distributed systems architect and typography enthusiast. Writing about resilient engineering, compilers, and design craft.',
      joinedAt: '2025-12-02T14:30:00.000Z',
      role: 'user',
      suspended: false,
      featuredWriter: true,
      badges: ['Featured Writer', 'Systems Architect'],
      readingStreak: 12,
      resetToken: null
    },
    {
      id: 'usr_sora',
      name: 'Sora Takahashi',
      username: 'soratakahashi',
      email: 'sora@inkwave.io',
      passwordHash: defaultPasswordHash,
      avatar: '/api/avatar/Sora-Takahashi.svg',
      bio: 'Interaction designer in Tokyo researching spatial interfaces, tactile computing, and editorial grids.',
      joinedAt: '2026-01-10T08:15:00.000Z',
      role: 'user',
      suspended: false,
      featuredWriter: true,
      badges: ['Design Fellow', 'Featured Writer'],
      readingStreak: 9,
      resetToken: null
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Thorne',
      username: 'marcusthorne',
      email: 'marcus@inkwave.io',
      passwordHash: defaultPasswordHash,
      avatar: '/api/avatar/Marcus-Thorne.svg',
      bio: 'Computational neuroscientist and slow-science advocate. Investigating memory consolidation and deep attention.',
      joinedAt: '2026-02-04T11:20:00.000Z',
      role: 'user',
      suspended: false,
      featuredWriter: false,
      badges: ['Science Contributor'],
      readingStreak: 7,
      resetToken: null
    },
    {
      id: 'usr_clara',
      name: 'Clara Lin',
      username: 'claralin',
      email: 'clara@inkwave.io',
      passwordHash: defaultPasswordHash,
      avatar: '/api/avatar/Clara-Lin.svg',
      bio: 'Independent publisher, economist, and nocturnal walker. Documenting creative collectives and urban solitude.',
      joinedAt: '2026-03-01T16:45:00.000Z',
      role: 'user',
      suspended: false,
      featuredWriter: false,
      badges: ['Essayist'],
      readingStreak: 14,
      resetToken: null
    }
  ];

  const categories: CategoryRecord[] = [
    { id: 'cat_tech', name: 'Technology', slug: 'technology', description: 'Tools, protocols, and the shifting architecture of the digital world.' },
    { id: 'cat_design', name: 'Design', slug: 'design', description: 'Typography, spatial interfaces, industrial form, and visual systems.' },
    { id: 'cat_life', name: 'Life', slug: 'life', description: 'Habits, intentional living, and navigating modern complexity.' },
    { id: 'cat_college', name: 'College', slug: 'college', description: 'Intellectual discovery, seminars, and lessons from university labs.' },
    { id: 'cat_business', name: 'Business', slug: 'business', description: 'Independent economics, creative studios, and sustainable strategy.' },
    { id: 'cat_science', name: 'Science', slug: 'science', description: 'Neuroscience, physics, ecology, and empirical inquiry.' },
    { id: 'cat_culture', name: 'Culture', slug: 'culture', description: 'Criticism, media theory, literature, and collective memory.' },
    { id: 'cat_programming', name: 'Programming', slug: 'programming', description: 'Software craftsmanship, distributed systems, and language design.' },
    { id: 'cat_personal', name: 'Personal', slug: 'personal', description: 'Field notes, memoir fragments, and quiet reflections.' },
    { id: 'cat_random', name: 'Random', slug: 'random', description: 'Unexpected detours, curiosities, and late-night hypotheses.' }
  ];

  const tags: TagRecord[] = [
    { id: 'tag_1', name: 'Digital Calm', slug: 'digital-calm' },
    { id: 'tag_2', name: 'Media Ecology', slug: 'media-ecology' },
    { id: 'tag_3', name: 'Spatial Computing', slug: 'spatial-computing' },
    { id: 'tag_4', name: 'Typography', slug: 'typography' },
    { id: 'tag_5', name: 'Distributed Systems', slug: 'distributed-systems' },
    { id: 'tag_6', name: 'Architecture', slug: 'architecture' },
    { id: 'tag_7', name: 'Neuroscience', slug: 'neuroscience' },
    { id: 'tag_8', name: 'Deep Work', slug: 'deep-work' },
    { id: 'tag_9', name: 'Compilers', slug: 'compilers' },
    { id: 'tag_10', name: 'Publishing', slug: 'publishing' },
    { id: 'tag_11', name: 'Solitude', slug: 'solitude' },
    { id: 'tag_12', name: 'Craft', slug: 'craft' }
  ];

  const posts: PostRecord[] = [
    {
      id: 'post_silence',
      title: 'The Internet Is Getting Louder. Maybe We Need Better Silence.',
      subtitle: 'When every surface competes for micro-seconds of outrage, designing rooms for unhurried thought becomes a radical act of architecture.',
      slug: 'the-internet-is-getting-louder-maybe-we-need-better-silence',
      coverImage: '/api/artwork/silence',
      content: `During the early decades of networked computing, silence was the default state of the machine. You dialed in, fetched a packet of plain text, and disconnected into the quiet of an physical room to read and annotate what you had found. Today, silence must be actively engineered against an industrial tide of algorithmic urgency.

## The Acoustics of Digital Spaces

Every software environment has an acoustic signature. Some platforms are built like airport terminals—flashing departure boards, relentless announcements, and seating intentionally designed so you never get too comfortable. Others resemble trading floors where velocity is mistaken for truth.

> "Attention is not merely a resource we spend; it is the medium in which our interior life takes shape."

When we design publishing tools around infinite scroll and instant reaction counters, we subtly train writers to compose in shouts and readers to skim in defensive crouch. What happens when we change the room's acoustics?

## Three Principles for Unhurried Publishing

1. **Temporal Friction Over Instant Reflex**: A thoughtful reply benefits from a breath between reading and responding. Threaded conversations work best when structured like correspondence rather than live ticker tape.
2. **Typography as Shelter**: Generous line measure, archival contrast, and clear structural hierarchy lower cognitive heart rate before the second paragraph begins.
3. **Curated Shelf Life**: Ideas that matter six months after publication deserve equal footing with what was posted six minutes ago.

## Reclaiming the Margin

In sixteenth-century broadsheets and scholarly folios, the margin was not empty waste; it was an invitation for dialogue. Readers conversed across generations in those quiet borders. As we rebuild digital salons on INKWAVE, our goal is not to mute conversation, but to tune the room so nuance can actually be heard.`,
      excerpt: 'During the early decades of networked computing, silence was the default state of the machine. Today, silence must be actively engineered against an industrial tide of algorithmic urgency.',
      categoryId: 'cat_culture',
      authorId: 'usr_elena',
      status: 'published',
      readingTime: 6,
      wordCount: 1180,
      views: 2840,
      featured: true,
      thoughtStarter: true,
      createdAt: '2026-09-25T10:00:00.000Z',
      updatedAt: '2026-09-25T10:00:00.000Z',
      publishedAt: '2026-09-25T10:00:00.000Z'
    },
    {
      id: 'post_spatial',
      title: 'Why Spatial Software Will Replace the Folder Metaphor by 2030',
      subtitle: 'Files and nested directories were invented for 1970s filing cabinets. Human spatial memory remembers where ideas live by landscape and proximity.',
      slug: 'why-spatial-software-will-replace-the-folder-metaphor',
      coverImage: '/api/artwork/architecture',
      content: `Ask a carpenter or an architect to find a sketch from three months ago, and they rarely search by alphabetical filename. Instead, they reach toward the upper-left corner of their drafting table, beneath the brass caliper. Human memory is fundamentally hippocampal and topological.

## The Tyranny of the Hierarchical Tree

For fifty years, personal computing forced every thought into a strict parent-child directory tree. Does a research note on urban transit belong inside \`/Cities/Tokyo\` or \`/Essays/2026\`? The moment you file it in one drawer, it vanishes from the other.

> "We remember ideas by their neighbors, their visual texture, and the trajectory we traveled to reach them."

## Designing Topological Canvases

When software treats documents as tactile cards on a continuous plane—connected by semantic threads and temporal currents—discovery transforms from keyword recall into spatial navigation.

### Key Shifts in Interface Grammar

- **Proximity as Context**: Placing two drafts side by side establishes an implicit link without rigid folder taxonomy.
- **Scale & Zoom Cadence**: Stepping back reveals thematic clusters; zooming in opens a distraction-free reading column.
- **Persistent Landmarks**: Visual anchors help readers orient themselves across hundreds of interconnected essays.`,
      excerpt: 'Ask a carpenter or an architect to find a sketch from three months ago, and they rarely search by alphabetical filename. Human memory is fundamentally hippocampal and topological.',
      categoryId: 'cat_design',
      authorId: 'usr_sora',
      status: 'published',
      readingTime: 7,
      wordCount: 1420,
      views: 1930,
      featured: false,
      thoughtStarter: true,
      createdAt: '2026-09-27T15:20:00.000Z',
      updatedAt: '2026-09-27T15:20:00.000Z',
      publishedAt: '2026-09-27T15:20:00.000Z'
    },
    {
      id: 'post_systems',
      title: 'Designing Resilient Distributed Systems Without Losing Your Weekend',
      subtitle: 'Complexity rarely fails all at once. It erodes through silent retries, unbounded queues, and optimistic assumptions about network clocks.',
      slug: 'designing-resilient-distributed-systems-without-losing-your-weekend',
      coverImage: '/api/artwork/systems',
      content: `Every production incident post-mortem eventually uncovers the same uncomfortable truth: the system behaved exactly as it was programmed to behave under conditions nobody bothered to simulate.

## The Fallacy of Infinite Queues

An unbounded queue is not a buffer; it is a memory leak with a polite name. When downstream latency spikes from 12ms to 800ms, accepting every incoming request guarantees that by the time the worker processes item #40,000, the client has already timed out and retried three times.

\`\`\`typescript
// Explicit backpressure beats silent queueing
if (inFlightRequests >= MAX_CONCURRENCY) {
  return Response.json(
    { error: 'Server busy — shed load cleanly', retryAfterMs: 1500 },
    { status: 503 }
  );
}
\`\`\`

## Deterministic Simplicity

1. **Bound Every Resource**: Queues, connection pools, and retry budgets must have hard ceilings.
2. **Idempotency Keys Everywhere**: Network partitions turn "at-least-once" delivery into duplicate mutations unless every write carries a deterministic key.
3. **Boring Primitives Win**: A well-indexed relational store on fast NVMe storage handles ten times the load most teams assume requires a five-cluster mesh.`,
      excerpt: 'Every production incident post-mortem eventually uncovers the same uncomfortable truth: the system behaved exactly as it was programmed to behave under conditions nobody simulated.',
      categoryId: 'cat_programming',
      authorId: 'usr_arjun',
      status: 'published',
      readingTime: 8,
      wordCount: 1650,
      views: 2410,
      featured: false,
      thoughtStarter: false,
      createdAt: '2026-09-28T09:10:00.000Z',
      updatedAt: '2026-09-28T09:10:00.000Z',
      publishedAt: '2026-09-28T09:10:00.000Z'
    },
    {
      id: 'post_science',
      title: 'Notes on Slow Research in an Era of Instant Summaries',
      subtitle: 'Why cognitive friction during reading is the exact mechanism that builds original scientific intuition.',
      slug: 'notes-on-slow-research-in-an-era-of-instant-summaries',
      coverImage: '/api/artwork/science',
      content: `When you compress a forty-page monograph into five bullet points, you preserve the conclusions while discarding the struggle that made those conclusions intelligible. In neuroscience, we see repeatedly that synaptic consolidation depends on active prediction error—the moments where a reader pauses, disagrees, and rereads a dense paragraph.

## The Illusion of Fluency

Bullet-point summaries create high processing fluency. Because the takeaway feels easy to nod along with, the brain flags it as already known and allocates minimal metabolic energy to encoding it into long-term schemas.

> "Understanding is not the transfer of conclusions; it is the reconstruction of the argument inside your own working memory."

## Practices for Deep Reading

- Read with a pencil or margin note open—translate every claim into your own vocabulary.
- Follow primary citations two levels deep before accepting a textbook consensus.
- Write synthesis essays before consulting secondary commentary.`,
      excerpt: 'When you compress a forty-page monograph into five bullet points, you preserve the conclusions while discarding the struggle that made those conclusions intelligible.',
      categoryId: 'cat_science',
      authorId: 'usr_marcus',
      status: 'published',
      readingTime: 5,
      wordCount: 1040,
      views: 1380,
      featured: false,
      thoughtStarter: true,
      createdAt: '2026-09-29T07:45:00.000Z',
      updatedAt: '2026-09-29T07:45:00.000Z',
      publishedAt: '2026-09-29T07:45:00.000Z'
    },
    {
      id: 'post_compiler',
      title: 'What Building a Compiler in College Taught Me About Writing Prose',
      subtitle: 'Lexical ambiguity, dead code elimination, and why every paragraph needs a clear abstract syntax tree.',
      slug: 'what-building-a-compiler-taught-me-about-writing-prose',
      coverImage: '/api/artwork/compiler',
      content: `In my junior-year compilers seminar, our professor handed back essays with the exact same diagnostics our parser emitted: *dangling reference*, *unreachable clause*, *ambiguous binding*.

## Dead Code Elimination in First Drafts

Most first drafts contain throat-clearing paragraphs that compute a variable never referenced again in the essay. When you treat revision like an optimizing compiler pass, you ask a single question of every sentence: does removing this line alter the reader's state at the end of the section?

## Scope Resolution for Readers

Human working memory holds roughly four active bindings at once. Introducing three acronyms and two parenthetical digressions before resolving the main verb causes a stack overflow in the reader's attention.`,
      excerpt: 'In my junior-year compilers seminar, our professor handed back essays with the exact same diagnostics our parser emitted: dangling reference, unreachable clause, ambiguous binding.',
      categoryId: 'cat_college',
      authorId: 'usr_arjun',
      status: 'published',
      readingTime: 3,
      wordCount: 610,
      views: 1120,
      featured: false,
      thoughtStarter: false,
      createdAt: '2026-09-29T18:30:00.000Z',
      updatedAt: '2026-09-29T18:30:00.000Z',
      publishedAt: '2026-09-29T18:30:00.000Z'
    },
    {
      id: 'post_economics',
      title: 'The Quiet Economics of Independent Publishing Collectives',
      subtitle: 'How small groups of four to eight writers are pooling editorial standards, shared readership, and durable patronage.',
      slug: 'the-quiet-economics-of-independent-publishing-collectives',
      coverImage: '/api/artwork/economics',
      content: `Solo newsletters burn out writers because one person is forced to act as essayist, copy editor, art director, and circulation manager every Tuesday morning. Meanwhile, legacy media conglomerates collapse under overhead. Between the solo burnout and the conglomerate lies a remarkably resilient structure: the small editorial collective.

## Why Five Writers Beat One

When five writers with complementary obsessions share a masthead, each contributor can publish one deeply researched piece every three weeks while readers still receive two flagship essays a week. Quality rises while publishing anxiety drops.

## Shared Editorial Rigor

1. **Peer Editing Before Publication**: Every draft passes through at least two pairs of eyes that care about the craft.
2. **Cross-Pollinated Discussions**: Readers of technology essays discover cultural criticism in the same reading room.`,
      excerpt: 'Solo newsletters burn out writers because one person is forced to act as essayist, copy editor, and circulation manager. Between solo burnout and conglomerates lies the editorial collective.',
      categoryId: 'cat_business',
      authorId: 'usr_clara',
      status: 'published',
      readingTime: 6,
      wordCount: 1250,
      views: 1590,
      featured: false,
      thoughtStarter: true,
      createdAt: '2026-09-30T02:15:00.000Z',
      updatedAt: '2026-09-30T02:15:00.000Z',
      publishedAt: '2026-09-30T02:15:00.000Z'
    },
    {
      id: 'post_midnight',
      title: 'A Field Guide to Midnight Walks and Unstructured Thinking',
      subtitle: 'Why our best synthesis happens when our feet are moving and our pockets are empty of screens.',
      slug: 'a-field-guide-to-midnight-walks-and-unstructured-thinking',
      coverImage: '/api/artwork/midnight',
      content: `City streets after 11:30 PM undergo a phase change. The commercial signage dims, traffic reduces to an occasional distant tire hum over wet asphalt, and the visual field simplifies enough that internal monologue can finally stretch its legs.

## The Cadence of 100 Steps Per Minute

Kierkegaard, Dickens, and Darwin all relied on daily walks not as breaks from work, but as the primary arena where scattered observations locked into structure. Forward locomotion engages optic flow just enough to quiet anxious rumination without consuming executive bandwidth.`,
      excerpt: 'City streets after 11:30 PM undergo a phase change. The visual field simplifies enough that internal monologue can finally stretch its legs.',
      categoryId: 'cat_personal',
      authorId: 'usr_clara',
      status: 'published',
      readingTime: 2,
      wordCount: 420,
      views: 940,
      featured: false,
      thoughtStarter: false,
      createdAt: '2026-09-30T05:00:00.000Z',
      updatedAt: '2026-09-30T05:00:00.000Z',
      publishedAt: '2026-09-30T05:00:00.000Z'
    },
    {
      id: 'post_typography',
      title: 'How Typography Shapes Trust Before a Single Word Is Read',
      subtitle: 'From Renaissance punchcutters to high-DPI variable serifs, letterforms carry an unspoken epistemic posture.',
      slug: 'how-typography-shapes-trust-before-a-single-word-is-read',
      coverImage: '/api/artwork/typography',
      content: `Before a reader parses the grammar of your opening sentence, their visual cortex has already measured stroke modulation, x-height, aperture openness, and paragraph density. In less than 150 milliseconds, typography signals whether a page is a disposable flyer or an enduring essay.

## Optical Sizes and Emotional Weight

Display serifs cut with high contrast between thick stems and hairline serifs invite slow inspection. Meanwhile, workhorse text cuts open up their counters and sturdy their serifs to survive long passages at 16px without dazzling the eye.`,
      excerpt: 'Before a reader parses the grammar of your opening sentence, their visual cortex has already measured stroke modulation, x-height, and paragraph density.',
      categoryId: 'cat_design',
      authorId: 'usr_elena',
      status: 'published',
      readingTime: 4,
      wordCount: 830,
      views: 1460,
      featured: false,
      thoughtStarter: false,
      createdAt: '2026-09-30T06:30:00.000Z',
      updatedAt: '2026-09-30T06:30:00.000Z',
      publishedAt: '2026-09-30T06:30:00.000Z'
    },
    {
      id: 'post_draft_elena',
      title: 'On Archive Durability and the 100-Year File Format',
      subtitle: 'Draft notes on plain text, UTF-8, and why simple encodings outlive proprietary ecosystems.',
      slug: 'on-archive-durability-and-the-100-year-file-format',
      coverImage: '/api/artwork/systems',
      content: `Working draft exploring what formats from 1996 are still effortlessly readable in 2026, and what lessons that holds for personal knowledge archives.`,
      excerpt: 'Working draft exploring what formats from 1996 are still effortlessly readable in 2026, and what lessons that holds for personal knowledge archives.',
      categoryId: 'cat_tech',
      authorId: 'usr_elena',
      status: 'draft',
      readingTime: 3,
      wordCount: 540,
      views: 0,
      featured: false,
      thoughtStarter: false,
      createdAt: '2026-09-30T07:00:00.000Z',
      updatedAt: '2026-09-30T07:00:00.000Z',
      publishedAt: null
    }
  ];

  const post_tags: PostTagRecord[] = [
    { postId: 'post_silence', tagId: 'tag_1' },
    { postId: 'post_silence', tagId: 'tag_2' },
    { postId: 'post_silence', tagId: 'tag_8' },
    { postId: 'post_spatial', tagId: 'tag_3' },
    { postId: 'post_spatial', tagId: 'tag_6' },
    { postId: 'post_systems', tagId: 'tag_5' },
    { postId: 'post_systems', tagId: 'tag_12' },
    { postId: 'post_science', tagId: 'tag_7' },
    { postId: 'post_science', tagId: 'tag_8' },
    { postId: 'post_compiler', tagId: 'tag_9' },
    { postId: 'post_compiler', tagId: 'tag_12' },
    { postId: 'post_economics', tagId: 'tag_10' },
    { postId: 'post_midnight', tagId: 'tag_11' },
    { postId: 'post_typography', tagId: 'tag_4' },
    { postId: 'post_typography', tagId: 'tag_12' }
  ];

  const comments: CommentRecord[] = [
    {
      id: 'cmt_1',
      postId: 'post_silence',
      authorId: 'usr_arjun',
      parentId: null,
      content: 'This completely changed how I think about interface acoustics. The distinction between an airport terminal and a study room is something every engineering team should tape above their monitor.',
      createdAt: '2026-09-26T11:20:00.000Z',
      updatedAt: '2026-09-26T11:20:00.000Z'
    },
    {
      id: 'cmt_2',
      postId: 'post_silence',
      authorId: 'usr_sora',
      parentId: 'cmt_1',
      content: 'Same. Especially the second point on typography as shelter. When we widened margins and removed live ticker counters in our studio prototype, average reading completion jumped by 42%.',
      createdAt: '2026-09-26T12:05:00.000Z',
      updatedAt: '2026-09-26T12:05:00.000Z'
    },
    {
      id: 'cmt_3',
      postId: 'post_silence',
      authorId: 'usr_marcus',
      parentId: 'cmt_1',
      content: 'Interesting — I had a complementary observation in our lab: even subtle motion in peripheral vision degrades working-memory recall of complex prose.',
      createdAt: '2026-09-26T14:40:00.000Z',
      updatedAt: '2026-09-26T14:40:00.000Z'
    },
    {
      id: 'cmt_4',
      postId: 'post_silence',
      authorId: 'usr_clara',
      parentId: null,
      content: 'The historical note on sixteenth-century marginalia is spot on. Correspondence used to have a natural cadence that allowed ideas to mature before being published.',
      createdAt: '2026-09-27T09:15:00.000Z',
      updatedAt: '2026-09-27T09:15:00.000Z'
    },
    {
      id: 'cmt_5',
      postId: 'post_spatial',
      authorId: 'usr_elena',
      parentId: null,
      content: 'The carpenter analogy immediately clicked for me. I always remember where a quote sat on the physical page—top right, near the gutter—long after I forget the chapter title.',
      createdAt: '2026-09-28T10:00:00.000Z',
      updatedAt: '2026-09-28T10:00:00.000Z'
    },
    {
      id: 'cmt_6',
      postId: 'post_systems',
      authorId: 'usr_marcus',
      parentId: null,
      content: '"An unbounded queue is a memory leak with a polite name" is going straight into my lecture slides on biological neural bottlenecks too.',
      createdAt: '2026-09-29T08:30:00.000Z',
      updatedAt: '2026-09-29T08:30:00.000Z'
    }
  ];

  const comment_likes: CommentLikeRecord[] = [
    { id: 'cl_1', commentId: 'cmt_1', userId: 'usr_elena', createdAt: '2026-09-26T12:00:00.000Z' },
    { id: 'cl_2', commentId: 'cmt_1', userId: 'usr_sora', createdAt: '2026-09-26T12:04:00.000Z' },
    { id: 'cl_3', commentId: 'cmt_1', userId: 'usr_clara', createdAt: '2026-09-26T16:00:00.000Z' },
    { id: 'cl_4', commentId: 'cmt_2', userId: 'usr_elena', createdAt: '2026-09-26T13:00:00.000Z' },
    { id: 'cl_5', commentId: 'cmt_2', userId: 'usr_arjun', createdAt: '2026-09-26T13:10:00.000Z' }
  ];

  const likes: LikeRecord[] = [
    { id: 'lk_1', postId: 'post_silence', userId: 'usr_arjun', createdAt: '2026-09-26T10:00:00.000Z' },
    { id: 'lk_2', postId: 'post_silence', userId: 'usr_sora', createdAt: '2026-09-26T11:00:00.000Z' },
    { id: 'lk_3', postId: 'post_silence', userId: 'usr_marcus', createdAt: '2026-09-26T12:00:00.000Z' },
    { id: 'lk_4', postId: 'post_silence', userId: 'usr_clara', createdAt: '2026-09-26T13:00:00.000Z' },
    { id: 'lk_5', postId: 'post_spatial', userId: 'usr_elena', createdAt: '2026-09-27T16:00:00.000Z' },
    { id: 'lk_6', postId: 'post_spatial', userId: 'usr_arjun', createdAt: '2026-09-27T17:00:00.000Z' },
    { id: 'lk_7', postId: 'post_spatial', userId: 'usr_clara', createdAt: '2026-09-27T18:00:00.000Z' },
    { id: 'lk_8', postId: 'post_systems', userId: 'usr_elena', createdAt: '2026-09-28T11:00:00.000Z' },
    { id: 'lk_9', postId: 'post_systems', userId: 'usr_sora', createdAt: '2026-09-28T12:00:00.000Z' },
    { id: 'lk_10', postId: 'post_systems', userId: 'usr_marcus', createdAt: '2026-09-28T13:00:00.000Z' },
    { id: 'lk_11', postId: 'post_science', userId: 'usr_elena', createdAt: '2026-09-29T09:00:00.000Z' },
    { id: 'lk_12', postId: 'post_science', userId: 'usr_arjun', createdAt: '2026-09-29T10:00:00.000Z' },
    { id: 'lk_13', postId: 'post_economics', userId: 'usr_elena', createdAt: '2026-09-30T03:00:00.000Z' },
    { id: 'lk_14', postId: 'post_typography', userId: 'usr_sora', createdAt: '2026-09-30T07:00:00.000Z' }
  ];

  const reactions: ReactionRecord[] = [
    { id: 'rx_1', postId: 'post_silence', userId: 'usr_arjun', type: 'insightful', createdAt: '2026-09-26T10:01:00.000Z' },
    { id: 'rx_2', postId: 'post_silence', userId: 'usr_sora', type: 'loved', createdAt: '2026-09-26T11:01:00.000Z' },
    { id: 'rx_3', postId: 'post_silence', userId: 'usr_marcus', type: 'thinking', createdAt: '2026-09-26T12:01:00.000Z' },
    { id: 'rx_4', postId: 'post_silence', userId: 'usr_clara', type: 'interesting', createdAt: '2026-09-26T13:01:00.000Z' },
    { id: 'rx_5', postId: 'post_spatial', userId: 'usr_elena', type: 'insightful', createdAt: '2026-09-27T16:01:00.000Z' },
    { id: 'rx_6', postId: 'post_spatial', userId: 'usr_arjun', type: 'interesting', createdAt: '2026-09-27T17:01:00.000Z' },
    { id: 'rx_7', postId: 'post_systems', userId: 'usr_elena', type: 'loved', createdAt: '2026-09-28T11:01:00.000Z' },
    { id: 'rx_8', postId: 'post_systems', userId: 'usr_marcus', type: 'insightful', createdAt: '2026-09-28T13:01:00.000Z' },
    { id: 'rx_9', postId: 'post_science', userId: 'usr_elena', type: 'thinking', createdAt: '2026-09-29T09:01:00.000Z' }
  ];

  const bookmarks: BookmarkRecord[] = [
    { id: 'bm_1', postId: 'post_spatial', userId: 'usr_elena', shelf: 'favorites', createdAt: '2026-09-27T16:05:00.000Z' },
    { id: 'bm_2', postId: 'post_systems', userId: 'usr_elena', shelf: 'later', createdAt: '2026-09-28T11:05:00.000Z' },
    { id: 'bm_3', postId: 'post_science', userId: 'usr_elena', shelf: 'recent', createdAt: '2026-09-29T09:05:00.000Z' },
    { id: 'bm_4', postId: 'post_silence', userId: 'usr_arjun', shelf: 'favorites', createdAt: '2026-09-26T10:05:00.000Z' }
  ];

  const followers: FollowerRecord[] = [
    { id: 'fl_1', followerId: 'usr_elena', followingId: 'usr_arjun', createdAt: '2026-01-15T10:00:00.000Z' },
    { id: 'fl_2', followerId: 'usr_elena', followingId: 'usr_sora', createdAt: '2026-01-16T10:00:00.000Z' },
    { id: 'fl_3', followerId: 'usr_elena', followingId: 'usr_clara', createdAt: '2026-03-10T10:00:00.000Z' },
    { id: 'fl_4', followerId: 'usr_arjun', followingId: 'usr_elena', createdAt: '2026-01-15T11:00:00.000Z' },
    { id: 'fl_5', followerId: 'usr_sora', followingId: 'usr_elena', createdAt: '2026-01-18T11:00:00.000Z' },
    { id: 'fl_6', followerId: 'usr_marcus', followingId: 'usr_elena', createdAt: '2026-02-10T11:00:00.000Z' },
    { id: 'fl_7', followerId: 'usr_clara', followingId: 'usr_elena', createdAt: '2026-03-05T11:00:00.000Z' },
    { id: 'fl_8', followerId: 'usr_sora', followingId: 'usr_arjun', createdAt: '2026-02-01T11:00:00.000Z' }
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'ntf_1',
      userId: 'usr_elena',
      actorId: 'usr_arjun',
      type: 'comment',
      postId: 'post_silence',
      commentId: 'cmt_1',
      message: 'Arjun Mehta commented on "The Internet Is Getting Louder. Maybe We Need Better Silence."',
      read: false,
      createdAt: '2026-09-26T11:20:00.000Z'
    },
    {
      id: 'ntf_2',
      userId: 'usr_elena',
      actorId: null,
      type: 'milestone',
      postId: 'post_silence',
      commentId: null,
      message: 'Your story "The Internet Is Getting Louder. Maybe We Need Better Silence." reached 2,500 views.',
      read: false,
      createdAt: '2026-09-29T15:00:00.000Z'
    },
    {
      id: 'ntf_3',
      userId: 'usr_elena',
      actorId: 'usr_sora',
      type: 'like',
      postId: 'post_typography',
      commentId: null,
      message: 'Sora Takahashi reacted to "How Typography Shapes Trust Before a Single Word Is Read".',
      read: false,
      createdAt: '2026-09-30T07:00:00.000Z'
    },
    {
      id: 'ntf_4',
      userId: 'usr_elena',
      actorId: 'usr_clara',
      type: 'follow',
      postId: null,
      commentId: null,
      message: 'Clara Lin started following your wave.',
      read: true,
      createdAt: '2026-09-25T08:00:00.000Z'
    },
    {
      id: 'ntf_5',
      userId: 'usr_arjun',
      actorId: 'usr_sora',
      type: 'reply',
      postId: 'post_silence',
      commentId: 'cmt_2',
      message: 'Sora Takahashi replied to your comment on "The Internet Is Getting Louder..."',
      read: false,
      createdAt: '2026-09-26T12:05:00.000Z'
    }
  ];

  return {
    users,
    categories,
    tags,
    posts,
    post_tags,
    comments,
    comment_likes,
    likes,
    reactions,
    bookmarks,
    followers,
    notifications,
    sessions: []
  };
}

class RelationalDB {
  private state: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.state = JSON.parse(raw);
      } catch {
        this.state = createInitialSeedData();
        this.persist();
      }
    } else {
      this.state = createInitialSeedData();
      this.persist();
    }
  }

  public get data(): DatabaseSchema {
    return this.state;
  }

  public persist(): void {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public sanitizeUser(user: UserRecord) {
    const followersCount = this.state.followers.filter((f) => f.followingId === user.id).length;
    const followingCount = this.state.followers.filter((f) => f.followerId === user.id).length;
    const userPosts = this.state.posts.filter((p) => p.authorId === user.id && p.status === 'published');
    const postIds = new Set(userPosts.map((p) => p.id));
    const totalLikes =
      this.state.likes.filter((l) => postIds.has(l.postId)).length +
      this.state.reactions.filter((r) => postIds.has(r.postId)).length;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      joinedAt: user.joinedAt,
      role: user.role,
      suspended: user.suspended,
      featuredWriter: user.featuredWriter,
      badges: user.badges,
      readingStreak: user.readingStreak,
      followersCount,
      followingCount,
      postsCount: userPosts.length,
      totalLikes
    };
  }

  public computeTrendingScore(post: PostRecord): number {
    const likesCount = this.state.likes.filter((l) => l.postId === post.id).length;
    const reactionsCount = this.state.reactions.filter((r) => r.postId === post.id).length;
    const commentsCount = this.state.comments.filter((c) => c.postId === post.id).length;
    const ageHours = Math.max(
      1,
      (Date.now() - new Date(post.publishedAt || post.createdAt).getTime()) / (1000 * 60 * 60)
    );
    const recencyBoost = Math.max(1, 120 / (ageHours + 12));
    return Math.round((likesCount * 14 + reactionsCount * 18 + commentsCount * 24 + post.views * 0.08) * recencyBoost);
  }

  public enrichPost(post: PostRecord, currentUserId?: string | null) {
    const author = this.state.users.find((u) => u.id === post.authorId);
    const category = this.state.categories.find((c) => c.id === post.categoryId);
    const tagIds = this.state.post_tags.filter((pt) => pt.postId === post.id).map((pt) => pt.tagId);
    const tags = this.state.tags.filter((t) => tagIds.includes(t.id));

    const likes = this.state.likes.filter((l) => l.postId === post.id);
    const reactions = this.state.reactions.filter((r) => r.postId === post.id);
    const commentsCount = this.state.comments.filter((c) => c.postId === post.id).length;
    const bookmarks = this.state.bookmarks.filter((b) => b.postId === post.id);

    const reactionCounts: Record<ReactionType, number> = {
      loved: reactions.filter((r) => r.type === 'loved').length,
      insightful: reactions.filter((r) => r.type === 'insightful').length,
      interesting: reactions.filter((r) => r.type === 'interesting').length,
      thinking: reactions.filter((r) => r.type === 'thinking').length
    };

    const userLike = currentUserId ? likes.some((l) => l.userId === currentUserId) : false;
    const userReaction = currentUserId
      ? reactions.find((r) => r.userId === currentUserId)?.type || null
      : null;
    const userBookmark = currentUserId
      ? bookmarks.find((b) => b.userId === currentUserId)?.shelf || null
      : null;
    const isFollowingAuthor =
      currentUserId && author
        ? this.state.followers.some((f) => f.followerId === currentUserId && f.followingId === author.id)
        : false;

    const trendingScore = this.computeTrendingScore(post);
    const ageHours = (Date.now() - new Date(post.publishedAt || post.createdAt).getTime()) / (1000 * 60 * 60);
    const freshness = ageHours < 24 ? 'Fresh today' : ageHours < 72 ? 'This week' : 'Archive';

    return {
      ...post,
      author: author ? this.sanitizeUser(author) : null,
      category: category || { id: 'cat_tech', name: 'Technology', slug: 'technology', description: '' },
      tags,
      likesCount: likes.length,
      reactionsCount: reactions.length,
      reactionCounts,
      commentsCount,
      bookmarksCount: bookmarks.length,
      likedByMe: userLike,
      myReaction: userReaction,
      myBookmarkShelf: userBookmark,
      isFollowingAuthor,
      trendingScore,
      freshness
    };
  }
}

export const db = new RelationalDB();
