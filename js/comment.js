// Comments management module

// Add a new comment
async function addComment(blogId, content) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                blog_id: blogId,
                user_id: user.id,
                content: content.trim()
            }])
            .select(`
                *,
                profiles!user_id(full_name)
            `)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}

// Get comments for a blog post
async function getComments(blogId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles!user_id(full_name)
            `)
            .eq('blog_id', blogId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

// Delete a comment
async function deleteComment(commentId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id); // Ensure user owns the comment

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}

// Load and display comments
async function loadComments() {
    const commentsContainer = document.getElementById('comments-list');
    const loadingElement = document.getElementById('comments-loading');
    const noCommentsElement = document.getElementById('no-comments');
    
    if (!currentBlogId) return;

    try {
        // Show loading state
        if (loadingElement) loadingElement.style.display = 'flex';
        if (noCommentsElement) noCommentsElement.style.display = 'none';
        if (commentsContainer) commentsContainer.innerHTML = '';

        const comments = await getComments(currentBlogId);

        // Hide loading state
        if (loadingElement) loadingElement.style.display = 'none';

        if (comments.length === 0) {
            if (noCommentsElement) noCommentsElement.style.display = 'block';
            return;
        }

        // Display comments
        if (commentsContainer) {
            commentsContainer.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
        }

    } catch (error) {
        console.error('Error loading comments:', error);
        
        // Hide loading state and show error
        if (loadingElement) loadingElement.style.display = 'none';
        if (commentsContainer) {
            commentsContainer.innerHTML = `
                <div class="comment-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load comments. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Create comment HTML
function createCommentHTML(comment) {
    const authorName = comment.profiles?.full_name || 'Anonymous';
    const isOwnComment = currentUser && currentUser.id === comment.user_id;
    
    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <i class="fas fa-user-circle"></i>
                    <span class="author-name">${escapeHtml(authorName)}</span>
                </div>
                <div class="comment-meta">
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                    ${isOwnComment ? `
                        <button class="comment-delete" onclick="handleDeleteComment('${comment.id}')" title="Delete comment">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="comment-content">
                <p>${escapeHtml(comment.content).replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    `;
}

// Handle comment deletion
async function handleDeleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await deleteComment(commentId);
        
        // Remove comment from DOM
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }

        // Check if no comments left
        const remainingComments = document.querySelectorAll('.comment');
        if (remainingComments.length === 0) {
            document.getElementById('no-comments').style.display = 'block';
        }

    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
    }
}

// Setup real-time comment updates
function setupRealtimeComments() {
    if (!currentBlogId) return;

    // Subscribe to comment changes for this blog
    const commentSubscription = supabase
        .channel('comments')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `blog_id=eq.${currentBlogId}`
            },
            (payload) => {
                handleNewComment(payload.new);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'comments',
                filter: `blog_id=eq.${currentBlogId}`
            },
            (payload) => {
                handleDeletedComment(payload.old.id);
            }
        )
        .subscribe();

    // Store subscription for cleanup
    window.commentSubscription = commentSubscription;
}

// Handle new comment received via real-time
async function handleNewComment(commentData) {
    try {
        // Get full comment data with profile info
        const { data: fullComment, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles!user_id(full_name)
            `)
            .eq('id', commentData.id)
            .single();

        if (error) throw error;

        // Don't add if it's from current user (already added via form submission)
        if (currentUser && fullComment.user_id === currentUser.id) {
            return;
        }

        const commentsContainer = document.getElementById('comments-list');
        const noCommentsElement = document.getElementById('no-comments');

        if (noCommentsElement) noCommentsElement.style.display = 'none';

        if (commentsContainer) {
            // Add new comment to the end
            const commentHTML = createCommentHTML(fullComment);
            commentsContainer.insertAdjacentHTML('beforeend', commentHTML);

            // Scroll to new comment
            const newCommentElement = commentsContainer.lastElementChild;
            if (newCommentElement) {
                newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Add highlight animation
                newCommentElement.classList.add('comment-new');
                setTimeout(() => {
                    newCommentElement.classList.remove('comment-new');
                }, 2000);
            }
        }

    } catch (error) {
        console.error('Error handling new comment:', error);
    }
}

// Handle deleted comment received via real-time
function handleDeletedComment(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
        commentElement.remove();
    }

    // Check if no comments left
    const remainingComments = document.querySelectorAll('.comment');
    if (remainingComments.length === 0) {
        document.getElementById('no-comments').style.display = 'block';
    }
}

// Cleanup real-time subscriptions
function cleanupRealtimeComments() {
    if (window.commentSubscription) {
        supabase.removeChannel(window.commentSubscription);
        window.commentSubscription = null;
    }
}

// Setup comment form submission with real-time updates
function setupCommentFormWithRealtime() {
    const form = document.getElementById('comment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const textarea = document.getElementById('comment-text');
        const content = textarea.value.trim();
        
        if (!content) return;

        try {
            // Disable form during submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

            const newComment = await addComment(currentBlogId, content);
            
            // Clear form
            textarea.value = '';

            // Add comment to UI immediately (for current user)
            const commentsContainer = document.getElementById('comments-list');
            const noCommentsElement = document.getElementById('no-comments');

            if (noCommentsElement) noCommentsElement.style.display = 'none';

            if (commentsContainer) {
                const commentHTML = createCommentHTML(newComment);
                commentsContainer.insertAdjacentHTML('beforeend', commentHTML);

                // Scroll to new comment
                const newCommentElement = commentsContainer.lastElementChild;
                if (newCommentElement) {
                    newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
            
            // Re-enable form
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
        }
    });
}

// Initialize comments system with real-time updates
function initializeCommentsWithRealtime() {
    loadComments();
    setupRealtimeComments();
    setupCommentFormWithRealtime();
}

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
    cleanupRealtimeComments();
});
