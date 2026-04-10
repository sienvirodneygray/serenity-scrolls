const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ytaporbcmtlidafbssyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjA4ODksImV4cCI6MjA4ODI5Njg4OX0.OtsXhTimnK_VUcZns-ygq5tFBuQLKYjvhfDPBk9NLlw'
);

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log('PRODUCTS IN DB:', JSON.stringify(data, null, 2));
  }
}

checkProducts();
