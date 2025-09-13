# Tasks & Calendar App

A modern task management application with calendar integration, built with Next.js, Supabase, and Clerk.

## Features

- ✅ Create, edit, and delete tasks
- 📅 Calendar view with task indicators
- 🔥 Priority levels (High, Medium, Low) with visual indicators
- 📱 Responsive design
- 🔐 User authentication with Clerk
- 💾 Persistent data storage with Supabase
- 🌙 Dark mode support

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd claudecode-first-project
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run this command to create the tasks table:

```sql
-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy: users can insert their own tasks
CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy: users can update their own tasks
CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy: users can delete their own tasks
CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid()::text = user_id);
```

3. Get your Supabase credentials from Settings → API

### 3. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Choose your authentication methods (email/password, Google, etc.)
3. Get your API keys from the dashboard

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables to your Vercel project settings
4. Deploy!

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Modules
- **Deployment**: Vercel

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── Calendar.tsx
│   │   └── TaskList.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── page.module.css
├── lib/
│   ├── database.ts
│   ├── supabase.ts
│   └── types.ts
├── middleware.ts
└── ...
```