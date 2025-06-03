// Utility functions

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Older than a week, show formatted date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Truncate text to specified length
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength).trim() + '...';
}

// Sanitize HTML content (basic sanitization)
function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    
    // Allow only basic formatting tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
    
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove script tags and event handlers
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove dangerous attributes
    const allElements = div.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove event handler attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
        
        // Remove elements not in allowed tags
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
            element.replaceWith(...element.childNodes);
        }
    });
    
    return div.innerHTML;
}

// Convert line breaks to HTML paragraphs
function formatTextContent(text) {
    if (!text) return '';
    
    // Split by double line breaks for paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs
        .map(paragraph => {
            // Replace single line breaks with <br>
            const formatted = paragraph.trim().replace(/\n/g, '<br>');
            return formatted ? `<p>${escapeHtml(formatted)}</p>` : '';
        })
        .filter(p => p)
        .join('');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate random ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get URL parameters
function getUrlParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}

// Set URL parameter without page reload
function setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
}

// Remove URL parameter without page reload
function removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' :
                type === 'error' ? 'fas fa-exclamation-circle' :
                type === 'warning' ? 'fas fa-exclamation-triangle' :
                'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Copied to clipboard!', 'success');
            return true;
        } catch (fallbackError) {
            document.body.removeChild(textArea);
            showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Smooth scroll to element
function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.offsetTop - offset;
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }
}

// Local storage helpers
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Theme management
const theme = {
    set: (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        storage.set('theme', themeName);
    },
    
    get: () => {
        return storage.get('theme', 'light');
    },
    
    toggle: () => {
        const currentTheme = theme.get();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        theme.set(newTheme);
        return newTheme;
    },
    
    init: () => {
        const savedTheme = theme.get();
        theme.set(savedTheme);
    }
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    theme.init();
});

// Form validation helpers
const validation = {
    required: (value) => {
        return value && value.trim().length > 0;
    },
    
    email: (value) => {
        return isValidEmail(value);
    },
    
    minLength: (value, length) => {
        return value && value.length >= length;
    },
    
    maxLength: (value, length) => {
        return !value || value.length <= length;
    },
    
    pattern: (value, pattern) => {
        return new RegExp(pattern).test(value);
    }
};

// Error handling for async operations
function handleError(error, context = '') {
    console.error(`Error ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error.message) {
        message = error.message;
    }
    
    showToast(message, 'error');
}