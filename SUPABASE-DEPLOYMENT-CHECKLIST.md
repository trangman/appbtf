# Supabase Database Deployment Checklist

## ✅ Step 1: Database Setup
- [ ] Log into Supabase dashboard at https://supabase.com/dashboard
- [ ] Select your "legal-site" project
- [ ] Go to SQL Editor
- [ ] Copy and paste the entire content from `supabase-migration-corrected.sql`
- [ ] Click "Run" to execute the migration
- [ ] Verify tables were created successfully

## ✅ Step 2: Environment Variables
- [ ] Create `.env.local` file in project root
- [ ] Add your Supabase database connection string:
  ```
  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:[PORT]/postgres"
  ```
- [ ] Add NextAuth secret:
  ```
  NEXTAUTH_SECRET=your-nextauth-secret-key-here
  ```
- [ ] Add OpenAI API key (if using AI features):
  ```
  OPENAI_API_KEY=your-openai-api-key-here
  ```

## ✅ Step 3: Database Connection String
Get your connection details from Supabase:
1. Go to Settings > Database in your Supabase project
2. Copy the connection string
3. Replace placeholders in `.env.local`

## ✅ Step 4: Test the Database
- [ ] Run `npm run dev` to start the development server
- [ ] Check that the app starts without database errors
- [ ] Test basic functionality (registration, login, etc.)

## ✅ Step 5: Create Admin User
After the database is set up, you can create an admin user:
1. Register a new user through the app
2. Use the script in `scripts/set-admin.ts` to make them an admin
3. Or manually update the database to set `isAdmin = true`

## 🔧 Fixed Issues
- ✅ Fixed table name mismatch (`KnowledgeDocument` → `knowledge_documents`)
- ✅ Added missing `knowledge_documents` table
- ✅ Added missing `isAdmin` field to users table
- ✅ Corrected all table names to match Prisma schema

## 📋 What's in the Database
The migration creates:
- `users` table with authentication and role information
- `briefs` table with legal briefs and content
- `knowledge_documents` table for uploaded documents
- `contact_submissions` table for contact form submissions
- Sample legal briefs for different user roles
- Proper indexes for performance
- Auto-updating timestamps

## 🚀 Next Steps
Once the database is set up, you can:
1. Test the application locally
2. Deploy to production (Netlify/Vercel)
3. Set up domain and SSL
4. Configure email providers
5. Set up analytics and monitoring 