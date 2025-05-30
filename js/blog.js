// Blog management module

// Create new blog post
async function createBlog(blogData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                title: blogData.title,
                content: blogData.content,
                is_published: blogData.is_published || false,
                user_id: user.id
            }])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error creating blog:', error);
        throw error;
    }
}

// Update existing blog post
async function updateBlog(blogId, blogData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('blogs')
            .update({
                title: blogData.title,
                content: blogData.content,
                is_published: blogData.is_published,
                updated_at: new Date().toISOString()
            })
            .eq('id', blogId)
            .eq('user_id', user.id) // Ensure user owns the blog
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error updating blog:', error);
        throw error;
    }
}

// Delete blog post
async function deleteBlog(blogId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', blogId)
            .eq('user_id', user.id); // Ensure user owns the blog

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting blog:', error);
        throw error;
    }
}

// Get all published blogs
async function getAllBlogs(limit = 20, offset = 0) {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select(`
                *,
                profiles!blogs_user_id_fkey(full_name),
                comments(count)
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching blogs:', error);
        throw error;
    }
}

// Get blog by ID
async function getBlogById(blogId) {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select(`
                *,
                profiles!blogs_user_id_fkey(full_name)
            `)
            .eq('id', blogId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching blog:', error);
        throw error;
    }
}

// Get user's blogs
async function getUserBlogs(userId, isPublished = null) {
    try {
        let query = supabase
            .from('blogs')
            .select(`
                *,
                comments(count)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (isPublished !== null) {
            query = query.eq('is_published', isPublished);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching user blogs:', error);
        throw error;
    }
}

// Search blogs
async function searchBlogs(query, limit = 20) {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select(`
                *,
                profiles!blogs_user_id_fkey(full_name),
                comments(count)
            `)
            .eq('is_published', true)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error searching blogs:', error);
        throw error;
    }
}

// Get user statistics
async function getUserStats(userId) {
    try {
        // Get published count
        const { data: publishedData, error: publishedError } = await supabase
            .from('blogs')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_published', true);

        if (publishedError) throw publishedError;

        // Get draft count
        const { data: draftData, error: draftError } = await supabase
            .from('blogs')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_published', false);

        if (draftError) throw draftError;

        // Get total comments on user's blogs
        const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .select('id', { count: 'exact' })
            .in('blog_id', 
                await supabase
                    .from('blogs')
                    .select('id')
                    .eq('user_id', userId)
                    .then(({ data }) => data?.map(blog => blog.id) || [])
            );

        if (commentError) throw commentError;

        return {
            published_count: publishedData?.length || 0,
            draft_count: draftData?.length || 0,
            total_comments: commentData?.length || 0
        };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
            published_count: 0,
            draft_count: 0,
            total_comments: 0
        };
    }
}

// Load and display blogs on homepage
async function loadBlogs() {
    const postsContainer = document.getElementById('blog-posts');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-state');
    const emptyElement = document.getElementById('empty-state');

    try {
        // Show loading state
        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';
        if (emptyElement) emptyElement.style.display = 'none';
        if (postsContainer) postsContainer.innerHTML = '';

        const blogs = await getAllBlogs();

        // Hide loading state
        if (loadingElement) loadingElement.style.display = 'none';

        if (blogs.length === 0) {
            if (emptyElement) emptyElement.style.display = 'flex';
            return;
        }

        // Display blogs
        if (postsContainer) {
            postsContainer.innerHTML = blogs.map(blog => createBlogCard(blog)).join('');
        }

    } catch (error) {
        console.error('Error loading blogs:', error);
        
        // Show error state
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
    }
}

// Search blogs and display results
async function searchBlogs(query) {
    const postsContainer = document.getElementById('blog-posts');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-state');
    const emptyElement = document.getElementById('empty-state');

    try {
        // Show loading state
        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';
        if (emptyElement) emptyElement.style.display = 'none';
        if (postsContainer) postsContainer.innerHTML = '';

        const blogs = await searchBlogs(query);

        // Hide loading state
        if (loadingElement) loadingElement.style.display = 'none';

        if (blogs.length === 0) {
            if (postsContainer) {
                postsContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>No posts found for "${escapeHtml(query)}"</p>
                        <p class="no-results-subtitle">Try different keywords or browse all posts</p>
                    </div>
                `;
            }
            return;
        }

        // Display search results
        if (postsContainer) {
            postsContainer.innerHTML = blogs.map(blog => createBlogCard(blog)).join('');
        }

    } catch (error) {
        console.error('Error searching blogs:', error);
        
        // Show error state
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
    }
}

// Create blog card HTML
function createBlogCard(blog) {
    const authorName = blog.profiles?.full_name || 'Anonymous';
    const commentCount = blog.comments?.[0]?.count || 0;
    
    return `
        <article class="blog-card">
            <div class="blog-card-header">
                <h2 class="blog-card-title">
                    <a href="blog.html?id=${blog.id}">${escapeHtml(blog.title)}</a>
                </h2>
            </div>
            
            <div class="blog-card-content">
                <p>${escapeHtml(truncateText(blog.content, 200))}</p>
            </div>
            
            <div class="blog-card-footer">
                <div class="blog-card-meta">
                    <div class="author-info">
                        <i class="fas fa-user"></i>
                        <span>${escapeHtml(authorName)}</span>
                    </div>
                    <div class="blog-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(blog.created_at)}</span>
                    </div>
                    <div class="blog-comments">
                        <i class="fas fa-comments"></i>
                        <span>${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}</span>
                    </div>
                </div>
                
                <a href="blog.html?id=${blog.id}" class="read-more-btn">
                    Read More <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    `;
}
