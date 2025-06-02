// Supabase client configuration
const SUPABASE_URL = 'Your Supabase URL'

const SUPABASE_ANON_KEY = 'SUPABASE ANON KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

console.log('Supabase client initialized');


