// Database initialization module

// Check if tables exist and create them if needed
async function initializeDatabase() {
    try {
        console.log('Checking database tables...');
        
        // Test if tables exist by making simple queries
        await testDatabaseTables();
        
        console.log('Database tables verified successfully');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log('Tables do not exist, creating them...');
            return await createDatabaseTables();
        }
        
        throw error;
    }
}

// Test if all required tables exist
async function testDatabaseTables() {
    // Test profiles table
    await supabase.from('profiles').select('id').limit(1);
    
    // Test blogs table  
    await supabase.from('blogs').select('id').limit(1);
    
    // Test comments table
    await supabase.from('comments').select('id').limit(1);
}

// Create all database tables and policies
async function createDatabaseTables() {
    try {
        const { error } = await supabase.rpc('create_blog_schema');
        
        if (error && !error.message.includes('already exists')) {
            throw error;
        }
        
        console.log('Database tables created successfully');
        return true;
    } catch (error) {
        console.error('Failed to create database tables:', error);
        
        // Show user-friendly error message
        showDatabaseSetupError();
        return false;
    }
}

// Show database setup error to user
function showDatabaseSetupError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'database-setup-error';
    errorDiv.innerHTML = `
        <div class="error-card">
            <h3>Database Setup Required</h3>
            <p>Your Supabase database needs to be set up with the required tables.</p>
            <p>Please run the SQL setup script in your Supabase dashboard:</p>
            <ol>
                <li>Go to your Supabase dashboard</li>
                <li>Click "SQL Editor" in the sidebar</li>
                <li>Click "New Query"</li>
                <li>Copy and paste the SQL setup script</li>
                <li>Click "Run" to execute</li>
            </ol>
            <button onclick="window.open('https://supabase.com/dashboard/projects', '_blank')" class="btn btn-primary">
                Open Supabase Dashboard
            </button>
            <button onclick="this.parentElement.parentElement.remove()" class="btn btn-secondary">
                Close
            </button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .database-setup-error {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        }
        .error-card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .error-card h3 {
            color: #e53e3e;
            margin-bottom: 1rem;
        }
        .error-card ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }
        .error-card .btn {
            margin: 0.5rem 0.5rem 0.5rem 0;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(errorDiv);
}

// Enhanced error handling for database operations
function handleDatabaseError(error, operation = '') {
    console.error(`Database error ${operation}:`, error);
    
    // Check for common database issues
    if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        showDatabaseSetupError();
        return;
    }
    
    if (error.code === '42P01') {
        showDatabaseSetupError();
        return;
    }
    
    // Show generic error for other issues
    showToast(`Database error: ${error.message}`, 'error');
}

// Export functions for use in other modules
window.initializeDatabase = initializeDatabase;
window.handleDatabaseError = handleDatabaseError;