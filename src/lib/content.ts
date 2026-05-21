import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  featured_image: string | null;
  seo_keywords: string[] | null;
  created_at: string;
  published_at: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  long_tail_queries: string[] | null;
  faq_schema: {
    "@context"?: string;
    "@type"?: string;
    mainEntity?: Array<{
      name: string;
      acceptedAnswer?: { text?: string };
    }>;
  } | null;
  word_count: number | null;
  updated_at: string;
}

const publishedBlogFilter = "status.eq.published,and(status.is.null,published.eq.true)";

const fallbackPublishedPosts: BlogPostDetail[] = [
  {
    id: "fallback-bible-verses-for-anxiety-and-peace",
    title: "Bible Verses for Anxiety and Peace",
    slug: "bible-verses-for-anxiety-and-peace",
    excerpt:
      "Read Bible verses for anxious hearts, peaceful prayer, and Scripture-centered reflection when you need steady encouragement from God's Word.",
    category: "scripture encouragement",
    author: "Serenity Scrolls Team",
    featured_image: null,
    seo_keywords: [
      "bible verses for anxiety",
      "bible verses for peace",
      "scripture for anxious hearts",
      "christian encouragement",
    ],
    created_at: "2026-05-22T00:00:00.000Z",
    published_at: "2026-05-22T00:00:00.000Z",
    meta_title: "Bible Verses for Anxiety and Peace | Serenity Scrolls",
    meta_description:
      "Explore Bible verses for anxiety and peace, plus reflection prompts, a simple prayer, and Scripture-centered encouragement from Serenity Scrolls.",
    long_tail_queries: [
      "What are good Bible verses for anxiety and peace?",
      "How can I pray through anxious thoughts with Scripture?",
      "What Bible verses help when I need peace?",
    ],
    faq_schema: null,
    word_count: 620,
    updated_at: "2026-05-22T00:00:00.000Z",
    content: `
## When Anxiety Feels Loud

There are moments when your thoughts race faster than your peace can keep up. Scripture does not shame that moment. It invites you to bring it honestly before God and let His Word steady your heart one verse at a time.

## Bible Verses for Anxiety and Peace

- **Philippians 4:6-7** reminds us to bring every request to God in prayer and to receive the peace of God that guards heart and mind.
- **Psalm 94:19** speaks to crowded thoughts and the comfort God gives when anxiety rises within us.
- **Isaiah 26:3** points us toward a steady mind that is anchored in trust.
- **John 14:27** reminds us that Christ gives a peace different from the fear-driven peace the world offers.
- **Psalm 46:1** calls God our refuge and strength, especially in moments of trouble.
- **Matthew 11:28-30** invites the weary to come to Jesus and find rest for their souls.
- **1 Peter 5:7** tells us to cast our cares on God because He cares for us.

## A Gentle Way to Sit With These Verses

Choose one verse and read it slowly two or three times. Notice which word stands out. You may be drawn to peace, refuge, rest, trust, or care. Let that word become the center of a short prayer.

If you want a physical reminder of that rhythm, the [Serenity Scrolls shop](/shop) offers Scripture-centered tools you can keep close by. You can also explore our longer guide to [Bible verse scrolls for anxiety and peace](/bible-verse-scrolls-for-anxiety-and-peace) for a more structured devotional pattern.

## Reflection Prompt

What part of my anxiety feels the heaviest today, and which verse helps me hand that burden to God instead of carrying it alone?

## Prayer Prompt

Lord, You see the thoughts I cannot quiet on my own. Help me slow down, trust You, and receive the peace You promise. Teach me to return to Your Word when my heart feels unsettled. Amen.

## A Small Faithful Next Step

Write one of these verses on a note card, place it where you will see it later today, and return to it before bed. Peace often grows through small, repeated acts of trust.

## Continue With Scripture-Centered Encouragement

If this article helped you pause and breathe, keep going gently. Browse the [shop](/shop), read more from our [Bible verse scrolls for anxiety and peace guide](/bible-verse-scrolls-for-anxiety-and-peace), or share one of these verses with someone who needs encouragement today.
`,
  },
];

export async function fetchPublishedBlogPosts() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, author, featured_image, seo_keywords, created_at, published_at")
    .or(publishedBlogFilter)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[content] failed to fetch blog posts", error);
    return fallbackPublishedPosts as BlogPostSummary[];
  }

  const posts = (data ?? []) as BlogPostSummary[];
  return posts.length > 0 ? posts : (fallbackPublishedPosts as BlogPostSummary[]);
}

export async function fetchBlogPostBySlug(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .or(publishedBlogFilter)
    .maybeSingle();

  if (error) {
    console.error("[content] failed to fetch blog post", error);
    return fallbackPublishedPosts.find((post) => post.slug === slug) ?? null;
  }

  return (data as BlogPostDetail | null) ?? fallbackPublishedPosts.find((post) => post.slug === slug) ?? null;
}

export async function fetchRelatedBlogPosts(category: string, postId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, author, featured_image, seo_keywords, created_at, published_at")
    .or(publishedBlogFilter)
    .eq("category", category)
    .neq("id", postId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[content] failed to fetch related posts", error);
    return fallbackPublishedPosts.filter((post) => post.category === category && post.id !== postId) as BlogPostSummary[];
  }

  const posts = (data ?? []) as BlogPostSummary[];
  if (posts.length > 0) return posts;

  return fallbackPublishedPosts.filter((post) => post.category === category && post.id !== postId) as BlogPostSummary[];
}
