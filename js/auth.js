// Authentication module

// Initialize authentication
async function initAuth() {
    try {
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        updateAuthUI(session?.user);

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            updateAuthUI(session?.user);
        });

    } catch (error) {
        console.error('Error initializing auth:', error);
    }
}

// Update authentication UI
function updateAuthUI(user) {
    const authBtn = document.getElementById('auth-btn');
    const createLink = document.getElementById('create-link');
    const profileLink = document.getElementById('profile-link');

    if (user) {
        // User is logged in
        authBtn.textContent = 'Logout';
        authBtn.onclick = handleLogout;
        
        if (createLink) createLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'inline';
    } else {
        // User is not logged in
        authBtn.textContent = 'Login';
        authBtn.onclick = () => window.location.href = 'login.html';
        
        if (createLink) createLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
    }
}

// Sign up new user
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Signup error:', error);
        return { data: null, error };
    }
}

// Sign in user
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Signin error:', error);
        return { data: null, error };
    }
}

// Sign out user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        return { error: null };
    } catch (error) {
        console.error('Signout error:', error);
        return { error };
    }
}

// Get current user
async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Update user profile
async function updateProfile(fullName) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName
            }
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Profile update error:', error);
        return { data: null, error };
    }
}

// Handle logout
async function handleLogout() {
    try {
        const result = await signOut();
        
        if (result.error) {
            throw result.error;
        }

        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Check if user is authenticated (utility function)
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = `login.html?return=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return false;
    }
    return user;
}
