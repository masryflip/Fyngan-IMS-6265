import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iprjfyzeklhzkyvgayum.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcmpmeXpla2xoemt5dmdheXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDc5NjAsImV4cCI6MjA2NzM4Mzk2MH0.Tuu170ztur_obEsA1UXFboqlvKtFIsxP63Rd0wkM6tk'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'fyngan-inventory'
    }
  }
})

// Test connection on initialization
supabase
  .from('locations_fyngan_2024')
  .select('count')
  .limit(1)
  .then(
    result => {
      console.log('✅ Supabase connected successfully');
      console.log('Database connection test result:', result);
    },
    error => {
      console.error('❌ Supabase connection error:', error);
      
      // If tables don't exist, that's expected for a fresh setup
      if (error.message && error.message.includes('does not exist')) {
        console.log('📝 Tables need to be created - this is normal for first setup');
      }
    }
  );

export default supabase;