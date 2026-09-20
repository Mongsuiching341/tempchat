import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in dev rather than silently breaking every request.
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project URL/key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)