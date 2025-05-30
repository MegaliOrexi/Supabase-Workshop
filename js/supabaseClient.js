// Supabase client configuration
const SUPABASE_URL = window.location.hostname === 'localhost' 
  ? 'https://your-project.supabase.co'
  : 'https://your-project.supabase.co';

const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

console.log('Supabase client initialized');
