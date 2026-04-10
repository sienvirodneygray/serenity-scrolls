import { createClient } from '@supabase/supabase-js';

async function test() {
  const supabaseUrl = 'https://ytaporbcmtlidafbssyc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjA4ODksImV4cCI6MjA4ODI5Njg4OX0.OtsXhTimnK_VUcZns-ygq5tFBuQLKYjvhfDPBk9NLlw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Authenticating...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sienvirodneygray@gmail.com',
    password: '1HoIx0_i5P5I'
  });

  if (authError) {
    console.error("Auth failed:", authError);
    return;
  }

  console.log("Token:", authData.session.access_token.substring(0, 20) + "...");

  console.log("Invoking edge function...");
  const { data, error } = await supabase.functions.invoke('sync-amazon-inventory');
  
  if (error) {
    console.error("Edge function threw Error object:", JSON.stringify(error, null, 2));
    if (error.context) {
       let ctx = error.context;
       try { ctx = await error.context.text(); } catch(e){}
       console.log("Context from error:", ctx);
    }
  } else {
    console.log("Edge function success:", data);
  }
}

test();
