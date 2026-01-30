
# Enhanced Blog System & FAQ Implementation Plan

## Overview
Your project already has a solid blog system and FAQ foundation. This plan enhances the existing implementation with advanced SEO/AEO features and optional database-driven FAQ management.

---

## Phase 1: Database Schema Updates

### Update `blog_posts` Table
Add new columns for enhanced SEO/AEO optimization:

| Column | Type | Purpose |
|--------|------|---------|
| `seo_keywords` | text[] | Array of SEO keywords for the post |
| `long_tail_queries` | text[] | AEO-optimized question phrases |
| `status` | text | 'draft' or 'published' (replaces boolean `published`) |
| `published_at` | timestamp | When the post was first published |

Migration will convert existing `published=true` posts to `status='published'`.

### Create `faqs` Table (Optional Database-Driven)
```text
┌─────────────────────────────────────────────┐
│ faqs                                        │
├─────────────────────────────────────────────┤
│ id          UUID    PRIMARY KEY             │
│ question    TEXT    NOT NULL                │
│ answer      TEXT    NOT NULL                │
│ category    TEXT    (optional grouping)     │
│ sort_order  INTEGER DEFAULT 0               │
│ is_active   BOOLEAN DEFAULT true            │
│ created_at  TIMESTAMP                       │
│ updated_at  TIMESTAMP                       │
└─────────────────────────────────────────────┘
```

RLS Policies:
- Public: SELECT where `is_active = true`
- Admins: Full CRUD access

---

## Phase 2: Enhanced AI Blog Generator

### Edge Function Updates (`generate-blog`)
Update the edge function with:

1. **Structured Output via Tool Calling** - Reliable JSON extraction using Lovable AI tool calling
2. **AEO-Optimized Prompts**:
   - Question-style H2/H3 headings (e.g., "Why Does Anxiety Make Us Feel Alone?")
   - Paragraphs under 80 words
   - Front-load answers before elaboration
   - Generate SEO keywords and long-tail queries automatically

3. **Updated AI Prompt Structure**:
```text
Content Rules:
- Open with a direct answer to the main question
- Use question-style H2 headings for each section
- Keep paragraphs under 80 words
- Include 2-3 Scripture references with blockquotes
- Natural keyword integration

Output Schema:
- title, slug, excerpt, content, category
- seoKeywords: string[] (5-8 keywords)
- longTailQueries: string[] (3-5 question phrases)
- metaTitle, metaDescription
```

---

## Phase 3: Admin Blog Manager Enhancements

### Update `BlogPostForm.tsx`
Add to the SEO tab:

1. **SEO Keywords Input**
   - Tag-style input for adding/removing keywords
   - Display as removable badges
   - Suggestions from AI generation

2. **Long-Tail Queries Input**
   - Similar tag input for question phrases
   - Help text: "Question phrases people search for"

3. **Status Field**
   - Replace boolean switch with dropdown: Draft / Published
   - Show `published_at` timestamp when published

### Update `BlogManagement.tsx`
- Update queries to use `status` instead of `published`
- Display keywords in table if space allows
- Enhanced AI generation with additional context field

### Visual Mockup of SEO Tab Additions:
```text
┌─────────────────────────────────────────────┐
│ SEO Keywords                                │
│ ┌─────────────────────────────────────────┐ │
│ │ [faith journal ×] [journal prompts ×]  │ │
│ │ [gratitude ×] [+ Add keyword...]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Long-Tail Queries (AEO)                     │
│ ┌─────────────────────────────────────────┐ │
│ │ [How do I start journaling? ×]         │ │
│ │ [What are good faith journal prompts?×]│ │
│ │ [+ Add query...]                        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Status: [Draft ▼] / Published              │
└─────────────────────────────────────────────┘
```

---

## Phase 4: FAQ System Enhancement

### Option A: Keep Static (Recommended for Simplicity)
The current FAQ component with 14 questions works well. We can:
- Add more SEO-optimized questions
- Organize by category with tabs
- Add JSON-LD schema markup for rich snippets

### Option B: Database-Driven FAQ (Full Control)
Create admin interface at `/admin` (in Settings or new FAQ tab):

1. **FAQ Management UI**
   - Table listing all FAQs with drag-to-reorder
   - Add/Edit/Delete modals
   - Category filtering
   - Active/Inactive toggle

2. **Public FAQ Component**
   - Fetch from database
   - Category tabs if multiple categories
   - Same accordion styling

---

## Phase 5: Frontend Updates

### Update Blog Listing (`/blog`)
- Show keywords as small badges under excerpt
- Filter by category enhancement

### Update Blog Post Page (`/blog/:slug`)
- Add JSON-LD structured data for SEO
- Display related posts based on keywords
- Show long-tail queries as "Related Questions" section

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/ui/tag-input.tsx` | Reusable tag input component |
| `src/components/admin/FAQManagement.tsx` | Admin FAQ CRUD (if Option B) |

### Files to Modify
| File | Changes |
|------|---------|
| `supabase/functions/generate-blog/index.ts` | Add tool calling, AEO rules, keyword generation |
| `src/components/admin/BlogPostForm.tsx` | Add SEO keywords and long-tail query inputs |
| `src/components/admin/BlogManagement.tsx` | Update for new fields, status vs published |
| `src/pages/Blog.tsx` | Display keywords, update query for status field |
| `src/pages/BlogPost.tsx` | Add structured data, related questions |
| `src/components/FeaturedBlogPosts.tsx` | Update query for status field |
| `src/components/FAQ.tsx` | Optional: fetch from DB, add schema markup |
| `src/pages/AdminDashboard.tsx` | Add FAQ tab if Option B |

### Database Migration
```sql
-- Add new columns
ALTER TABLE blog_posts 
  ADD COLUMN seo_keywords text[] DEFAULT '{}',
  ADD COLUMN long_tail_queries text[] DEFAULT '{}',
  ADD COLUMN status text DEFAULT 'draft',
  ADD COLUMN published_at timestamptz;

-- Migrate existing data
UPDATE blog_posts SET status = 'published', published_at = created_at WHERE published = true;
UPDATE blog_posts SET status = 'draft' WHERE published = false;

-- Create faqs table (if Option B)
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Implementation Order
1. Database migration (add columns + create faqs table)
2. Update generate-blog edge function with tool calling
3. Create TagInput component
4. Update BlogPostForm with new fields
5. Update BlogManagement for status field
6. Update public blog pages
7. FAQ management (if Option B chosen)

---

## Questions Before Implementation

I'd like to clarify one thing:

**For the FAQ system, would you prefer:**
- **Option A**: Keep the current static FAQ (simpler, already works well with 14 questions)
- **Option B**: Create a database-driven FAQ with admin management (more flexible, requires more work)

Both options can include SEO schema markup for rich search results.
