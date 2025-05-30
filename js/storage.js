// Storage management module for Supabase Storage

// Upload file to Supabase Storage
async function uploadFile(file, bucket = 'blog-assets', folder = 'uploads') {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Get public URL for uploaded file
async function getFileUrl(filePath, bucket = 'blog-assets') {
    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        throw error;
    }
}

// Delete file from storage
async function deleteFile(filePath, bucket = 'blog-assets') {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Upload image and get URL
async function uploadImage(imageFile) {
    try {
        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Validate file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
            throw new Error('Image must be smaller than 5MB');
        }

        const uploadResult = await uploadFile(imageFile, 'blog-assets', 'images');
        const imageUrl = await getFileUrl(uploadResult.path, 'blog-assets');
        
        return {
            path: uploadResult.path,
            url: imageUrl
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Create image upload widget
function createImageUploader(containerId, onUpload) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const uploaderHTML = `
        <div class="image-uploader">
            <input type="file" id="image-input" accept="image/*" style="display: none;">
            <div class="upload-area" id="upload-area">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload image or drag and drop</p>
                <small>PNG, JPG, GIF up to 5MB</small>
            </div>
            <div class="upload-progress" id="upload-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <p id="progress-text">Uploading...</p>
            </div>
            <div class="upload-preview" id="upload-preview" style="display: none;">
                <img id="preview-image" alt="Preview">
                <div class="preview-actions">
                    <button type="button" class="btn btn-small btn-danger" onclick="removeUploadedImage()">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = uploaderHTML;

    const fileInput = document.getElementById('image-input');
    const uploadArea = document.getElementById('upload-area');
    const progressDiv = document.getElementById('upload-progress');
    const previewDiv = document.getElementById('upload-preview');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // Handle image upload
    async function handleImageUpload(file) {
        try {
            // Show progress
            uploadArea.style.display = 'none';
            progressDiv.style.display = 'block';

            const result = await uploadImage(file);

            // Show preview
            progressDiv.style.display = 'none';
            previewDiv.style.display = 'block';
            
            const previewImg = document.getElementById('preview-image');
            previewImg.src = result.url;

            // Call callback
            if (onUpload) {
                onUpload(result);
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image: ' + error.message);
            
            // Reset to upload area
            progressDiv.style.display = 'none';
            uploadArea.style.display = 'block';
        }
    }

    // Remove uploaded image
    window.removeUploadedImage = () => {
        previewDiv.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
        
        if (onUpload) {
            onUpload(null);
        }
    };
}

// Save blog content as file (for backup/export)
async function saveBlogAsFile(blog) {
    try {
        const content = `# ${blog.title}

**Author:** ${blog.profiles?.full_name || 'Anonymous'}
**Date:** ${formatDate(blog.created_at)}

---

${blog.content}
`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const uploadResult = await uploadFile(blob, 'blog-exports', 'exports');
        const fileUrl = await getFileUrl(uploadResult.path, 'blog-exports');
        
        return {
            path: uploadResult.path,
            url: fileUrl
        };
    } catch (error) {
        console.error('Error saving blog as file:', error);
        throw error;
    }
}

// List user's uploaded files
async function getUserFiles(userId, bucket = 'blog-assets', folder = null) {
    try {
        const folderPath = folder ? `${folder}/${userId}` : userId;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folderPath);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error listing user files:', error);
        throw error;
    }
}

// Get storage usage for user
async function getUserStorageUsage(userId) {
    try {
        const files = await getUserFiles(userId);
        let totalSize = 0;
        
        for (const file of files) {
            if (file.metadata?.size) {
                totalSize += file.metadata.size;
            }
        }

        return {
            fileCount: files.length,
            totalSize: totalSize,
            totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
    } catch (error) {
        console.error('Error getting storage usage:', error);
        return {
            fileCount: 0,
            totalSize: 0,
            totalSizeMB: 0
        };
    }
}
