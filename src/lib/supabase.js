import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mahmfbprgoaqowqqmhlc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haG1mYnByZ29hcW93cXFtaGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTI5NzQsImV4cCI6MjA2NzE4ODk3NH0.C8OroQCNKT5S6oSVjU7GoZrytJOmF1oXunIdgm2oNLI'

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
    result => console.log('✅ Supabase connected successfully'),
    error => console.error('❌ Supabase connection failed:', error)
  )

export default supabase