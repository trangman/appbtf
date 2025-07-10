# 🔧 Production Environment Setup

## Environment Variables for Netlify

Add these environment variables in your Netlify dashboard under **Site settings** → **Environment variables**:

### Required Variables:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres

# NextAuth Configuration  
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your-super-secure-random-string-minimum-32-characters

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## How to Get These Values:

### 1. DATABASE_URL (Supabase)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 2. NEXTAUTH_SECRET
Generate a secure random string (32+ characters):
```bash
# Option 1: Use OpenSSL
openssl rand -base64 32

# Option 2: Use online generator
# Visit: https://generate-secret.vercel.app/32
```

### 3. NEXTAUTH_URL
- For production: `https://your-app-name.netlify.app`
- Replace `your-app-name` with your actual Netlify site name

### 4. OPENAI_API_KEY
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **API Keys**
3. Create a new API key
4. Copy the key (starts with `sk-`)

## Database Setup Commands

After setting up Supabase and environment variables:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (creates tables)
npx prisma db push

# Seed database with sample data
npx prisma db seed
```

## Security Checklist

- ✅ Use strong, unique database password
- ✅ NEXTAUTH_SECRET is minimum 32 characters
- ✅ All environment variables are set in Netlify (not in code)
- ✅ OpenAI API key has spending limits set
- ✅ Supabase project has proper access controls

## Free Tier Monitoring

### Supabase Limits:
- Database: 500MB storage
- Bandwidth: 2GB/month  
- File uploads: 50MB
- Auth users: 50,000/month

### Netlify Limits:
- Build minutes: 300/month
- Bandwidth: 100GB/month
- Functions: 125,000 calls/month

### OpenAI Limits:
- Check your usage at: [platform.openai.com/usage](https://platform.openai.com/usage)
- Set spending limits to avoid unexpected charges 