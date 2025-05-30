// Supabase client configuration
const SUPABASE_URL = window.location.hostname === 'localhost' 
  ? 'https://umuxgawvdxyhrdwceagi.supabase.co'
  : 'https://umuxgawvdxyhrdwceagi.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdXhnYXd2ZHh5aHJkd2NlYWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTgwNTgsImV4cCI6MjA2NDE5NDA1OH0.zH3Vcl4LHf3UeBkkKLsLXjuJarOaIx7FefdbJJQDbng';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

console.log('Supabase client initialized');
