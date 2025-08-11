#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Netlify
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod --dir .next
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "🔗 Your site should be live at: https://legal-brief.netlify.app"
        echo ""
        echo "📋 To test PDF upload:"
        echo "1. Go to https://legal-brief.netlify.app"
        echo "2. Sign in with your admin account"
        echo "3. Navigate to Knowledge Base"
        echo "4. Try uploading a PDF file"
        echo "5. Check the browser console and Netlify function logs for detailed error messages"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi 