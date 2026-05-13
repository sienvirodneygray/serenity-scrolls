import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function check() {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('slug, title, content_body, video_url')
    .eq('slug', 'conflict-vs-bullying');
  console.log(JSON.stringify({ data, error }, null, 2));
}
check();
