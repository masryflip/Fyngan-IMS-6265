import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mahmfbprgoaqowqqmhlc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haG1mYnByZ29hcW93cXFtaGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTI5NzQsImV4cCI6MjA2NzE4ODk3NH0.C8OroQCNKT5S6oSVjU7GoZrytJOmF1oXunIdgm2oNLI'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})