# Blog Hub

A modern, responsive blog platform built with vanilla JavaScript and Supabase. Features include user authentication, blog post creation and editing, real-time commenting, and a clean, professional interface.

## Features

### Core Functionality
- **User Authentication**: Secure signup, login, and logout with email verification
- **Blog Management**: Create, edit, delete, and publish blog posts
- **Real-time Comments**: Live commenting system with instant updates
- **Search**: Search through published blog posts
- **User Profiles**: Personal dashboards showing published posts and drafts
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Technical Features
- **Vanilla JavaScript**: No frameworks, pure JavaScript ES6+
- **Supabase Integration**: Authentication, database, and real-time subscriptions
- **Modern CSS**: Clean, accessible design with dark mode support
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Security**: XSS protection, input sanitization, and secure authentication

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **Styling**: Modern CSS with CSS Variables and Grid/Flexbox
- **Icons**: Font Awesome 6
- **Hosting**: Static hosting compatible (Netlify, Vercel, GitHub Pages)

## Getting Started

### Prerequisites

1. A Supabase account and project
2. A web server (for local development, you can use Python's built-in server or any static file server)

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be fully initialized

2. **Get Your Project Credentials**
   - In your project dashboard, click the "Connect" button
   - Copy the Project URL and Anon Key
   - You'll need these for the configuration

3. **Database Schema**
   
   Run these SQL commands in the Supabase SQL Editor:

   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     full_name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create blogs table
    CREATE TABLE IF NOT EXISTS blogs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     image_url TEXT NOT NULL,
     is_published BOOLEAN DEFAULT FALSE,
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );


   -- Create comments table
    CREATE TABLE IF NOT EXISTS comments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );


   -- RLS Policies for profiles
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Public profiles are viewable by everyone" ON profiles
     FOR SELECT USING (true);

   CREATE POLICY "Users can insert their own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can update their own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);

   -- RLS Policies for blogs
   ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Published blogs are viewable by everyone" ON blogs
     FOR SELECT USING (is_published = true OR auth.uid() = user_id);

   CREATE POLICY "Users can insert their own blogs" ON blogs
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own blogs" ON blogs
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own blogs" ON blogs
     FOR DELETE USING (auth.uid() = user_id);

   -- RLS Policies for comments
   ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Comments are viewable by everyone" ON comments
     FOR SELECT USING (true);

   CREATE POLICY "Authenticated users can insert comments" ON comments
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Users can delete their own comments" ON comments
     FOR DELETE USING (auth.uid() = user_id);

   -- Function to handle user profile creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name)
     VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Trigger to create profile on signup
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

   -- Indexes for better performance
   CREATE INDEX blogs_user_id_idx ON blogs(user_id);
   CREATE INDEX blogs_published_idx ON blogs(is_published);
   CREATE INDEX blogs_created_at_idx ON blogs(created_at);
   CREATE INDEX comments_blog_id_idx ON comments(blog_id);
   CREATE INDEX comments_user_id_idx ON comments(user_id);
   ```

4. **Configure Real-time** (Optional but recommended)
   - In your Supabase dashboard, go to Settings > API
   - Enable Realtime for the `comments` table

### Application Setup

1. **Clone or Download the Project**
   ```bash
   git clone <repository-url>
   cd blog-hub
   ```

2. **Configure Supabase Connection**
   
   Edit `js/supabaseClient.js` and replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'your-project-url-here';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

3. **Start a Local Server**
   
   Using Python:
   ```bash
   # Python 3
   python -m http.server 5000
   
   # Python 2
   python -m SimpleHTTPServer 5000
   ```
   
   Using Node.js:
   ```bash
   npx serve -p 5000
   