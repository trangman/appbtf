#!/bin/bash

# Legal Briefs App - Production Deployment Script
echo "🚀 Starting deployment process..."

# Check if required tools are installed
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL not set. Make sure to set it in Netlify."
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  Warning: NEXTAUTH_SECRET not set. Make sure to set it in Netlify."
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set. Make sure to set it in Netlify."
fi

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Deploy to production'"
    echo "   git push origin main"
    echo ""
    echo "2. Set up Supabase database:"
    echo "   - Run the SQL script in supabase-migration.sql"
    echo ""
    echo "3. Configure Netlify environment variables:"
    echo "   - DATABASE_URL (from Supabase)"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - NEXTAUTH_URL (your Netlify site URL)"
    echo "   - OPENAI_API_KEY (from OpenAI)"
    echo ""
    echo "4. Deploy to Netlify:"
    echo "   - Connect your GitHub repo"
    echo "   - Deploy automatically"
    echo ""
    echo "🎉 Ready for production deployment!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 