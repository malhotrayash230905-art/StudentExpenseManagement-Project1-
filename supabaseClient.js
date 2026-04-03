// Initialize Supabase client
// NOTE: The ANON_KEY is safe to expose in the frontend if Row Level Security (RLS) is enabled in Supabase.
const SUPABASE_URL = 'https://lydzsgdqobzmtqyocrcs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_K1uazsYz177wpdHfeXa64w_MNgTikFz';
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
