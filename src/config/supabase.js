import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Service role client — bypasses RLS, used for all server-side queries
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
)