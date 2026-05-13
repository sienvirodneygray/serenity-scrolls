const url = "https://ytaporbcmtlidafbssyc.supabase.co/rest/v1/course_lessons?select=slug,title,content_body,video_url&slug=eq.conflict-vs-bullying";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUxNDQzNzAsImV4cCI6MjAyODcyNDM3MH0..."; // wait, I don't have the anon key handy without reading it from .env.local

import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="(.*)"/);
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.*)"/);

if (anonKeyMatch && urlMatch) {
  const anonKey = anonKeyMatch[1].trim();
  const baseUrl = urlMatch[1].trim();
  
  fetch(`${baseUrl}/rest/v1/course_lessons?select=slug,content_body,video_url&slug=eq.conflict-vs-bullying`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  }).then(res => res.json()).then(data => console.log("DATA:", data)).catch(err => console.error(err));
}
