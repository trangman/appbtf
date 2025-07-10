# 🚀 Deployment Guide - Netlify + Supabase

## Step 1: Set Up Free PostgreSQL Database (Supabase)

### Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (recommended) or email
3. Create a new project
4. Choose a **region close to your users** (Asia Pacific for Thailand)
5. Set a **strong database password** and save it securely

### Get Database Credentials
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the **Connection String** (URI format)
3. It will look like: `postgresql://postgres:[password]@[host]:5432/postgres`

### Initialize Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Run this command to create your schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER');

-- Create users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create briefs table
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "targetRoles" "UserRole"[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create contact submissions table
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Brief_slug_idx" ON "Brief"("slug");
CREATE INDEX "Brief_isPublished_idx" ON "Brief"("isPublished");
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- Insert sample data (your existing seed data)
INSERT INTO "Brief" ("id", "title", "slug", "content", "description", "targetRoles", "isPublished") VALUES 
('brief-1', 'Foreign Property Ownership Guide for Buyers', 'foreign-property-ownership-guide', 'Your existing brief content...', 'Complete guide for foreign nationals...', ARRAY['BUYER']::"UserRole"[], true);
-- Add your other sample briefs here...
```

## Step 2: Prepare Your App for Deployment

### Update Environment Variables
Create a `.env.local` file with your production values:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="https://your-app-name.netlify.app"
NEXTAUTH_SECRET="your-super-secure-random-string-here"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"
```

### Configure Next.js for Netlify
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Install dependencies: `npm install`

## Step 3: Deploy to Netlify

### Option A: Deploy via Git (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with GitHub
   - Click "New site from Git"
   - Choose your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `.next`
     - **Functions directory**: `netlify/functions`

3. **Add Environment Variables**
   - In Netlify dashboard: **Site settings** → **Environment variables**
   - Add all your environment variables from `.env.local`

### Option B: Manual Deploy

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy with Netlify CLI**
   ```bash
   netlify login
   netlify init
   netlify deploy --prod --dir=.next
   ```

## Step 4: Configure Netlify for Next.js

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Step 5: Database Migration & Seeding

After deployment, run your database setup:

```bash
# Generate Prisma client for production
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Seed with your sample data
npx prisma db seed
```

## Step 6: Verify Deployment

1. **Check your site**: `https://your-app-name.netlify.app`
2. **Test authentication**: Create an account and login
3. **Test AI assistant**: Ask a question to verify OpenAI integration
4. **Test database**: Check that briefs load correctly

## 🛡️ Security Checklist

- ✅ Strong database password set in Supabase
- ✅ NEXTAUTH_SECRET is a secure random string
- ✅ Environment variables set in Netlify (not in code)
- ✅ Database has proper indexes
- ✅ OpenAI API key is secured

## 📊 Free Tier Limits

### Supabase Free Tier:
- ✅ 500MB database storage
- ✅ Up to 2GB bandwidth per month
- ✅ 50MB file uploads
- ✅ Up to 50,000 monthly active users

### Netlify Free Tier:
- ✅ 300 build minutes per month
- ✅ 100GB bandwidth per month
- ✅ Deploy previews
- ✅ Form handling (500 submissions/month)

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version (use 18+)
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase project is active
   - Ensure database schema is created

3. **Auth Issues**
   - Set correct NEXTAUTH_URL
   - Verify NEXTAUTH_SECRET is set
   - Check callback URLs

4. **API Routes Not Working**
   - Ensure `netlify.toml` is configured
   - Check function deployment logs
   - Verify Netlify Functions are enabled

## 📞 Support

- Netlify: [docs.netlify.com](https://docs.netlify.com)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

**Your app should now be live and fully functional!** 🎉 