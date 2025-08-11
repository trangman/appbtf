#!/usr/bin/env pwsh

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if Netlify CLI is installed
try {
    netlify --version | Out-Null
    Write-Host "✅ Netlify CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Netlify CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Cyan
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

# Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Deploy to Netlify
    Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Cyan
    netlify deploy --prod --dir .next
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "🔗 Your site should be live at: https://legal-brief.netlify.app" -ForegroundColor Blue
        Write-Host ""
        Write-Host "📋 To test PDF upload:" -ForegroundColor Yellow
        Write-Host "1. Go to https://legal-brief.netlify.app"
        Write-Host "2. Sign in with your admin account"
        Write-Host "3. Navigate to Knowledge Base"
        Write-Host "4. Try uploading a PDF file"
        Write-Host "5. Check the browser console and Netlify function logs for detailed error messages"
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
} 